# Market Rental central admin - phase 1

This patch builds an independent **central control service** in PostgreSQL. It does **not** migrate rental records from LocalStorage, and does **not** yet enforce licenses in the customer application. Do not treat this stage as production-ready multi-tenant accounting or offline license enforcement.

## What is included
- Independent super-admin login with scrypt-hashed password, token hashing and 8-hour sessions.
- Organizations: list, create, suspend/reactivate.
- One license per organization: trial/monthly/annual/lifetime, validity date, maximum devices (configuration only).
- Admin audit log.
- Dark-mode, RTL, mobile-friendly web panel served at `/central-admin/` by Express.

## Local setup (from project root)
1. Back up all existing data. Do not replace or upload a real `.env` file.
2. Run `npm install`.
3. Copy `.env.example` to `.env`. Set PostgreSQL `DATABASE_URL`, and choose unique, strong `SEED_ADMIN_PASSWORD` and `CENTRAL_ADMIN_PASSWORD` (at least 16 characters for central admin).
4. Create the database and run `npm run db:migrate`.
5. Run `npm run server` and visit `http://localhost:3001/central-admin/`.
6. After first successful login, remove `CENTRAL_ADMIN_PASSWORD` from `.env`. Keep PostgreSQL credentials outside Git.

## Deployment
- This Express service must run on a Node host with persistent network connectivity to PostgreSQL. A static Vercel Vite deployment **will not** execute `server/index.js` just because these files exist.
- Use HTTPS behind a reverse proxy; restrict `/central-admin/` where possible; secure the database from public access and configure SSL as appropriate for the database provider.
- Back up PostgreSQL independently. Migrations must be run as a deployment step before starting the service.
- Current legacy market API does NOT yet scope rental data by organization; **do not expose it to multiple customers** until tenant isolation and server-side authorization are implemented.
- Current customer frontend still uses LocalStorage; customer logins, devices, subscription enforcement and syncing are a later phase.

## Next phase
Implement tenant IDs and strict organization-scoped database queries, user-to-organization mapping, authenticated license checks, registered device approval, migration of local backups to PostgreSQL, and an offline reconciliation protocol. Test accounting reconciliation before allowing production writes.
