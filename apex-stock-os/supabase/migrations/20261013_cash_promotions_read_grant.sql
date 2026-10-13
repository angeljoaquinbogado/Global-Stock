-- Unblock in-person checkout promotion lookup.
-- RLS already restricts rows to members of their own business.
-- Postgres requires both a table SELECT grant and an RLS policy;
-- without this grant, every mobile checkout is disabled.
ALTER TABLE public.global_stock_promotions ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON TABLE public.global_stock_promotions FROM anon;
GRANT SELECT ON TABLE public.global_stock_promotions TO authenticated;
