# WalletBox — Project Status

WalletBox is an early-stage digital wallet and fintech application starter. The source package is organized as a TypeScript monorepo with a React web app and an Express API backed by Prisma/PostgreSQL.

## Included in the source package

- Responsive wallet dashboard UI
- Express API starter and health endpoint
- Prisma data model for users, wallets, ledger entries, and related records
- Authentication scaffolding
- Ledger test starter
- Environment variable example and setup documentation

## Local setup

1. Extract the `walletbox-complete-source.zip` project package.
2. Copy `.env.example` to `.env` and configure a PostgreSQL connection string.
3. Install dependencies from the repository root with `npm install`.
4. Review the README and Prisma schema before running migrations.

## Important safety status

This starter is not production-ready for real money. Payment, crypto, identity verification, virtual card, and payout providers are not connected. Demo balances are illustrative. Do not accept deposits or process withdrawals until authentication and authorization, ledger concurrency controls, idempotency, provider webhook verification, reconciliation, audit logging, automated tests, and an independent security review are complete.

## Verification status

The source package was ZIP-integrity checked, but the app build, automated tests, and database migrations have not been verified in this environment.