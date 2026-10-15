BEGIN;
CREATE TABLE IF NOT EXISTS central_client_devices (
 id bigserial PRIMARY KEY,
 organization_id bigint NOT NULL REFERENCES client_organizations(id) ON DELETE RESTRICT,
 device_name varchar(160) NOT NULL,
 device_key_hash char(64) NOT NULL,
 status varchar(16) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','blocked')),
 last_seen_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,device_key_hash)
);
CREATE INDEX IF NOT EXISTS ix_central_devices_org ON central_client_devices(organization_id,status);
COMMIT;
