-- Authenticated cashiers and inventory operators need SELECT grants in addition
-- to RLS policies. Avoid exposing private customers/recipes to viewer and anon.
ALTER TABLE public.global_stock_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_stock_recipes ENABLE ROW LEVEL SECURITY;

REVOKE SELECT ON TABLE public.global_stock_customers FROM anon;
REVOKE SELECT ON TABLE public.global_stock_recipes FROM anon;
GRANT SELECT ON TABLE public.global_stock_customers TO authenticated;
GRANT SELECT ON TABLE public.global_stock_recipes TO authenticated;

DROP POLICY IF EXISTS gs_read_global_stock_customers ON public.global_stock_customers;
CREATE POLICY gs_read_global_stock_customers
 ON public.global_stock_customers FOR SELECT
 TO authenticated
 USING (public.global_stock_can_write(business_id, 'customers'));

DROP POLICY IF EXISTS gs_read_global_stock_recipes ON public.global_stock_recipes;
CREATE POLICY gs_read_global_stock_recipes
 ON public.global_stock_recipes FOR SELECT TO authenticated
 USING (
   public.global_stock_can_write(business_id, 'sales')
   OR public.global_stock_can_write(business_id, 'inventory')
 );
