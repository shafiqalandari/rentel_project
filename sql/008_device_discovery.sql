CREATE TABLE IF NOT EXISTS central_device_visitors (
  id bigserial PRIMARY KEY,
  organization_id bigint REFERENCES client_organizations(id) ON DELETE SET NULL,
  device_key_hash char(64) NOT NULL UNIQUE,
  browser_cookie_hash char(64) NOT NULL UNIQUE,
  device_key_hint varchar(16) NOT NULL,
  device_name varchar(160) NOT NULL DEFAULT 'Browser',
  user_agent varchar(500) NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','blocked')),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS central_device_visitors_organization_idx
  ON central_device_visitors(organization_id);
CREATE INDEX IF NOT EXISTS central_device_visitors_last_seen_idx
  ON central_device_visitors(last_seen_at DESC);
