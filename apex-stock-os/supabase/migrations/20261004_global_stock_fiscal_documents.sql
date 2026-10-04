-- Global Stock fiscal documents foundation (Argentina-ready, provider-agnostic).
-- Applied to production on 2026-10-04.
-- A document is never treated as fiscal until an external tax provider authorizes it.

create table if not exists public.global_stock_fiscal_profiles (
  business_id uuid primary key references public.global_stock_businesses(id) on delete cascade,
  country text not null default 'AR',
  legal_name text not null default '',
  tax_id text not null default '',
  tax_condition text not null default '',
  gross_income_number text,
  fiscal_address text not null default '',
  activity_start_date date,
  point_of_sale integer check (point_of_sale is null or point_of_sale between 1 and 99999),
  provider text not null default 'arca',
  environment text not null default 'production' check (environment in ('production','testing')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.global_stock_fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.global_stock_businesses(id) on delete cascade,
  sale_id uuid references public.global_stock_sales(id) on delete set null,
  related_document_id uuid references public.global_stock_fiscal_documents(id) on delete set null,
  kind text not null check (kind in ('invoice','credit_note','debit_note')),
  letter text check (letter is null or letter in ('A','B','C','M','E','T')),
  status text not null default 'draft' check (status in ('draft','pending_authorization','authorized','rejected')),
  local_reference text not null,
  point_of_sale integer check (point_of_sale is null or point_of_sale between 1 and 99999),
  voucher_number bigint check (voucher_number is null or voucher_number > 0),
  customer_name text not null default '',
  customer_document_type text not null default 'DNI',
  customer_document_number text not null default '',
  customer_tax_condition text not null default '',
  currency text not null default 'ARS',
  exchange_rate numeric(18,6) not null default 1 check (exchange_rate > 0),
  net_amount numeric(18,2) not null default 0 check (net_amount >= 0),
  vat_amount numeric(18,2) not null default 0 check (vat_amount >= 0),
  exempt_amount numeric(18,2) not null default 0 check (exempt_amount >= 0),
  other_taxes numeric(18,2) not null default 0 check (other_taxes >= 0),
  total_amount numeric(18,2) not null default 0 check (total_amount >= 0),
  concept text,
  due_date date,
  issued_at timestamptz,
  authorization_code text,
  authorization_expires_at date,
  qr_url text,
  provider text not null default 'arca',
  provider_request_id text,
  provider_response jsonb not null default '{}'::jsonb,
  rejection_reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, local_reference)
);

create unique index if not exists global_stock_fiscal_documents_official_number_unique
on public.global_stock_fiscal_documents (
  business_id,
  point_of_sale,
  kind,
  coalesce(letter, ''),
  voucher_number
)
where voucher_number is not null;

create index if not exists global_stock_fiscal_documents_business_created_idx
on public.global_stock_fiscal_documents (business_id, created_at desc);

create index if not exists global_stock_fiscal_documents_sale_idx
on public.global_stock_fiscal_documents (sale_id)
where sale_id is not null;

