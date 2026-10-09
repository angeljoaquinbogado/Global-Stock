-- Exact deployed RPC wrapper and sale-return function; local PostgreSQL only.
-- Source captured through read-only pg_get_functiondef on 2026-10-09.

CREATE OR REPLACE FUNCTION public.global_stock_record_pos_sale(target_business_id uuid, operation_id text, sale_currency text, sale_total numeric, sale_cost_total numeric, target_customer_id uuid, sale_lines jsonb, sale_payments jsonb, received_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$


CREATE OR REPLACE FUNCTION public.global_stock_return_sale_item(target_business_id uuid, target_sale_item_id uuid, return_quantity numeric, return_reason text DEFAULT NULL::text, restock boolean DEFAULT true, refund_method text DEFAULT 'cash'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  sale_item_row record;
  already_returned numeric;
  available_quantity numeric;
  return_amount numeric;
  created_return uuid;
  total_returned_amount numeric;
  recipe_count integer;
  recipe_row record;
  restore_quantity numeric;
begin
  if (select auth.uid()) is null
     or not public.global_stock_can_write(target_business_id,'sales') then
    raise exception 'not authorized';
  end if;

  if return_quantity is null or return_quantity <= 0 then
    raise exception 'invalid return quantity';
  end if;

  select
    si.id as sale_item_id,
    si.sale_id,
    si.product_key,
    si.product_name,
    si.variant_id,
    si.variant_label,
    si.quantity,
    si.unit_price,
    si.unit_cost,
    s.total as sale_total,
    s.location_id,
    s.cash_session_id,
    s.status as sale_status
  into sale_item_row
  from public.global_stock_sale_items si
  join public.global_stock_sales s
    on s.id=si.sale_id and s.business_id=si.business_id
  where si.id=target_sale_item_id
    and si.business_id=target_business_id
  for update of s;

  if sale_item_row.sale_item_id is null then
    raise exception 'sale item not found';
  end if;

  if sale_item_row.sale_status not in ('completed','partially_refunded') then
    raise exception 'sale cannot be returned';
  end if;

  select coalesce(sum(ri.quantity),0)
  into already_returned
  from public.global_stock_return_items ri
  join public.global_stock_returns r on r.id=ri.return_id
  where ri.sale_item_id=target_sale_item_id
    and r.business_id=target_business_id
    and r.status='completed';

  available_quantity :=
    greatest(0,sale_item_row.quantity-already_returned);

  if return_quantity > available_quantity then
    raise exception 'return quantity exceeds available quantity';
  end if;

  return_amount := return_quantity*sale_item_row.unit_price;

  insert into public.global_stock_returns(
    business_id,sale_id,user_id,amount,reason,status
  )
  values(
    target_business_id,
    sale_item_row.sale_id,
    (select auth.uid()),
    return_amount,
    nullif(trim(coalesce(return_reason,'')),''),
    'completed'
  )
  returning id into created_return;

  insert into public.global_stock_return_items(
    business_id,
    return_id,
    sale_item_id,
    product_key,
    product_name,
    quantity,
    unit_price,
    unit_cost,
    restock
  )
  values(
    target_business_id,
    created_return,
    target_sale_item_id,
    sale_item_row.product_key,
    coalesce(
      sale_item_row.product_name ||
      case
        when sale_item_row.variant_label is not null
          then ' · '||sale_item_row.variant_label
        else ''
      end,
      sale_item_row.product_name
    ),
    return_quantity,
    sale_item_row.unit_price,
    sale_item_row.unit_cost,
    restock
  );

  if restock and sale_item_row.product_key is not null then
    select count(*) into recipe_count
    from public.global_stock_recipes r
    where r.business_id=target_business_id
      and r.product_key=sale_item_row.product_key;

    if recipe_count > 0 then
      for recipe_row in
        select component_key,quantity,wastage_pct
        from public.global_stock_recipes
        where business_id=target_business_id
          and product_key=sale_item_row.product_key
      loop
        restore_quantity :=
          return_quantity*recipe_row.quantity*
          (1+(coalesce(recipe_row.wastage_pct,0)/100.0));

        insert into public.global_stock_stock_movements(
          business_id,
          location_id,
          product_key,
          user_id,
          kind,
          quantity,
          reason,
          reference_id,
          operation_id
        )
        values(
          target_business_id,
          sale_item_row.location_id,
          recipe_row.component_key,
          (select auth.uid()),
          'return',
          abs(restore_quantity),
          'Recipe return',
          created_return::text,
          'return:'||created_return::text||':recipe:'||
            recipe_row.component_key
        )
        on conflict (business_id,operation_id)
        where operation_id is not null
        do nothing;
      end loop;
    else
      insert into public.global_stock_stock_movements(
        business_id,
        location_id,
        product_key,
        variant_id,
        user_id,
        kind,
        quantity,
        reason,
        reference_id,
        operation_id
      )
      values(
        target_business_id,
        sale_item_row.location_id,
        sale_item_row.product_key,
        sale_item_row.variant_id,
        (select auth.uid()),
        'return',
        abs(return_quantity),
        'Sale return',
        created_return::text,
        'return:'||created_return::text||':'||
          sale_item_row.product_key||':'||
          coalesce(sale_item_row.variant_id::text,'base')
      )
      on conflict (business_id,operation_id)
      where operation_id is not null
      do nothing;
    end if;
  end if;

  if refund_method='cash'
     and sale_item_row.cash_session_id is not null
     and return_amount > 0 then
    insert into public.global_stock_cash_movements(
      business_id,
      cash_session_id,
      user_id,
      kind,
      amount,
      description,
      payment_method,
      reference_id
    )
    values(
      target_business_id,
      sale_item_row.cash_session_id,
      (select auth.uid()),
      'refund',
      return_amount,
      'Devolución parcial',
      'cash',
      created_return::text
    );
  end if;

  select coalesce(sum(r.amount),0)
  into total_returned_amount
  from public.global_stock_returns r
  where r.business_id=target_business_id
    and r.sale_id=sale_item_row.sale_id
    and r.status='completed';

  update public.global_stock_sales
  set status=case
    when total_returned_amount >= sale_item_row.sale_total-0.01
      then 'refunded'
    else 'partially_refunded'
  end
  where id=sale_item_row.sale_id
    and business_id=target_business_id;

  insert into public.global_stock_audit_events(
    business_id,user_id,action,entity_type,entity_id,metadata
  )
  values(
    target_business_id,
    (select auth.uid()),
    'sale.item_returned',
    'sale',
    sale_item_row.sale_id::text,
    jsonb_build_object(
      'returnId',created_return,
      'saleItemId',target_sale_item_id,
      'productKey',sale_item_row.product_key,
      'variantId',sale_item_row.variant_id,
      'locationId',sale_item_row.location_id,
      'quantity',return_quantity,
      'amount',return_amount,
      'restock',restock,
      'refundMethod',refund_method
    )
  );

  return created_return;
end;
$function$

