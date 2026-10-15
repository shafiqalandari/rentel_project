BEGIN;
CREATE TABLE IF NOT EXISTS central_admins (
 id bigserial PRIMARY KEY, email text NOT NULL UNIQUE, password_hash text NOT NULL,
 name text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS central_sessions (
 token_hash text PRIMARY KEY, admin_id bigint NOT NULL REFERENCES central_admins(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS client_organizations (
 id bigserial PRIMARY KEY, name text NOT NULL, contact_name text NOT NULL DEFAULT '',
 email text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'active'
 CHECK(status IN ('active','suspended')), notes text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS client_licenses (
 id bigserial PRIMARY KEY, organization_id bigint NOT NULL UNIQUE REFERENCES client_organizations(id) ON DELETE RESTRICT,
 plan text NOT NULL CHECK(plan IN('trial','monthly','annual','lifetime')),
 starts_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz,
 max_devices int NOT NULL DEFAULT 1 CHECK(max_devices BETWEEN 1 AND 10000),
 status text NOT NULL DEFAULT 'active' CHECK(status IN('active','paused','revoked')),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (plan='lifetime' OR expires_at IS NOT NULL));
CREATE TABLE IF NOT EXISTS central_audit_logs (
 id bigserial PRIMARY KEY, admin_id bigint REFERENCES central_admins(id), action text NOT NULL,
 target_type text NOT NULL, target_id bigint, detail jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS ix_central_audit_date ON central_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS ix_central_licenses_expiry ON client_licenses(expires_at);
COMMIT;
