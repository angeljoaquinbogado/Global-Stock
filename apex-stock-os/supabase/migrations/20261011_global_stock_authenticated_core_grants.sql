-- Restore minimum PostgreSQL table grants required by the authenticated
-- Global Stock web + Expo mobile onboarding/inventory flow.
--
-- Existing Row Level Security policies stay enabled; granting table verbs
-- does NOT permit accessing another user's business.
-- No privileges granted to anon or public. Sensitive other tables unchanged.

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.global_stock_businesses TO authenticated;

GRANT SELECT
  ON TABLE public.global_stock_members TO authenticated;

GRANT SELECT, INSERT
  ON TABLE public.global_stock_locations TO authenticated;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.global_stock_products TO authenticated;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.global_stock_workspaces TO authenticated;

GRANT SELECT
  ON TABLE public.global_stock_inventory_levels TO authenticated;

GRANT SELECT
  ON TABLE public.global_stock_product_variants TO authenticated;

GRANT SELECT, INSERT
  ON TABLE public.global_stock_audit_events TO authenticated;

-- The mobile call uses SECURITY INVOKER, so both RLS and table grants apply.
GRANT EXECUTE ON FUNCTION public.global_stock_create_mobile_product(
  uuid, text, numeric, numeric, text, text, numeric, text
) TO authenticated;

-- The existing authenticated-invitation bridge needs execute access.
GRANT EXECUTE ON FUNCTION public.global_stock_accept_pending_invites()
  TO authenticated;
