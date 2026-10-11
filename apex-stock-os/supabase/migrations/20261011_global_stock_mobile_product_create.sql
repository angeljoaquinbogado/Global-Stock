-- Global Stock mobile product creation, tenant-scoped and transactional.
-- The web client's catalogue is kept in global_stock_workspaces.state.products
-- as well as the canonical global_stock_products table.
-- SECURITY INVOKER: all existing table RLS policies remain in force.
CREATE OR REPLACE FUNCTION public.global_stock_create_mobile_product(
  target_business_id uuid,
  product_name text,
  product_price numeric,
  product_stock numeric,
  product_barcode text DEFAULT NULL,
  product_category text DEFAULT NULL,
  product_min_stock numeric DEFAULT 0,
  client_operation_key text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  normalized_name text := btrim(coalesce(product_name, ''));
  normalized_barcode text := nullif(btrim(coalesce(product_barcode, '')), '');
  normalized_category text := nullif(btrim(coalesce(product_category, '')), '');
  item_key text := coalesce(nullif(btrim(coalesce(client_operation_key, '')), ''), gen_random_uuid()::text);
  inserted_product_id uuid;
  previous_id uuid;
  web_product jsonb;
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR target_business_id IS NULL
     OR NOT public.global_stock_can_write(target_business_id, 'inventory')
     OR NOT public.global_stock_can_write(target_business_id, 'workspace') THEN
    RAISE EXCEPTION 'Not authorized to create products for this business'
      USING ERRCODE = '42501';
  END IF;

  IF length(normalized_name) < 2 OR length(normalized_name) > 160
    OR length(coalesce(normalized_barcode, '')) > 80
    OR length(coalesce(normalized_category, '')) > 120
    OR length(item_key) < 8 OR length(item_key) > 110
    OR item_key !~ '^[A-Za-z0-9:_-]+$'
    OR product_price IS NULL OR product_price < 0 OR product_price > 1000000000
    OR product_stock IS NULL OR product_stock < 0 OR product_stock > 1000000000
    OR product_min_stock IS NULL OR product_min_stock < 0 OR product_min_stock > 1000000000 THEN
    RAISE EXCEPTION 'Invalid product details' USING ERRCODE = '22023';
  END IF;

  -- Idempotency: network retries use the same client_operation_key.
  SELECT id INTO previous_id
    FROM public.global_stock_products
    WHERE business_id = target_business_id AND client_key = item_key;
  IF previous_id IS NOT NULL THEN
    RETURN previous_id;
  END IF;

  INSERT INTO public.global_stock_products (
    business_id, client_key, barcode, name, category,
    price, stock, min_stock, source, active, metadata
  )
  VALUES (
    target_business_id, item_key, normalized_barcode, normalized_name,
    normalized_category, product_price, product_stock, product_min_stock,
    'local', true, '{"sold30d":0,"images":[],"image":""}'::jsonb
  )
  ON CONFLICT (business_id, client_key) DO NOTHING
  RETURNING id INTO inserted_product_id;

  IF inserted_product_id IS NULL THEN
    SELECT id INTO previous_id
      FROM public.global_stock_products
      WHERE business_id = target_business_id AND client_key = item_key;
    IF previous_id IS NOT NULL THEN RETURN previous_id; END IF;
    RAISE EXCEPTION 'Unable to create product' USING ERRCODE = '23505';
  END IF;

  web_product := jsonb_build_object(
    'id', item_key,
    'barcode', coalesce(normalized_barcode, ''),
    'name', normalized_name,
    'category', coalesce(normalized_category, ''),
    'supplier', '',
    'stock', product_stock,
    'minStock', product_min_stock,
    'cost', 0,
    'costKnown', false,
    'price', product_price,
    'sold30d', 0,
    'source', 'local',
    'active', true
  );

  -- Preserve other workspace modules and append only this newly created
  -- product to the same state shape used by the Next.js catalogue.
  INSERT INTO public.global_stock_workspaces (
    business_id, state, revision, updated_by, updated_at
  )
  VALUES (
    target_business_id,
    jsonb_build_object('products', jsonb_build_array(web_product)),
    (extract(epoch FROM clock_timestamp()) * 1000)::bigint,
    auth.uid(),
    now()
  )
  ON CONFLICT (business_id) DO UPDATE
  SET state = jsonb_set(
        coalesce(public.global_stock_workspaces.state, '{}'::jsonb),
        '{products}',
        CASE
          WHEN jsonb_typeof(public.global_stock_workspaces.state -> 'products') = 'array'
          THEN (public.global_stock_workspaces.state -> 'products')
          ELSE '[]'::jsonb
        END || jsonb_build_array(web_product),
        true
      ),
      revision = (extract(epoch FROM clock_timestamp()) * 1000)::bigint,
      updated_by = auth.uid(),
      updated_at = now();

  -- Seed stock at the Principal location for existing web POS readers.
  PERFORM public.global_stock_seed_inventory_levels(target_business_id);

  RETURN inserted_product_id;
END
$function$;

REVOKE ALL ON FUNCTION public.global_stock_create_mobile_product(
  uuid, text, numeric, numeric, text, text, numeric, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.global_stock_create_mobile_product(
  uuid, text, numeric, numeric, text, text, numeric, text
) TO authenticated;
