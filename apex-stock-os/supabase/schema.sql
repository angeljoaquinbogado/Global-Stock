-- Apex Stock OS - multi-tenant PostgreSQL schema
-- Run in a dedicated Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  base_currency text not null default 'ARS' check (char_length(base_currency) = 3),
  locale text not null default 'es-AR',
  timezone text not null default 'America/Argentina/Buenos_Aires',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner','admin','manager','cashier','viewer')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  barcode text not null,
  sku text,
  name text not null check (char_length(name) between 1 and 180),
  category text not null default 'Sin categoría',
  supplier_name text not null default 'Sin proveedor',
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  cost numeric(16,2) not null default 0 check (cost >= 0),
  price numeric(16,2) not null default 0 check (price >= 0),
  sold_30d integer not null default 0 check (sold_30d >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, barcode)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  external_id text,
  channel text not null default 'pos' check (channel in ('pos','web','shopify','woocommerce','mercadolibre','api')),
  currency text not null default 'ARS',
  total numeric(16,2) not null default 0 check (total >= 0),
  cost_total numeric(16,2) not null default 0 check (cost_total >= 0),
  created_at timestamptz not null default now(),
  unique (business_id, channel, external_id)
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(16,2) not null check (unit_price >= 0),
  unit_cost numeric(16,2) not null default 0 check (unit_cost >= 0)
);

create table if not exists public.inventory_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  delta integer not null check (delta <> 0),
  reason text not null check (reason in ('sale','purchase','adjustment','return','transfer','sync')),
  reference_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider text not null,
  external_event_id text not null,
  status text not null check (status in ('received','processed','ignored','failed')),
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  unique (business_id, provider, external_event_id)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists businesses_touch_updated_at on public.businesses;
create trigger businesses_touch_updated_at
before update on public.businesses
for each row execute function public.touch_updated_at();

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.handle_new_business()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.business_members(business_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (business_id, user_id)
  do update set role = 'owner';
  return new;
end;
$$;

drop trigger if exists on_business_created on public.businesses;
create trigger on_business_created
after insert on public.businesses
for each row execute function public.handle_new_business();

create or replace function public.is_business_admin(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
      and bm.role in ('owner','admin')
  );
$$;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.inventory_events enable row level security;
alter table public.sync_logs enable row level security;

create policy "profiles_read_self"
on public.profiles for select
using (id = auth.uid());

create policy "profiles_update_self"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "businesses_read_members"
on public.businesses for select
using (
  owner_id = auth.uid()
  or public.is_business_member(id)
);

create policy "businesses_insert_owner"
on public.businesses for insert
with check (owner_id = auth.uid());

create policy "businesses_update_owner_or_admin"
on public.businesses for update
using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.business_members bm
    where bm.business_id = id
      and bm.user_id = auth.uid()
      and bm.role in ('owner','admin')
  )
);

create policy "members_read_members"
on public.business_members for select
using (public.is_business_member(business_id));

create policy "members_manage_admin"
on public.business_members for all
using (public.is_business_admin(business_id))
with check (public.is_business_admin(business_id));

create policy "products_member_access"
on public.products for all
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "sales_member_access"
on public.sales for all
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "sale_items_member_access"
on public.sale_items for all
using (
  exists (
    select 1
    from public.sales s
    where s.id = sale_id
      and public.is_business_member(s.business_id)
  )
)
with check (
  exists (
    select 1
    from public.sales s
    where s.id = sale_id
      and public.is_business_member(s.business_id)
  )
);

create policy "inventory_events_member_access"
on public.inventory_events for all
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "sync_logs_member_read"
on public.sync_logs for select
using (public.is_business_member(business_id));

create or replace function public.apply_stock_sync(
  target_business_id uuid,
  target_barcode text,
  stock_delta integer,
  sync_reference text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  target_product_id uuid;
  current_stock integer;
  next_stock integer;
begin
  if stock_delta = 0 then
    raise exception 'stock_delta cannot be zero';
  end if;

  select id, stock
    into target_product_id, current_stock
  from public.products
  where business_id = target_business_id
    and barcode = target_barcode
  for update;

  if target_product_id is null then
    raise exception 'product not found for barcode %', target_barcode;
  end if;

  next_stock := current_stock + stock_delta;

  if next_stock < 0 then
    raise exception 'insufficient stock for barcode %', target_barcode;
  end if;

  update public.products
  set stock = next_stock
  where id = target_product_id;

  insert into public.inventory_events(
    business_id,
    product_id,
    actor_id,
    delta,
    reason,
    reference_id
  )
  values (
    target_business_id,
    target_product_id,
    null,
    stock_delta,
    'sync',
    sync_reference
  );

  return next_stock;
end;
$$;

revoke all on function public.apply_stock_sync(uuid, text, integer, text) from public;
grant execute on function public.apply_stock_sync(uuid, text, integer, text) to service_role;

do $$
begin
  alter publication supabase_realtime add table public.products;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.inventory_events;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.sales;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.sync_logs;
exception
  when duplicate_object then null;
end $$;
