import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";

export type AuthUser = { id: string; email: string; isAdmin: boolean };
declare global { namespace Express { interface Request { authUser?: AuthUser } } }

export function signToken(user: AuthUser) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters.");
  return jwt.sign(user, secret, { expiresIn: process.env.JWT_EXPIRES_IN || "2h", issuer: "walletbox-api", audience: "walletbox-web" });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const raw = req.header("authorization");
  if (!raw?.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required." });
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error("JWT secret not configured");
    const claims = jwt.verify(raw.slice(7), secret, { issuer: "walletbox-api", audience: "walletbox-web" }) as AuthUser;
    const user = await prisma.user.findUnique({ where: { id: claims.id }, select: { id: true, email: true, isAdmin: true, status: true } });
    if (!user || user.status !== "ACTIVE") return res.status(401).json({ error: "Account unavailable." });
    req.authUser = { id: user.id, email: user.email, isAdmin: user.isAdmin };
    next();
  } catch { return res.status(401).json({ error: "Invalid or expired session." }); }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser?.isAdmin) return res.status(403).json({ error: "Administrator access required." });
  next();
}
