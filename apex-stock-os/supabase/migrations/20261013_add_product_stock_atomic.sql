-- Single source of truth for restocking from Expo Go and the web.
-- POS, inventory counts and barcode lookup read global_stock_products.stock;
-- the existing stock-movement trigger also maintains inventory_levels.
CREATE OR REPLACE FUNCTION public.global_stock_add_product_stock(
  target_business_id uuid,
  target_product_id uuid,
  added_quantity numeric,
  client_operation_id text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $function$
DECLARE
  v_key text;
  v_previous numeric;
  v_current numeric;
  v_existing_product text;
BEGIN
  IF auth.uid() IS NULL
     OR target_business_id IS NULL
     OR target_product_id IS NULL
     OR NOT public.global_stock_can_write(target_business_id, 'inventory') THEN
    RAISE EXCEPTION 'Not authorized to add stock'
      USING ERRCODE = '42501';
  END IF;

  IF added_quantity IS NULL
     OR added_quantity <= 0
     OR added_quantity > 1000000
     OR added_quantity::text IN ('NaN', 'Infinity', '-Infinity')
     OR added_quantity <> round(added_quantity, 3) THEN
    RAISE EXCEPTION 'Enter a positive quantity with up to three decimals'
      USING ERRCODE = '22023';
  END IF;
  IF client_operation_id IS NULL
     OR length(client_operation_id) < 12 OR length(client_operation_id) > 110
     OR client_operation_id !~ '^[A-Za-z0-9:_-]+$' THEN
    RAISE EXCEPTION 'Invalid operation reference'
      USING ERRCODE = '22023';
  END IF;

  -- Serialize concurrent restocks of the same item, even across devices.
  SELECT p.client_key, p.stock INTO v_key, v_previous
  FROM public.global_stock_products p
  WHERE p.id = target_product_id
    AND p.business_id = target_business_id
    AND p.active = true
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found in this business'
      USING ERRCODE = 'P0002';
  END IF;

  -- Retries after network loss must never add stock twice.
  SELECT sm.product_key INTO v_existing_product
  FROM public.global_stock_stock_movements sm
  WHERE sm.business_id = target_business_id
    AND sm.operation_id = client_operation_id
  LIMIT 1;
  IF FOUND THEN
    IF v_existing_product <> v_key THEN
      RAISE EXCEPTION 'Operation already used for another product'
        USING ERRCODE = '23505';
    END IF;
    RETURN v_previous;
  END IF;

  IF v_previous + added_quantity > 1000000000 THEN
    RAISE EXCEPTION 'Stock limit exceeded'
      USING ERRCODE = '22003';
  END IF;

  -- This audited function inserts a movement and the database trigger
  -- atomically increases BOTH product stock and physical inventory levels.
  PERFORM public.global_stock_record_stock_adjustment(
    target_business_id,
    client_operation_id,
    v_key,
    v_previous,
    v_previous + added_quantity,
    'restock'
  );

  SELECT p.stock INTO v_current
  FROM public.global_stock_products p
  WHERE p.id = target_product_id AND p.business_id = target_business_id;
  IF v_current <> v_previous + added_quantity THEN
    RAISE EXCEPTION 'Stock update not confirmed'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN v_current;
END;
$function$;

REVOKE ALL ON FUNCTION public.global_stock_add_product_stock(uuid,uuid,numeric,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.global_stock_add_product_stock(uuid,uuid,numeric,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.global_stock_add_product_stock(uuid,uuid,numeric,text) TO authenticated;
