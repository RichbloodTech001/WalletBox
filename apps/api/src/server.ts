import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./db.js";
import { requireAuth, requireAdmin, signToken } from "./auth.js";

const app = express();
const port = Number(process.env.PORT || 4000);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: (process.env.WEB_ORIGIN || "http://localhost:5173").split(","), methods: ["GET", "POST", "PATCH"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "32kb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

const registerSchema = z.object({ email: z.string().email().max(254), password: z.string().min(10).max(128), fullName: z.string().trim().min(2).max(100) });
const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) });
const requestSchema = z.object({ amountMinor: z.number().int().positive().max(100_000_000_000), currency: z.enum(["NGN", "USD", "BTC", "ETH", "USDT"]), idempotencyKey: z.string().min(12).max(100), destination: z.string().max(200).optional() });

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "walletbox-api", mode: "provider-disconnected", timestamp: new Date().toISOString() }));
app.get("/api/assets", (_req, res) => res.json({ assets: [
  { symbol: "NGN", name: "Nigerian Naira", type: "FIAT", decimals: 2, enabled: true },
  { symbol: "USD", name: "US Dollar", type: "FIAT", decimals: 2, enabled: true },
  { symbol: "BTC", name: "Bitcoin", type: "CRYPTO", decimals: 8, enabled: false },
  { symbol: "ETH", name: "Ethereum", type: "CRYPTO", decimals: 18, enabled: false },
  { symbol: "USDT", name: "Tether USD", type: "CRYPTO", decimals: 6, enabled: false }
] }));

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const email = input.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return res.status(409).json({ error: "An account with this email already exists." });
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({ data: { email, passwordHash, fullName: input.fullName, isAdmin: adminEmails.includes(email), wallets: { create: { asset: { connectOrCreate: { where: { symbol: "NGN" }, create: { symbol: "NGN", name: "Nigerian Naira", type: "FIAT", decimals: 2 } } }, ledgerAccount: { create: { currency: "NGN", balanceMinor: 0n } } } }, auditEvents: { create: { action: "ACCOUNT_REGISTERED", targetType: "User" } } }, select: { id: true, email: true, fullName: true, isAdmin: true } });
    const token = signToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
    return res.status(201).json({ token, user });
  } catch (e) { next(e); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: "Email or password is incorrect." });
    const token = signToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
    await prisma.auditLog.create({ data: { actorId: user.id, action: "ACCOUNT_LOGIN", targetType: "User", targetId: user.id } });
    return res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, isAdmin: user.isAdmin } });
  } catch (e) { next(e); }
});

app.get("/api/me", requireAuth, async (req, res, next) => {
  try { const user = await prisma.user.findUnique({ where: { id: req.authUser!.id }, select: { id: true, email: true, fullName: true, status: true, isAdmin: true, kycStatus: true, createdAt: true } }); res.json({ user }); }
  catch (e) { next(e); }
});

app.get("/api/wallets", requireAuth, async (req, res, next) => {
  try {
    const wallets = await prisma.wallet.findMany({ where: { userId: req.authUser!.id }, include: { asset: true, ledgerAccount: true }, orderBy: { createdAt: "asc" } });
    res.json({ wallets: wallets.map(w => ({ id: w.id, symbol: w.asset.symbol, name: w.asset.name, type: w.asset.type, status: w.status, balanceMinor: (w.ledgerAccount?.balanceMinor ?? 0n).toString(), decimals: w.asset.decimals })) });
  } catch (e) { next(e); }
});

app.get("/api/transactions", requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.ledgerTransaction.findMany({ where: { initiatedById: req.authUser!.id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, type: true, status: true, currency: true, amountMinor: true, description: true, createdAt: true } });
    res.json({ transactions: items.map(t => ({ ...t, amountMinor: t.amountMinor.toString() })) });
  } catch (e) { next(e); }
});

app.post("/api/requests/deposit", requireAuth, async (req, res, next) => createRequest(req, res, next, "DEPOSIT"));
app.post("/api/requests/withdrawal", requireAuth, async (req, res, next) => createRequest(req, res, next, "WITHDRAWAL"));
app.post("/api/requests/bill-payment", requireAuth, async (req, res, next) => createRequest(req, res, next, "BILL_PAYMENT"));
app.post("/api/requests/card", requireAuth, async (req, res, next) => createRequest(req, res, next, "CARD_REQUEST"));
app.post("/api/requests/exchange", requireAuth, async (req, res, next) => createRequest(req, res, next, "EXCHANGE_ORDER"));
async function createRequest(req: express.Request, res: express.Response, next: express.NextFunction, type: "DEPOSIT"|"WITHDRAWAL"|"BILL_PAYMENT"|"CARD_REQUEST"|"EXCHANGE_ORDER") {
  try {
    const input = requestSchema.parse(req.body);
    const request = await prisma.financialRequest.create({ data: { userId: req.authUser!.id, type, currency: input.currency, amountMinor: BigInt(input.amountMinor), idempotencyKey: `${req.authUser!.id}:${input.idempotencyKey}`, destination: input.destination, metadata: { providerConnected: false, simulation: true } } });
    await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: `${type}_REQUEST_CREATED`, targetType: "FinancialRequest", targetId: request.id } });
    res.status(202).json({ request: { id: request.id, type: request.type, status: request.status, currency: request.currency, amountMinor: request.amountMinor.toString(), createdAt: request.createdAt }, message: "Request recorded as pending. No money moved; provider is not connected." });
  } catch (e) { next(e); }
}

app.get("/api/requests", requireAuth, async (req, res, next) => {
  try { const requests = await prisma.financialRequest.findMany({ where: { userId: req.authUser!.id }, orderBy: { createdAt: "desc" }, take: 50 }); res.json({ requests: requests.map(r => ({ ...r, amountMinor: r.amountMinor.toString(), feeMinor: r.feeMinor.toString() })) }); }
  catch (e) { next(e); }
});

app.get("/api/admin/overview", requireAuth, requireAdmin, async (_req, res, next) => {
  try { const [users, pendingRequests, pendingKyc] = await Promise.all([prisma.user.count(), prisma.financialRequest.count({ where: { status: "PENDING" } }), prisma.kycCase.count({ where: { status: "PENDING" } })]); res.json({ users, pendingRequests, pendingKyc, liveProvidersConnected: false }); }
  catch (e) { next(e); }
});
app.get("/api/admin/requests", requireAuth, requireAdmin, async (_req, res, next) => {
  try { const requests = await prisma.financialRequest.findMany({ where: { status: "PENDING" }, include: { user: { select: { email: true, fullName: true } } }, orderBy: { createdAt: "asc" }, take: 100 }); res.json({ requests: requests.map(r => ({ ...r, amountMinor: r.amountMinor.toString(), feeMinor: r.feeMinor.toString() })) }); }
  catch (e) { next(e); }
});
app.get("/api/admin/audit", requireAuth, requireAdmin, async (_req, res, next) => {
  try { const events = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { actor: { select: { email: true } } } }); res.json({ events }); }
  catch (e) { next(e); }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid request.", details: err.issues.map(i => ({ path: i.path.join("."), message: i.message })) });
  if (typeof err === "object" && err && "code" in err && (err as {code?: string}).code === "P2002") return res.status(409).json({ error: "This request has already been recorded." });
  console.error("API error", err instanceof Error ? err.message : "Unknown error");
  return res.status(500).json({ error: "Unexpected server error." });
});

const server = app.listen(port, () => console.log(`WalletBox API listening on :${port}`));
process.on("SIGTERM", () => { server.close(() => { void prisma.$disconnect(); }); });
