# WalletBox

WalletBox is an early-stage full-stack digital-wallet and fintech starter with a responsive React dashboard, an Express/TypeScript API, Prisma/PostgreSQL data model, JWT authentication scaffolding, and an admin overview.

## Project layout

- `apps/web` — React + TypeScript + Vite responsive dashboard
- `apps/api` — Express API, authentication middleware, Prisma schema
- `.env.example` — local environment template
- `docs/PROJECT_STATUS.md` — capabilities, setup notes, and launch limitations

## Requirements
- Node.js 20+
- PostgreSQL
- npm

## Local setup

1. Clone this repository and install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to a development PostgreSQL database.
4. Replace `JWT_SECRET` with a random secret of at least 32 characters.
5. Run `npm run db:generate`, then review and apply the Prisma migration using `npm run db:migrate`.
6. Start the API using `npm run dev:api` and the web app using `npm run dev:web`.

## API endpoints currently scaffolded

- `GET /api/health`
- `GET /api/assets`
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/me`, `GET /api/wallets`, `GET /api/transactions`
- Pending request endpoints for deposits, withdrawals, bill payments, cards, and exchanges
- Admin overview, pending requests, and audit log endpoints

## Financial safety notice

**Not production-ready. Do not use this starter to accept or move real funds.** Payment, crypto, KYC/AML, virtual-card, bill-payment, and payout providers are intentionally disconnected. Financial request endpoints record pending requests only and must never be treated as completed payments. Demo UI activity is illustrative.

Before any production use, implement and independently review: a complete double-entry ledger with database-level atomicity and balance invariants; transaction idempotency and replay protection; verified provider webhooks and reconciliation; withdrawal approvals and limits; secure session lifecycle, MFA and account recovery; KYC/AML and sanctions controls; audit retention and alerting; automated integration/security tests; and disaster recovery.

## Verification

The repository was populated through the GitHub integration. No production build, database migration, automated test suite, or independent security audit has been verified in this environment.
