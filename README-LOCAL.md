# Market Rental Management, local browser mode

No PostgreSQL, DATABASE_URL, database migration, or API server is needed.

## Windows quick start
From the project directory:

```powershell
npm install
npm run dev
```

Open the Vite URL (usually http://localhost:5173).

## Login
This offline demonstration automatically loads a local administrator session. If you log out, enter any email and password to return to the local administrator account. **This is not secure authentication.** Do not use this local-only mode as a multi-user production financial system.

## Data safety
All data is stored under `market_rental_offline_v1` in this browser profile's localStorage. Refreshing or closing the browser normally preserves it. Clearing site data, using private mode, or switching browsers/devices can remove access to stored records. Use Settings > Download Backup regularly. Restore using Settings > Restore Backup (replaces all locally stored market records).

## Limitations
- Single-device / single-browser profile only, no real access-control or secure login.
- Payment allocation uses oldest outstanding tenant charges, regardless of particular contract. Prepayments beyond already accrued rent are blocked.
- The current UI input dates are ISO Gregorian; Dari/Pashto displays use Solar Hijri format.
- No automatic financial ledger entries for partner capital or tenant deposits.
- Profit approvals are manually entered, not computed from an audited close of accounts.
- No multi-device synchronization, PostgreSQL persistence, native XLSX/PDF export, or cryptographically protected records.
- For production usage, the database-backed edition and formal testing are necessary.
