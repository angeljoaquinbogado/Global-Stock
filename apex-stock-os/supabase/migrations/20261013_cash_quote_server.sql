-- Read-only cashier quote. The final POS RPC remains authoritative and
-- verifies catalog prices, discounts, payment and inventory atomically.
CREATE OR REPLACE FUNCTION public.global_stock_preview_cash_sale(
  target_business_id uuid, sale_lines jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  line jsonb;
  product_key_value text;
  quantity_value numeric;
  unit_price numeric;
  subtotal numeric := 0;
  promo_discount numeric := 0;
  final_total numeric;
  seen_keys text[] := array[]::text[];
  currency text;
BEGIN
  IF (SELECT auth.uid()) IS NULL
    OR NOT public.global_stock_can_write(target_business_id, 'sales') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT base_currency INTO currency FROM public.global_stock_businesses
  WHERE id=target_business_id AND active=true;
  IF currency IS NULL THEN RAISE EXCEPTION 'business not found'; END IF;
  IF jsonb_typeof(sale_lines) <> 'array'
    OR jsonb_array_length(sale_lines) < 1
    OR jsonb_array_length(sale_lines) > 100 THEN
    RAISE EXCEPTION 'invalid cart';
  END IF;
  FOR line IN SELECT value FROM jsonb_array_elements(sale_lines)
  LOOP
    product_key_value := nullif(trim(coalesce(line->>'productKey','')), '');
    IF product_key_value IS NULL
      OR length(product_key_value)>256
      OR product_key_value = ANY(seen_keys) THEN
      RAISE EXCEPTION 'invalid or duplicate product';
    END IF;
    seen_keys := array_append(seen_keys,product_key_value);
    IF coalesce(line->>'quantity','') !~ '^[1-9][0-9]{0,6}$' THEN
      RAISE EXCEPTION 'invalid quantity';
    END IF;
    quantity_value := (line->>'quantity')::numeric;
    SELECT p.price INTO unit_price
      FROM public.global_stock_products p
      WHERE p.business_id=target_business_id
        AND p.client_key=product_key_value AND p.active=true;
    IF NOT FOUND OR unit_price IS NULL OR unit_price<0 THEN
      RAISE EXCEPTION 'product missing or invalid price';
    END IF;
    subtotal := subtotal+unit_price*quantity_value;
  END LOOP;
  SELECT coalesce(max(
    CASE WHEN promo.kind='percentage'
      THEN subtotal*least(100,greatest(0,coalesce(promo.value,0)))/100
    WHEN promo.kind='fixed'
      THEN least(subtotal,greatest(0,coalesce(promo.value,0)))
    ELSE 0 END
  ),0) INTO promo_discount
  FROM public.global_stock_promotions promo
  WHERE promo.business_id=target_business_id
    AND promo.active=true
    AND promo.kind IN ('percentage','fixed')
    AND (promo.starts_at IS NULL OR promo.starts_at<=now())
    AND (promo.ends_at IS NULL OR promo.ends_at>=now());
  final_total := greatest(0,subtotal-least(subtotal,promo_discount));
  RETURN jsonb_build_object(
    'subtotal', round(subtotal,2),
    'discount',round(promo_discount,2),
    'total',round(final_total,2),
    'currency',upper(currency),
    'lines',jsonb_array_length(sale_lines)
  );
END;
$function$;
REVOKE ALL ON FUNCTION public.global_stock_preview_cash_sale(uuid,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.global_stock_preview_cash_sale(uuid,jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.global_stock_preview_cash_sale(uuid,jsonb) TO authenticated;
