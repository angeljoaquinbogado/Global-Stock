-- Read-only snapshots from the real deployed Global Stock PostgreSQL functions.
-- Logic source: production Supabase (2026-10-09); only functions, never customer data.
-- Used ONLY in isolated test Postgres. Not installed in production.

CREATE OR REPLACE FUNCTION public.global_stock_member_role(target_business_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select m.role
  from public.global_stock_members m
  where m.business_id = target_business_id
    and m.user_id = (select auth.uid())
    and m.active = true
  limit 1;
$function$


CREATE OR REPLACE FUNCTION public.global_stock_is_member(target_business_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.global_stock_members m
    where m.business_id = target_business_id
      and m.user_id = auth.uid()
      and m.active = true
  );
$function$


CREATE OR REPLACE FUNCTION public.global_stock_can_write(target_business_id uuid, domain text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  member_role text;
begin
  member_role := public.global_stock_member_role(target_business_id);

  if member_role is null or member_role = 'viewer' then
    return false;
  end if;

  if member_role in ('owner','admin','manager') then
    return true;
  end if;

  return case domain
    when 'workspace' then member_role in ('cashier','warehouse','sales','accountant')
    when 'cash' then member_role in ('cashier','sales','accountant')
    when 'sales' then member_role in ('cashier','sales')
    when 'customers' then member_role in ('cashier','sales','accountant')
    when 'inventory' then member_role in ('warehouse')
    when 'purchasing' then member_role in ('warehouse','accountant')
    when 'finance' then member_role in ('accountant')
    when 'operations' then member_role in ('cashier','sales','warehouse')
    when 'services' then member_role in ('sales','warehouse')
    else false
  end;
end;
$function$


CREATE OR REPLACE FUNCTION public.global_stock_seed_inventory_levels(target_business_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  principal_location uuid;
  inserted_count integer := 0;
begin
  if (select auth.uid()) is null
     or not public.global_stock_is_member(target_business_id) then
    raise exception 'not authorized';
  end if;

  select id into principal_location
  from public.global_stock_locations
  where business_id = target_business_id
    and active = true
  order by
    case when kind = 'store' then 0 else 1 end,
    created_at
  limit 1;

  if principal_location is null then
    return 0;
  end if;

  insert into public.global_stock_inventory_levels(
    business_id,
    location_id,
    product_id,
    variant_id,
    on_hand,
    reserved
  )
  select
    p.business_id,
    principal_location,
    p.id,
    null,
    p.stock,
    0
  from public.global_stock_products p
  where p.business_id = target_business_id
    and p.active = true
    and not exists (
      select 1
      from public.global_stock_inventory_levels il
      where il.business_id = p.business_id
        and il.product_id = p.id
        and il.variant_id is null
    );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$function$


CREATE OR REPLACE FUNCTION public.global_stock_apply_stock_movement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  target_product uuid;
  target_location uuid;
  level_id uuid;
  total_variant_stock numeric;
  has_variants boolean;
begin
  select id into target_product
  from public.global_stock_products
  where business_id = new.business_id
    and client_key = new.product_key
  limit 1;

  if target_product is null then
    return new;
  end if;

  if new.kind not in ('transfer_in','transfer_out') then
    update public.global_stock_products
    set stock = greatest(0, stock + new.quantity)
    where id = target_product;
  end if;

  target_location := new.location_id;

  if target_location is null then
    select id into target_location
    from public.global_stock_locations
    where business_id = new.business_id
      and active = true
    order by
      case when kind = 'store' then 0 else 1 end,
      created_at
    limit 1;
  end if;

  if target_location is not null then
    select id into level_id
    from public.global_stock_inventory_levels
    where business_id = new.business_id
      and location_id = target_location
      and product_id = target_product
      and (
        (new.variant_id is null and variant_id is null)
        or variant_id = new.variant_id
      )
    limit 1
    for update;

    if level_id is null then
      insert into public.global_stock_inventory_levels(
        business_id,
        location_id,
        product_id,
        variant_id,
        on_hand,
        reserved,
        updated_at
      )
      values(
        new.business_id,
        target_location,
        target_product,
        new.variant_id,
        greatest(0,new.quantity),
        0,
        now()
      );
    else
      update public.global_stock_inventory_levels
      set on_hand = greatest(0,on_hand + new.quantity),
          updated_at = now()
      where id = level_id;
    end if;
  end if;

  if new.variant_id is not null then
    select exists(
      select 1
      from public.global_stock_product_variants v
      where v.business_id = new.business_id
        and v.product_id = target_product
        and v.active = true
    ) into has_variants;

    if has_variants then
      select coalesce(sum(il.on_hand),0)
      into total_variant_stock
      from public.global_stock_inventory_levels il
      join public.global_stock_product_variants v
        on v.id = il.variant_id
       and v.product_id = target_product
       and v.business_id = new.business_id
       and v.active = true
      where il.business_id = new.business_id
        and il.product_id = target_product
        and il.variant_id is not null;

      update public.global_stock_products
      set stock = total_variant_stock
      where id = target_product
        and business_id = new.business_id;
    end if;
  end if;

  return new;
end;
$function$


CREATE OR REPLACE FUNCTION public.global_stock_recalculate_sale_totals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  target_sale uuid;
  calculated_subtotal numeric;
  stored_total numeric;
begin
  target_sale := coalesce(new.sale_id, old.sale_id);

  select coalesce(sum(si.quantity * si.unit_price), 0)
    into calculated_subtotal
  from public.global_stock_sale_items si
  where si.sale_id = target_sale;

  select total
    into stored_total
  from public.global_stock_sales
  where id = target_sale;

  update public.global_stock_sales
  set
    subtotal = calculated_subtotal,
    discount = greatest(
      0,
      calculated_subtotal - coalesce(stored_total, 0)
    )
  where id = target_sale;

  return coalesce(new, old);
end;
$function$


create trigger gs_apply_stock_movement after insert on public.global_stock_stock_movements
 for each row execute function public.global_stock_apply_stock_movement();
create trigger gs_recalculate_sale_totals after insert or update or delete on public.global_stock_sale_items
 for each row execute function public.global_stock_recalculate_sale_totals();
