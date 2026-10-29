BEGIN;
CREATE TABLE IF NOT EXISTS central_account_requests (
 id BIGSERIAL PRIMARY KEY,
 office_name VARCHAR(150) NOT NULL,
 manager_name VARCHAR(150) NOT NULL,
 phone VARCHAR(60) NOT NULL,
 email VARCHAR(200) NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 organization_id BIGINT REFERENCES client_organizations(id) ON DELETE SET NULL,
 reviewed_by BIGINT REFERENCES central_admins(id) ON DELETE SET NULL,
 reviewed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_market_account_requests_status ON central_account_requests(status,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ix_market_pending_request_email ON central_account_requests(lower(email)) WHERE status='pending';
COMMIT;
