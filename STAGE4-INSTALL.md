# Stage 4: Central license activation and device approval

## What is implemented
- Central Admin customer profile has a new button to generate/rotate an activation code. The plaintext code appears once; database holds SHA-256 hash only.
- `/api/client-access/activate`: registers a pending device using code and locally generated identifier.
- `/api/client-access/check`: verifies active organization, valid license, approved device. Blocked, pending, expired or suspended returns 403.
- Optional frontend license activation screen, enabled with `VITE_LICENSE_ENFORCED=true` at frontend BUILD time. It checks license at startup and each 60 seconds, online.
- The financial system is **still browser-local**. This is a UI-level gate and cannot be considered a secure server-side denial of financial APIs.

## Install
1. Back up project and PostgreSQL. Merge files keeping their paths.
2. Leave DATABASE_URL only in local .env (do not publish it). Start PostgreSQL.
3. Run `node --env-file=.env server/migrate.js`.
4. Run `node --env-file=.env server/index.js`.
5. Open `http://localhost:3001/central-admin/`, create customer + active license with valid dates, open customer profile and generate activation code; copy it privately.
6. Open `http://localhost:3001/central-admin/` → devices after a client registers, click Approve.
7. For testing the frontend, add `VITE_LICENSE_ENFORCED=true` to `.env` and restart `npm run dev`. Vite proxies `/api/client-access` to localhost:3001. Open http://localhost:5173 and enter activation code, then approve device, refresh.
8. For production, ensure `/api/client-access` is reverse-proxied to your secure backend **on the same HTTPS origin**. The dev proxy does not exist in a static Vercel production deployment. Set VITE_LICENSE_ENFORCED=true only after this route works online and rebuild frontend.

## Important boundaries
- If backend is unreachable, the gate remains locked; there is no offline grace token yet.
- Code stored on the client should not be treated as a hardware-proof license; device ID is browser-install scoped and can be reset.
- Central DB is not yet the storage for rental financial records. Local storage can be modified on client; do not claim this gate is tamper-proof.
- Activating a new code rotates the previous activation code. Previously registered devices still exist; checks require current code.
- Never place `DATABASE_URL` or central admin passwords in frontend env variables.
