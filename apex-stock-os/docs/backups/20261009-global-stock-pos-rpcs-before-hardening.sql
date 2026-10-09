-- REVERSIBLE FUNCTION-ONLY BACKUP FROM PROD BEFORE POS HARDENING
-- Global Stock project yckimhbtvijmmkxukxgd, Oct 9, 2026.
-- NO CUSTOMER DATA, TOKENS, PASSWORDS OR SECRETS.
-- Executing this rollback would restore the original definitions and privileges.
-- Requires explicit owner authorization for rollback. DO NOT AUTO-RUN.

begin;

CREATE OR REPLACE FUNCTION public.global_stock_record_pos_sale_legacy_unsafe(target_business_id uuid, operation_id text, sale_currency text, sale_total numeric, sale_cost_total numeric, target_customer_id uuid, sale_lines jsonb, sale_payments jsonb, received_amount numeric DEFAULT NULL::numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  existing_sale uuid;
  created_sale uuid;
  open_cash uuid;
  location_value uuid;
  line jsonb;
  payment jsonb;
  recipe_row record;
  recipe_count integer;
  payment_sum numeric := 0;
  cash_amount numeric := 0;
  account_amount numeric := 0;
  quantity_value numeric;
  product_key_value text;
  product_name_value text;
  product_id_value uuid;
  variant_id_value uuid;
  variant_label_value text;
  unit_price_value numeric;
  unit_cost_value numeric;
  payment_method_value text;
  payment_amount_value numeric;
  recipe_quantity numeric;
  available_quantity numeric;
  component_product_id uuid;
begin
  if (select auth.uid()) is null
     or not public.global_stock_can_write(target_business_id,'sales') then
    raise exception 'not authorized';
  end if;

  if operation_id is null or length(trim(operation_id)) < 8 then
    raise exception 'invalid operation id';
  end if;

  select id into existing_sale
  from public.global_stock_sales
  where business_id=target_business_id
    and channel='pos'
    and external_id='client:'||operation_id
  limit 1;

  if existing_sale is not null then
    return existing_sale;
  end if;

  if sale_total is null or sale_total < 0
     or sale_cost_total is null or sale_cost_total < 0 then
    raise exception 'invalid totals';
  end if;

  if jsonb_typeof(sale_lines) <> 'array'
     or jsonb_array_length(sale_lines)=0 then
    raise exception 'sale has no lines';
  end if;

  if jsonb_typeof(sale_payments) <> 'array'
     or jsonb_array_length(sale_payments)=0 then
    raise exception 'sale has no payments';
  end if;

  begin
    location_value :=
      nullif(sale_lines->0->>'locationId','')::uuid;
  exception when others then
    location_value := null;
  end;

  if location_value is not null then
    if not exists(
      select 1
      from public.global_stock_locations
      where id=location_value
        and business_id=target_business_id
        and active=true
    ) then
      raise exception 'invalid sale location';
    end if;
  else
    select cs.location_id,cs.id
      into location_value,open_cash
    from public.global_stock_cash_sessions cs
    where cs.business_id=target_business_id
      and cs.status='open'
    order by cs.opened_at desc
    limit 1;

    if location_value is null then
      select id into location_value
      from public.global_stock_locations
      where business_id=target_business_id
        and active=true
      order by case when kind='store' then 0 else 1 end,created_at
      limit 1;
    end if;
  end if;

  if open_cash is null then
    select id into open_cash
    from public.global_stock_cash_sessions
    where business_id=target_business_id
      and status='open'
      and (
        location_value is null
        or location_id=location_value
      )
    order by opened_at desc
    limit 1;
  end if;

  perform public.global_stock_seed_inventory_levels(target_business_id);

  for payment in select * from jsonb_array_elements(sale_payments)
  loop
    payment_amount_value :=
      greatest(0,coalesce((payment->>'amount')::numeric,0));
    payment_sum := payment_sum+payment_amount_value;
  end loop;

  if abs(payment_sum-sale_total) > 0.02 then
    raise exception 'payment total mismatch';
  end if;

  for line in select * from jsonb_array_elements(sale_lines)
  loop
    product_key_value := nullif(line->>'productKey','');
    quantity_value := greatest(0,coalesce((line->>'quantity')::numeric,0));

    if product_key_value is null or quantity_value <= 0 then
      raise exception 'invalid sale line';
    end if;

    select id into product_id_value
    from public.global_stock_products
    where business_id=target_business_id
      and client_key=product_key_value
      and active=true
    limit 1;

    if product_id_value is null then
      raise exception 'product not found';
    end if;

    begin
      variant_id_value := nullif(line->>'variantId','')::uuid;
    exception when others then
      variant_id_value := null;
    end;

    if variant_id_value is not null and not exists(
      select 1
      from public.global_stock_product_variants v
      where v.id=variant_id_value
        and v.business_id=target_business_id
        and v.product_id=product_id_value
        and v.active=true
    ) then
      raise exception 'invalid variant';
    end if;

    select count(*) into recipe_count
    from public.global_stock_recipes r
    where r.business_id=target_business_id
      and r.product_key=product_key_value;

    if recipe_count > 0 then
      for recipe_row in
        select r.component_key,r.quantity,r.wastage_pct
        from public.global_stock_recipes r
        where r.business_id=target_business_id
          and r.product_key=product_key_value
      loop
        recipe_quantity :=
          quantity_value*recipe_row.quantity*
          (1+(coalesce(recipe_row.wastage_pct,0)/100.0));

        select id into component_product_id
        from public.global_stock_products
        where business_id=target_business_id
          and client_key=recipe_row.component_key
          and active=true
        limit 1;

        if component_product_id is null then
          raise exception 'recipe component not found';
        end if;

        select coalesce(on_hand-reserved,0)
          into available_quantity
        from public.global_stock_inventory_levels
        where business_id=target_business_id
          and location_id=location_value
          and product_id=component_product_id
          and variant_id is null
        limit 1
        for update;

        if coalesce(available_quantity,0) < recipe_quantity then
          raise exception 'insufficient recipe stock';
        end if;
      end loop;
    else
      select coalesce(on_hand-reserved,0)
        into available_quantity
      from public.global_stock_inventory_levels
      where business_id=target_business_id
        and location_id=location_value
        and product_id=product_id_value
        and (
          (variant_id_value is null and variant_id is null)
          or variant_id=variant_id_value
        )
      limit 1
      for update;

      if coalesce(available_quantity,0) < quantity_value then
        raise exception 'insufficient stock at sale location';
      end if;
    end if;
  end loop;

  insert into public.global_stock_sales(
    business_id,location_id,cash_session_id,customer_id,user_id,
    channel,status,subtotal,total,cost_total,currency,external_id
  )
  values(
    target_business_id,location_value,open_cash,target_customer_id,
    (select auth.uid()),'pos','completed',sale_total,sale_total,
    sale_cost_total,sale_currency,'client:'||operation_id
  )
  returning id into created_sale;

  for line in select * from jsonb_array_elements(sale_lines)
  loop
    product_key_value := nullif(line->>'productKey','');
    product_name_value :=
      coalesce(nullif(line->>'productName',''),'Producto');
    quantity_value :=
      greatest(0,coalesce((line->>'quantity')::numeric,0));
    unit_price_value :=
      greatest(0,coalesce((line->>'unitPrice')::numeric,0));
    unit_cost_value :=
      greatest(0,coalesce((line->>'unitCost')::numeric,0));
    variant_label_value := nullif(line->>'variantLabel','');

    begin
      variant_id_value := nullif(line->>'variantId','')::uuid;
    exception when others then
      variant_id_value := null;
    end;

    insert into public.global_stock_sale_items(
      business_id,sale_id,product_key,product_name,
      variant_id,variant_label,quantity,unit_price,unit_cost
    )
    values(
      target_business_id,created_sale,product_key_value,product_name_value,
      variant_id_value,variant_label_value,quantity_value,
      unit_price_value,unit_cost_value
    );

    select count(*) into recipe_count
    from public.global_stock_recipes r
    where r.business_id=target_business_id
      and r.product_key=product_key_value;

    if recipe_count > 0 then
      for recipe_row in
        select r.component_key,r.quantity,r.wastage_pct
        from public.global_stock_recipes r
        where r.business_id=target_business_id
          and r.product_key=product_key_value
      loop
        recipe_quantity :=
          quantity_value*recipe_row.quantity*
          (1+(coalesce(recipe_row.wastage_pct,0)/100.0));

        insert into public.global_stock_stock_movements(
          business_id,location_id,product_key,user_id,kind,quantity,
          reason,reference_id,operation_id
        )
        values(
          target_business_id,location_value,recipe_row.component_key,
          (select auth.uid()),'sale',-abs(recipe_quantity),
          'Recipe component',created_sale::text,
          operation_id||':recipe:'||product_key_value||':'||
            recipe_row.component_key
        )
        on conflict (business_id,operation_id)
        where operation_id is not null
        do nothing;
      end loop;
    else
      insert into public.global_stock_stock_movements(
        business_id,location_id,product_key,variant_id,user_id,
        kind,quantity,reason,reference_id,operation_id
      )
      values(
        target_business_id,location_value,product_key_value,
        variant_id_value,(select auth.uid()),'sale',-quantity_value,
        'POS',created_sale::text,
        operation_id||':product:'||product_key_value||':'||
          coalesce(variant_id_value::text,'base')
      )
      on conflict (business_id,operation_id)
      where operation_id is not null
      do nothing;
    end if;
  end loop;

  for payment in select * from jsonb_array_elements(sale_payments)
  loop
    payment_method_value :=
      coalesce(nullif(payment->>'method',''),'cash');
    payment_amount_value :=
      greatest(0,coalesce((payment->>'amount')::numeric,0));

    insert into public.global_stock_payments(
      business_id,sale_id,customer_id,method,amount,currency
    )
    values(
      target_business_id,created_sale,target_customer_id,
      payment_method_value,payment_amount_value,sale_currency
    );

    if payment_method_value='cash' then
      cash_amount := cash_amount+payment_amount_value;
    elsif payment_method_value='account' then
      account_amount := account_amount+payment_amount_value;
    end if;
  end loop;

  if open_cash is not null and cash_amount > 0 then
    insert into public.global_stock_cash_movements(
      business_id,cash_session_id,user_id,kind,amount,
      description,payment_method,reference_id
    )
    values(
      target_business_id,open_cash,(select auth.uid()),
      'sale',cash_amount,'Venta POS','cash',created_sale::text
    );
  end if;

  if target_customer_id is not null and account_amount > 0 then
    insert into public.global_stock_customer_ledger(
      business_id,customer_id,user_id,kind,amount,reference_id,notes
    )
    values(
      target_business_id,target_customer_id,(select auth.uid()),
      'charge',account_amount,created_sale::text,
      'Venta POS a cuenta corriente'
    );

    update public.global_stock_customers
    set account_balance=account_balance+account_amount
    where id=target_customer_id
      and business_id=target_business_id;
  end if;

  insert into public.global_stock_audit_events(
    business_id,user_id,action,entity_type,entity_id,metadata
  )
  values(
    target_business_id,(select auth.uid()),'sale.completed','sale',
    created_sale::text,
    jsonb_build_object(
      'operationId',operation_id,
      'locationId',location_value,
      'total',sale_total,
      'currency',sale_currency,
      'customerId',target_customer_id,
      'payments',sale_payments,
      'receivedAmount',received_amount
    )
  );

  return created_sale;
end;
$function$;

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
$function$;

revoke all on function public.global_stock_record_pos_sale_legacy_unsafe(uuid, text, text, numeric, numeric, uuid, jsonb, jsonb, numeric) from public, anon, authenticated, service_role;
grant execute on function public.global_stock_record_pos_sale_legacy_unsafe(uuid, text, text, numeric, numeric, uuid, jsonb, jsonb, numeric) to postgres;
revoke all on function public.global_stock_record_pos_sale(uuid, text, text, numeric, numeric, uuid, jsonb, jsonb, numeric) from public, anon, authenticated, service_role;
grant execute on function public.global_stock_record_pos_sale(uuid, text, text, numeric, numeric, uuid, jsonb, jsonb, numeric) to postgres, authenticated, service_role;

commit;
