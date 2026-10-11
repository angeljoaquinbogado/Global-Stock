-- Mobile dashboard: read the same posted sales as the Next.js POS.
-- SECURITY INVOKER and existing RLS maintain per-business separation.
GRANT SELECT ON TABLE public.global_stock_sales TO authenticated;

CREATE OR REPLACE FUNCTION public.global_stock_mobile_dashboard(
  target_business_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF (SELECT auth.uid()) IS NULL
    OR target_business_id IS NULL
    OR NOT public.global_stock_is_member(target_business_id) THEN
    RAISE EXCEPTION 'Not authorized to view this dashboard'
      USING ERRCODE = '42501';
  END IF;

  WITH posted AS (
    SELECT created_at::date AS sale_day, total, cost_total
    FROM public.global_stock_sales
    WHERE business_id = target_business_id AND status = 'completed'
  ),
  days AS (
    SELECT generate_series(current_date - 6, current_date, '1 day'::interval)::date AS d
  )
  SELECT jsonb_build_object(
    'revenue', COALESCE((SELECT sum(total) FROM posted), 0),
    'cost', COALESCE((SELECT sum(cost_total) FROM posted), 0),
    'salesCount', (SELECT count(*) FROM posted),
    'chart', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'day', to_char(days.d, 'DD/MM'),
        'profit', coalesce((SELECT sum(p.total-p.cost_total) FROM posted p WHERE p.sale_day=days.d),0)
      ) ORDER BY days.d), '[]'::jsonb)
      FROM days
    )
  ) INTO result;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.global_stock_mobile_dashboard(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.global_stock_mobile_dashboard(uuid) TO authenticated;
