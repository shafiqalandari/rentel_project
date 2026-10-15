CREATE TABLE IF NOT EXISTS central_plans (
 id bigserial PRIMARY KEY,code text NOT NULL UNIQUE,name text NOT NULL,plan text NOT NULL CHECK(plan IN('trial','monthly','annual','lifetime')),
 price numeric(16,2) NOT NULL CHECK(price>=0),currency varchar(6) NOT NULL DEFAULT 'AFN',duration_days int NOT NULL CHECK(duration_days BETWEEN 0 AND 36500),
 max_devices int NOT NULL CHECK(max_devices BETWEEN 1 AND 10000),active boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((plan='lifetime' AND duration_days=0) OR (plan<>'lifetime' AND duration_days>0))
);
CREATE TABLE IF NOT EXISTS central_payments (
 id bigserial PRIMARY KEY,organization_id bigint NOT NULL REFERENCES client_organizations(id),plan_id bigint NOT NULL REFERENCES central_plans(id),
 amount numeric(16,2) NOT NULL CHECK(amount>=0),currency varchar(6) NOT NULL,reference text NOT NULL,notes text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected')),
 created_by bigint REFERENCES central_admins(id),reviewed_by bigint REFERENCES central_admins(id),reviewed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,reference)
);
CREATE TABLE IF NOT EXISTS central_subscription_events (
 id bigserial PRIMARY KEY,organization_id bigint NOT NULL REFERENCES client_organizations(id),plan_id bigint REFERENCES central_plans(id),
 previous_expiry timestamptz,new_expiry timestamptz,amount numeric(16,2) NOT NULL DEFAULT 0,currency varchar(6) NOT NULL DEFAULT 'AFN',
 action text NOT NULL CHECK(action IN('renew','payment')),payment_id bigint UNIQUE REFERENCES central_payments(id),admin_id bigint REFERENCES central_admins(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_central_payments_status ON central_payments(status,created_at DESC);
CREATE INDEX IF NOT EXISTS ix_central_subscription_org ON central_subscription_events(organization_id,created_at DESC);
