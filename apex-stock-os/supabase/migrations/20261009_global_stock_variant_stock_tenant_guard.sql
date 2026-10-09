-- Global Stock · tenant isolation for variant stock mutation (2026-10-09)
-- No table data is changed. Existing function signature and role grants are preserved.
CREATE OR REPLACE FUNCTION public.global_stock_set_variant_stock(
  target_business_id uuid,
  target_variant_id uuid,
  target_stock numeric,
  target_location_id uuid DEFAULT NULL::uuid
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  target_product uuid;
  location_value uuid;
  level_id uuid;
  total_variant_stock numeric;
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR NOT public.global_stock_can_write(target_business_id, 'inventory') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF target_stock IS NULL OR target_stock < 0
     OR target_stock::text IN ('NaN','Infinity','-Infinity') THEN
    RAISE EXCEPTION 'invalid stock';
  END IF;

  SELECT product_id INTO target_product
  FROM public.global_stock_product_variants
  WHERE id = target_variant_id AND business_id = target_business_id AND active = true;

  IF target_product IS NULL THEN
    RAISE EXCEPTION 'variant not found';
  END IF;

  location_value := target_location_id;

  IF location_value IS NULL THEN
    SELECT id INTO location_value
    FROM public.global_stock_locations
    WHERE business_id = target_business_id AND active = true
    ORDER BY CASE WHEN kind = 'store' THEN 0 ELSE 1 END, created_at
    LIMIT 1;
  END IF;

  IF location_value IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.global_stock_locations
    WHERE id = location_value AND business_id = target_business_id AND active = true
  ) THEN
    RAISE EXCEPTION 'location not found for business';
  END IF;

  SELECT id INTO level_id
  FROM public.global_stock_inventory_levels
  WHERE business_id = target_business_id
    AND location_id = location_value
    AND product_id = target_product
    AND variant_id = target_variant_id
  LIMIT 1 FOR UPDATE;

  IF level_id IS NULL THEN
    INSERT INTO public.global_stock_inventory_levels(
      business_id, location_id, product_id, variant_id, on_hand, reserved, updated_at
    ) VALUES (
      target_business_id, location_value, target_product, target_variant_id,
      target_stock, 0, now()
    );
  ELSE
    UPDATE public.global_stock_inventory_levels
    SET on_hand = target_stock, updated_at = now()
    WHERE id = level_id AND business_id = target_business_id;
  END IF;

  SELECT coalesce(sum(il.on_hand), 0)
  INTO total_variant_stock
  FROM public.global_stock_inventory_levels il
  JOIN public.global_stock_product_variants v
    ON v.id = il.variant_id
   AND v.product_id = target_product
   AND v.business_id = target_business_id
   AND v.active = true
  WHERE il.business_id = target_business_id
    AND il.product_id = target_product
    AND il.variant_id IS NOT NULL;

  UPDATE public.global_stock_products
  SET stock = total_variant_stock
  WHERE id = target_product AND business_id = target_business_id;

  RETURN total_variant_stock;
END;
$function$;
