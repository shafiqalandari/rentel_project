BEGIN;
CREATE TABLE IF NOT EXISTS central_client_access (
 organization_id bigint PRIMARY KEY REFERENCES client_organizations(id) ON DELETE RESTRICT,
 activation_hash char(64) NOT NULL UNIQUE,
 rotated_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
