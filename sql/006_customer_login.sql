BEGIN;
CREATE TABLE IF NOT EXISTS central_customer_accounts (
 organization_id bigint PRIMARY KEY REFERENCES client_organizations(id) ON DELETE RESTRICT,
 email varchar(200) NOT NULL UNIQUE,
 password_hash text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS central_customer_sessions (
 token_hash char(64) PRIMARY KEY,
 organization_id bigint NOT NULL REFERENCES client_organizations(id) ON DELETE RESTRICT,
 device_key_hash char(64) NOT NULL,
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_customer_sessions_org ON central_customer_sessions(organization_id);
COMMIT;
