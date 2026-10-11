-- Argentina beta: secure store-link requests, distinct from verified connectors.
-- Never store API credentials or treat a URL as proof of ownership.
create table if not exists public.global_stock_integration_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.global_stock_businesses(id) on delete cascade,
  created_by uuid not null default auth.uid(),
  provider text not null check (provider in (
    'mercadolibre','shopify','tiendanube','woocommerce','wix',
    'prestashop','vtex','custom','other'
  )),
  display_name text not null default '',
  store_url text,
  status text not null default 'requested' check (status in ('requested','cancelled','verified','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(display_name) <= 120),
  check (store_url is null or (
    length(store_url) <= 500 and store_url ~* '^https://[a-z0-9][a-z0-9.-]+(:443)?/?$'
  )),
  check (provider not in ('custom','other') or store_url is not null)
);

create unique index if not exists gs_integration_request_unique
 on public.global_stock_integration_requests (business_id, provider, coalesce(store_url,''));

create index if not exists gs_integration_request_business_idx
 on public.global_stock_integration_requests (business_id, created_at desc);

alter table public.global_stock_integration_requests enable row level security;

drop policy if exists gs_integration_request_read on public.global_stock_integration_requests;
create policy gs_integration_request_read
 on public.global_stock_integration_requests for select to authenticated
 using (public.global_stock_is_member(business_id));

drop policy if exists gs_integration_request_create on public.global_stock_integration_requests;
create policy gs_integration_request_create
 on public.global_stock_integration_requests for insert to authenticated
 with check (
   created_by = (select auth.uid())
   and status = 'requested'
   and public.global_stock_member_role(business_id) in ('owner','admin')
 );

-- New requests cannot be promoted to "verified" from a client.
-- Verified integrations must come from a server-authorized OAuth/API handshake.
revoke all on public.global_stock_integration_requests from public, anon;
grant select, insert on public.global_stock_integration_requests to authenticated;

-- Existing RLS policies restrict official connections to tenant members and
-- fiscal profiles to their authorized business.
grant select on public.global_stock_integration_accounts to authenticated;
grant select, insert, update on public.global_stock_fiscal_profiles to authenticated;
