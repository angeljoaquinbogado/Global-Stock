-- Global Stock: make browser-triggered financial/inventory RPCs server-authoritative.
--
-- IMPORTANT:
-- This migration hardens only public.global_stock_* objects.
-- The current Supabase Free organization is limited to two active projects,
-- so Global Stock remains logically isolated by prefix inside the shared
-- project until a dedicated project can be created without adding paid cost.
-- No Dorado tables, functions or foreign keys are modified by this migration.
--
-- Strategy:
-- 1. Preserve the battle-tested stock/cash side effects in renamed legacy
--    implementations.
-- 2. Remove direct browser execution from those implementations.
-- 3. Re-create the original RPC signatures as hardened wrappers so the
--    existing frontend does not need a flag-day change.
-- 4. Recompute trusted price/cost/stock baselines from PostgreSQL.

begin;

alter function public.global_stock_record_pos_sale(
  uuid, text, text, numeric, numeric, uuid, jsonb, jsonb, numeric
) rename to global_stock_record_pos_sale_legacy_unsafe;

alter function public.global_stock_record_stock_adjustment(
  uuid, text, text, numeric, numeric, text
) rename to global_stock_record_stock_adjustment_legacy_unsafe;

alter function public.global_stock_apply_stock_count(
  uuid, uuid, text, numeric, numeric, text
) rename to global_stock_apply_stock_count_legacy_unsafe;

alter function public.global_stock_execute_transfer(
  uuid, uuid, uuid, text, numeric, text
) rename to global_stock_execute_transfer_legacy_unsafe;

revoke execute on function public.global_stock_record_pos_sale_legacy_unsafe(
  uuid, text, text, numeric, numeric, uuid, jsonb, jsonb, numeric
) from public, anon, authenticated;

revoke execute on function public.global_stock_record_stock_adjustment_legacy_unsafe(
  uuid, text, text, numeric, numeric, text
) from public, anon, authenticated;

revoke execute on function public.global_stock_apply_stock_count_legacy_unsafe(
  uuid, uuid, text, numeric, numeric, text
) from public, anon, authenticated;

revoke execute on function public.global_stock_execute_transfer_legacy_unsafe(
  uuid, uuid, uuid, text, numeric, text
) from public, anon, authenticated;


