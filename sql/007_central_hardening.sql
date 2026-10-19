BEGIN;

-- Existing installations may already have 005 applied. Keep this migration
-- additive and make the plan constraint compatible with custom expiry dates.
ALTER TABLE central_customer_sessions
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

ALTER TABLE client_licenses DROP CONSTRAINT IF EXISTS client_licenses_plan_check;
ALTER TABLE client_licenses
  ADD CONSTRAINT client_licenses_plan_check
  CHECK (plan IN ('trial','monthly','annual','custom','lifetime'));

CREATE INDEX IF NOT EXISTS ix_central_sessions_expiry
  ON central_sessions(expires_at);
CREATE INDEX IF NOT EXISTS ix_customer_sessions_expiry
  ON central_customer_sessions(expires_at)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_customer_devices_seen
  ON central_client_devices(last_seen_at DESC);

COMMIT;
