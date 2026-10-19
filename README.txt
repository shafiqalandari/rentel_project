Rental: Single Customer Login fix

Changed file:
  src/LicenseGate.tsx

Behavior:
- Uses the existing styled LoginExperience for customer sign-in.
- After central authentication and device/license approval, initializes the local market session automatically.
- Prevents the second login screen without disabling central licensing or device checks.
- Logout clears the central session via the existing event.
- No database migration or backend modification required.

Deploy: copy src/LicenseGate.tsx to /var/www/rental/src/LicenseGate.tsx, then run npm run build.
Do not change other PM2 services.
Note: This app's market records currently use browser-local storage; this patch does not migrate them to PostgreSQL.
