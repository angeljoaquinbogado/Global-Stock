-- Isolated PostgreSQL 17 test harness, not a full Supabase schema.
-- All records are synthetic and are discarded with the CI database.
-- Columns mirror the live public.global_stock_* tables used by POS RPCs.
create schema auth;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create table public.global_stock_members (
 business_id uuid not null, user_id uuid not null, role text not null,
 active boolean not null default true, primary key (business_id,user_id)
);
create table public.global_stock_locations (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 name text not null, kind text not null default 'store',
 active boolean not null default true, created_at timestamptz not null default now()
);
create table public.global_stock_products (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 client_key text not null, name text not null, price numeric not null default 0,
 cost numeric, stock numeric not null default 0, active boolean not null default true,
 unique (business_id,client_key)
);
create table public.global_stock_product_variants (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 product_id uuid not null, name text not null, price numeric, cost numeric,
 active boolean not null default true
);
create table public.global_stock_recipes (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 product_key text not null, component_key text not null,
 quantity numeric not null, wastage_pct numeric not null default 0
);
create table public.global_stock_promotions (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 kind text not null, value numeric, active boolean not null default true,
 starts_at timestamptz, ends_at timestamptz
);
create table public.global_stock_customers (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 name text not null, active boolean not null default true,
 account_balance numeric not null default 0
);
create table public.global_stock_cash_sessions (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 location_id uuid, status text not null default 'open',
 opened_at timestamptz not null default now()
);
create table public.global_stock_sales (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 location_id uuid, cash_session_id uuid, customer_id uuid, user_id uuid,
 channel text not null default 'pos', status text not null default 'completed',
 subtotal numeric not null default 0, discount numeric not null default 0,
 total numeric not null default 0, cost_total numeric not null default 0,
 currency text not null default 'ARS', external_id text,
 unique (business_id, channel, external_id)
);
create table public.global_stock_sale_items (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 sale_id uuid not null, product_key text, product_name text not null,
 variant_id uuid, variant_label text, quantity numeric not null,
 unit_price numeric not null default 0, unit_cost numeric not null default 0
);
create table public.global_stock_payments (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 sale_id uuid, customer_id uuid, method text not null, amount numeric not null,
 currency text not null default 'ARS'
);
create table public.global_stock_inventory_levels (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 location_id uuid not null, product_id uuid not null, variant_id uuid,
 on_hand numeric not null default 0, reserved numeric not null default 0,
 updated_at timestamptz not null default now()
);
create unique index gs_test_inventory_base_unique
 on public.global_stock_inventory_levels(business_id,location_id,product_id)
 where variant_id is null;
create unique index gs_test_inventory_variant_unique
 on public.global_stock_inventory_levels(business_id,location_id,product_id,variant_id)
 where variant_id is not null;

create table public.global_stock_stock_movements (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 location_id uuid, product_key text not null, variant_id uuid,
 user_id uuid, kind text not null, quantity numeric not null,
 reason text, reference_id text, operation_id text
);
create unique index gs_stock_movement_operation_unique
 on public.global_stock_stock_movements (business_id,operation_id)
 where operation_id is not null;
create table public.global_stock_cash_movements (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 cash_session_id uuid, user_id uuid, kind text not null, amount numeric not null,
 description text, payment_method text, reference_id text
);
create table public.global_stock_customer_ledger (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 customer_id uuid not null, user_id uuid, kind text not null, amount numeric not null,
 reference_id text, notes text
);
create table public.global_stock_audit_events (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 user_id uuid, action text not null, entity_type text, entity_id text,
 metadata jsonb not null default '{}'::jsonb
);
create table public.global_stock_returns (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 sale_id uuid, user_id uuid, amount numeric not null default 0,
 reason text, status text not null default 'completed'
);
create table public.global_stock_return_items (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 return_id uuid not null, sale_item_id uuid, product_key text,
 product_name text not null, quantity numeric not null,
 unit_price numeric not null default 0, unit_cost numeric not null default 0,
 restock boolean not null default true
);

-- Trigger wiring is applied after production-function snapshots are loaded.