create function public.global_stock_record_pos_sale(
  target_business_id uuid,
  operation_id text,
  sale_currency text,
  sale_total numeric,
  sale_cost_total numeric,
  target_customer_id uuid,
  sale_lines jsonb,
  sale_payments jsonb,
  received_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  line jsonb;
  payment jsonb;
  trusted_lines jsonb := '[]'::jsonb;
  trusted_subtotal numeric := 0;
  trusted_total numeric := 0;
  trusted_cost_total numeric := 0;
  promotion_discount numeric := 0;
  quantity_value numeric;
  product_key_value text;
  product_id_value uuid;
  product_name_value text;
  product_price_value numeric;
  product_cost_value numeric;
  variant_id_value uuid;
  variant_name_value text;
  variant_price_value numeric;
  variant_cost_value numeric;
  unit_price_value numeric;
  unit_cost_value numeric;
  recipe_count integer;
  recipe_unit_cost numeric;
  payment_method_value text;
  payment_amount_text text;
  location_text text;
  location_value uuid;
  normalized_currency text;
begin
  if (select auth.uid()) is null
     or not public.global_stock_can_write(target_business_id, 'sales') then
    raise exception 'not authorized';
  end if;

  if operation_id is null
     or length(trim(operation_id)) < 8
     or length(operation_id) > 160 then
    raise exception 'invalid operation id';
  end if;

  normalized_currency := upper(trim(coalesce(sale_currency, '')));
  if normalized_currency !~ '^[A-Z]{3}$' then
    raise exception 'invalid currency';
  end if;

  if jsonb_typeof(sale_lines) <> 'array'
     or jsonb_array_length(sale_lines) = 0
     or jsonb_array_length(sale_lines) > 200 then
    raise exception 'invalid sale lines';
  end if;

  if jsonb_typeof(sale_payments) <> 'array'
     or jsonb_array_length(sale_payments) = 0
     or jsonb_array_length(sale_payments) > 10 then
    raise exception 'invalid sale payments';
  end if;

  if received_amount is not null
     and (
       received_amount < 0
       or received_amount::text in ('NaN', 'Infinity', '-Infinity')
     ) then
    raise exception 'invalid received amount';
  end if;

  if target_customer_id is not null and not exists (
    select 1
    from public.global_stock_customers c
    where c.id = target_customer_id
      and c.business_id = target_business_id
      and c.active = true
  ) then
    raise exception 'invalid customer';
  end if;

  location_text := nullif(trim(coalesce(sale_lines->0->>'locationId', '')), '');
  if location_text is not null then
    begin
      location_value := location_text::uuid;
    exception when others then
      raise exception 'invalid sale location';
    end;

    if not exists (
      select 1
      from public.global_stock_locations l
      where l.id = location_value
        and l.business_id = target_business_id
        and l.active = true
    ) then
      raise exception 'invalid sale location';
    end if;
  end if;

  for line in
    select value from jsonb_array_elements(sale_lines)
  loop
    product_key_value := nullif(trim(coalesce(line->>'productKey', '')), '');
    if product_key_value is null or length(product_key_value) > 256 then
      raise exception 'invalid sale line';
    end if;

    if coalesce(line->>'quantity', '') !~ '^[0-9]+([.][0-9]+)?$' then
      raise exception 'invalid sale quantity';
    end if;

    quantity_value := (line->>'quantity')::numeric;
    if quantity_value <= 0 or quantity_value > 1000000000 then
      raise exception 'invalid sale quantity';
    end if;

    product_id_value := null;
    product_name_value := null;
    product_price_value := null;
    product_cost_value := null;

    select p.id, p.name, p.price, p.cost
      into product_id_value, product_name_value,
           product_price_value, product_cost_value
    from public.global_stock_products p
    where p.business_id = target_business_id
      and p.client_key = product_key_value
      and p.active = true
    limit 1;

    if product_id_value is null then
      raise exception 'product not found';
    end if;

    variant_id_value := null;
    variant_name_value := null;
    variant_price_value := null;
    variant_cost_value := null;

    if nullif(trim(coalesce(line->>'variantId', '')), '') is not null then
      begin
        variant_id_value := (line->>'variantId')::uuid;
      exception when others then
        raise exception 'invalid variant';
      end;

      select v.name, v.price, v.cost
        into variant_name_value, variant_price_value, variant_cost_value
      from public.global_stock_product_variants v
      where v.id = variant_id_value
        and v.business_id = target_business_id
        and v.product_id = product_id_value
        and v.active = true
      limit 1;

      if not found then
        raise exception 'invalid variant';
      end if;
    end if;

    unit_price_value := coalesce(variant_price_value, product_price_value, 0);
    if unit_price_value < 0
       or unit_price_value::text in ('NaN', 'Infinity', '-Infinity') then
      raise exception 'invalid server price';
    end if;

    if variant_id_value is not null and variant_cost_value is not null then
      unit_cost_value := greatest(0, variant_cost_value);
    else
      select
        count(*),
        coalesce(
          sum(
            coalesce(component.cost, 0)
            * recipe.quantity
            * (1 + (coalesce(recipe.wastage_pct, 0) / 100.0))
          ),
          0
        )
        into recipe_count, recipe_unit_cost
      from public.global_stock_recipes recipe
      left join public.global_stock_products component
        on component.business_id = target_business_id
       and component.client_key = recipe.component_key
       and component.active = true
      where recipe.business_id = target_business_id
        and recipe.product_key = product_key_value;

      if recipe_count > 0 then
        unit_cost_value := greatest(0, recipe_unit_cost);
      else
        unit_cost_value := greatest(0, coalesce(product_cost_value, 0));
      end if;
    end if;

    trusted_subtotal :=
      trusted_subtotal + (unit_price_value * quantity_value);
    trusted_cost_total :=
      trusted_cost_total + (unit_cost_value * quantity_value);

    trusted_lines := trusted_lines || jsonb_build_array(
      jsonb_build_object(
        'productKey', product_key_value,
        'productName', product_name_value,
        'variantId', variant_id_value,
        'variantLabel', variant_name_value,
        'quantity', quantity_value,
        'unitPrice', unit_price_value,
        'unitCost', unit_cost_value,
        'locationId', location_value
      )
    );
  end loop;

  select coalesce(max(
    case
      when promo.kind = 'percentage' then
        trusted_subtotal
        * least(100, greatest(0, coalesce(promo.value, 0)))
        / 100
      when promo.kind = 'fixed' then
        least(trusted_subtotal, greatest(0, coalesce(promo.value, 0)))
      else 0
    end
  ), 0)
  into promotion_discount
  from public.global_stock_promotions promo
  where promo.business_id = target_business_id
    and promo.active = true
    and promo.kind in ('percentage', 'fixed')
    and (promo.starts_at is null or promo.starts_at <= now())
    and (promo.ends_at is null or promo.ends_at >= now());

  trusted_total :=
    greatest(0, trusted_subtotal - least(trusted_subtotal, promotion_discount));

  for payment in
    select value from jsonb_array_elements(sale_payments)
  loop
    payment_method_value :=
      lower(trim(coalesce(payment->>'method', '')));

    if payment_method_value not in (
      'cash', 'debit', 'credit', 'transfer', 'qr', 'account'
    ) then
      raise exception 'invalid payment method';
    end if;

    payment_amount_text := coalesce(payment->>'amount', '');
    if payment_amount_text !~ '^[0-9]+([.][0-9]+)?$' then
      raise exception 'invalid payment amount';
    end if;

    if payment_method_value = 'account'
       and target_customer_id is null then
      raise exception 'account payment requires customer';
    end if;
  end loop;

  -- The client-provided sale_total and sale_cost_total parameters are
  -- intentionally ignored. The legacy implementation receives only values
  -- derived from server-side catalog, recipe and promotion data.
  return public.global_stock_record_pos_sale_legacy_unsafe(
    target_business_id,
    operation_id,
    normalized_currency,
    trusted_total,
    trusted_cost_total,
    target_customer_id,
    trusted_lines,
    sale_payments,
    received_amount
  );
end;
$$;


create function public.global_stock_record_stock_adjustment(
  target_business_id uuid,
  operation_id text,
  product_key_value text,
  previous_stock numeric,
  next_stock numeric,
  adjustment_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  server_previous_stock numeric;
begin
  if (select auth.uid()) is null
     or not public.global_stock_can_write(target_business_id, 'inventory') then
    raise exception 'not authorized';
  end if;

  if next_stock is null
     or next_stock < 0
     or next_stock::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'invalid next stock';
  end if;

  select p.stock
    into server_previous_stock
  from public.global_stock_products p
  where p.business_id = target_business_id
    and p.client_key = product_key_value
    and p.active = true
  limit 1
  for update;

  if not found then
    raise exception 'product not found';
  end if;

  -- previous_stock is intentionally ignored. It is attacker-controlled
  -- browser state and is replaced by the locked server value.
  return public.global_stock_record_stock_adjustment_legacy_unsafe(
    target_business_id,
    operation_id,
    product_key_value,
    server_previous_stock,
    next_stock,
    adjustment_reason
  );
end;
$$;


create function public.global_stock_apply_stock_count(
  target_business_id uuid,
  target_location_id uuid,
  target_product_key text,
  expected_quantity numeric,
  counted_quantity numeric,
  count_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  product_id_value uuid;
  product_stock_value numeric;
  server_expected_quantity numeric;
begin
  if (select auth.uid()) is null
     or not public.global_stock_can_write(target_business_id, 'inventory') then
    raise exception 'not authorized';
  end if;

  if counted_quantity is null
     or counted_quantity < 0
     or counted_quantity::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'invalid counted quantity';
  end if;

  select p.id, p.stock
    into product_id_value, product_stock_value
  from public.global_stock_products p
  where p.business_id = target_business_id
    and p.client_key = target_product_key
    and p.active = true
  limit 1
  for update;

  if not found then
    raise exception 'product not found';
  end if;

  if target_location_id is null then
    server_expected_quantity := coalesce(product_stock_value, 0);
  else
    if not exists (
      select 1
      from public.global_stock_locations l
      where l.id = target_location_id
        and l.business_id = target_business_id
        and l.active = true
    ) then
      raise exception 'invalid stock-count location';
    end if;

    perform public.global_stock_seed_inventory_levels(target_business_id);

    select coalesce(level.on_hand, 0)
      into server_expected_quantity
    from public.global_stock_inventory_levels level
    where level.business_id = target_business_id
      and level.location_id = target_location_id
      and level.product_id = product_id_value
      and level.variant_id is null
    limit 1
    for update;

    server_expected_quantity := coalesce(server_expected_quantity, 0);
  end if;

  -- expected_quantity is intentionally ignored; the server value is used.
  return public.global_stock_apply_stock_count_legacy_unsafe(
    target_business_id,
    target_location_id,
    target_product_key,
    server_expected_quantity,
    counted_quantity,
    count_reason
  );
end;
$$;


create function public.global_stock_execute_transfer(
  target_business_id uuid,
  from_location uuid,
  to_location uuid,
  target_product_key text,
  transfer_quantity numeric,
  transfer_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) is null
     or not public.global_stock_can_write(target_business_id, 'inventory') then
    raise exception 'not authorized';
  end if;

  if from_location is null
     or to_location is null
     or from_location = to_location then
    raise exception 'invalid locations';
  end if;

  if transfer_quantity is null
     or transfer_quantity <= 0
     or transfer_quantity::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'invalid quantity';
  end if;

  if not exists (
    select 1
    from public.global_stock_locations l
    where l.id = from_location
      and l.business_id = target_business_id
      and l.active = true
  ) then
    raise exception 'invalid source location';
  end if;

  if not exists (
    select 1
    from public.global_stock_locations l
    where l.id = to_location
      and l.business_id = target_business_id
      and l.active = true
  ) then
    raise exception 'invalid destination location';
  end if;

  return public.global_stock_execute_transfer_legacy_unsafe(
    target_business_id,
    from_location,
    to_location,
    target_product_key,
    transfer_quantity,
    transfer_notes
  );
end;
$$;


revoke execute on function public.global_stock_record_pos_sale(
  uuid, text, text, numeric, numeric, uuid, jsonb, jsonb, numeric
) from public, anon;
grant execute on function public.global_stock_record_pos_sale(
  uuid, text, text, numeric, numeric, uuid, jsonb, jsonb, numeric
) to authenticated, service_role;

revoke execute on function public.global_stock_record_stock_adjustment(
  uuid, text, text, numeric, numeric, text
) from public, anon;
grant execute on function public.global_stock_record_stock_adjustment(
  uuid, text, text, numeric, numeric, text
) to authenticated, service_role;

revoke execute on function public.global_stock_apply_stock_count(
  uuid, uuid, text, numeric, numeric, text
) from public, anon;
grant execute on function public.global_stock_apply_stock_count(
  uuid, uuid, text, numeric, numeric, text
) to authenticated, service_role;

revoke execute on function public.global_stock_execute_transfer(
  uuid, uuid, uuid, text, numeric, text
) from public, anon;
grant execute on function public.global_stock_execute_transfer(
  uuid, uuid, uuid, text, numeric, text
) to authenticated, service_role;

commit;