create table if not exists public.global_stock_fiscal_document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.global_stock_fiscal_documents(id) on delete cascade,
  description text not null,
  quantity numeric(18,4) not null default 1 check (quantity > 0),
  unit_price numeric(18,4) not null default 0 check (unit_price >= 0),
  tax_rate numeric(8,4) not null default 0 check (tax_rate >= 0),
  line_total numeric(18,2) not null default 0 check (line_total >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.global_stock_fiscal_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.global_stock_businesses(id) on delete cascade,
  document_id uuid references public.global_stock_fiscal_documents(id) on delete cascade,
  event_type text not null,
  status text,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists global_stock_fiscal_events_document_idx
on public.global_stock_fiscal_events (document_id, created_at desc);

create or replace function public.global_stock_touch_fiscal_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists global_stock_fiscal_profiles_touch on public.global_stock_fiscal_profiles;
create trigger global_stock_fiscal_profiles_touch
before update on public.global_stock_fiscal_profiles
for each row execute function public.global_stock_touch_fiscal_updated_at();

drop trigger if exists global_stock_fiscal_documents_touch on public.global_stock_fiscal_documents;
create trigger global_stock_fiscal_documents_touch
before update on public.global_stock_fiscal_documents
for each row execute function public.global_stock_touch_fiscal_updated_at();

create or replace function public.global_stock_protect_authorized_fiscal_document()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'authorized' then
    raise exception 'authorized fiscal documents are immutable; issue a credit/debit note instead';
  end if;

  if new.status = 'authorized' then
    if nullif(trim(coalesce(new.authorization_code, '')), '') is null
       or new.voucher_number is null
       or new.issued_at is null
       or new.point_of_sale is null then
      raise exception 'authorized fiscal document requires authorization code, official number, issue date and point of sale';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists global_stock_fiscal_documents_immutable on public.global_stock_fiscal_documents;
create trigger global_stock_fiscal_documents_immutable
before update on public.global_stock_fiscal_documents
for each row execute function public.global_stock_protect_authorized_fiscal_document();

alter table public.global_stock_fiscal_profiles enable row level security;
alter table public.global_stock_fiscal_documents enable row level security;
alter table public.global_stock_fiscal_document_items enable row level security;
alter table public.global_stock_fiscal_events enable row level security;

drop policy if exists gs_fiscal_profiles_read on public.global_stock_fiscal_profiles;
create policy gs_fiscal_profiles_read
on public.global_stock_fiscal_profiles
for select to authenticated
using (public.global_stock_is_member(business_id));

drop policy if exists gs_fiscal_profiles_write on public.global_stock_fiscal_profiles;
create policy gs_fiscal_profiles_write
on public.global_stock_fiscal_profiles
for all to authenticated
using (public.global_stock_member_role(business_id) in ('owner','admin'))
with check (public.global_stock_member_role(business_id) in ('owner','admin'));

drop policy if exists gs_fiscal_documents_read on public.global_stock_fiscal_documents;
create policy gs_fiscal_documents_read
on public.global_stock_fiscal_documents
for select to authenticated
using (public.global_stock_is_member(business_id));

drop policy if exists gs_fiscal_documents_write on public.global_stock_fiscal_documents;
create policy gs_fiscal_documents_write
on public.global_stock_fiscal_documents
for all to authenticated
using (public.global_stock_member_role(business_id) in ('owner','admin','manager','accountant'))
with check (public.global_stock_member_role(business_id) in ('owner','admin','manager','accountant'));

drop policy if exists gs_fiscal_items_read on public.global_stock_fiscal_document_items;
create policy gs_fiscal_items_read
on public.global_stock_fiscal_document_items
for select to authenticated
using (
  exists (
    select 1
    from public.global_stock_fiscal_documents d
    where d.id = document_id
      and public.global_stock_is_member(d.business_id)
  )
);

drop policy if exists gs_fiscal_items_write on public.global_stock_fiscal_document_items;
create policy gs_fiscal_items_write
on public.global_stock_fiscal_document_items
for all to authenticated
using (
  exists (
    select 1
    from public.global_stock_fiscal_documents d
    where d.id = document_id
      and d.status <> 'authorized'
      and public.global_stock_member_role(d.business_id) in ('owner','admin','manager','accountant')
  )
)
with check (
  exists (
    select 1
    from public.global_stock_fiscal_documents d
    where d.id = document_id
      and d.status <> 'authorized'
      and public.global_stock_member_role(d.business_id) in ('owner','admin','manager','accountant')
  )
);

drop policy if exists gs_fiscal_events_read on public.global_stock_fiscal_events;
create policy gs_fiscal_events_read
on public.global_stock_fiscal_events
for select to authenticated
using (public.global_stock_is_member(business_id));

drop policy if exists gs_fiscal_events_insert on public.global_stock_fiscal_events;
create policy gs_fiscal_events_insert
on public.global_stock_fiscal_events
for insert to authenticated
with check (
  public.global_stock_member_role(business_id) in ('owner','admin','manager','accountant')
);

create or replace function public.global_stock_log_fiscal_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.global_stock_audit_events(
      business_id, user_id, action, entity_type, entity_id, after_data, metadata
    ) values (
      new.business_id,
      auth.uid(),
      'fiscal_document.created',
      'fiscal_document',
      new.id::text,
      to_jsonb(new),
      jsonb_build_object('status', new.status, 'local_reference', new.local_reference)
    );
    return new;
  end if;

  insert into public.global_stock_audit_events(
    business_id, user_id, action, entity_type, entity_id, before_data, after_data, metadata
  ) values (
    new.business_id,
    auth.uid(),
    'fiscal_document.updated',
    'fiscal_document',
    new.id::text,
    to_jsonb(old),
    to_jsonb(new),
    jsonb_build_object('from_status', old.status, 'to_status', new.status)
  );

  return new;
end;
$$;

drop trigger if exists global_stock_fiscal_documents_audit on public.global_stock_fiscal_documents;
create trigger global_stock_fiscal_documents_audit
after insert or update on public.global_stock_fiscal_documents
for each row execute function public.global_stock_log_fiscal_change();
