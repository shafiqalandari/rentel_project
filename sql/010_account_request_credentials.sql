BEGIN;
ALTER TABLE central_account_requests ADD COLUMN IF NOT EXISTS password_hash TEXT;
COMMIT;
