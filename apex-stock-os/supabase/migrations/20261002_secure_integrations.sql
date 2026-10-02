-- Global Stock secure provider credential storage.
-- Applied to Supabase on 2026-10-02.

create table if not exists public.global_stock_integration_secrets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.global_stock_businesses(id) on delete cascade,
  provider text not null,
  connection_key text not null default 'primary',
  encrypted_access_token text,
  encrypted_refresh_token text,
  token_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, provider, connection_key)
);

alter table public.global_stock_integration_secrets enable row level security;

drop policy if exists gs_integration_secrets_no_client_access
on public.global_stock_integration_secrets;

create policy gs_integration_secrets_no_client_access
on public.global_stock_integration_secrets
for all
to authenticated
using (false)
with check (false);

create or replace function public.global_stock_disconnect_integration(
  target_business_id uuid,
  target_provider text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null
     or public.global_stock_member_role(target_business_id)
        not in ('owner','admin') then
    raise exception 'not authorized';
  end if;

  delete from public.global_stock_integration_secrets
  where business_id = target_business_id
    and provider = lower(trim(target_provider));

  delete from public.global_stock_integration_accounts
  where business_id = target_business_id
    and provider = lower(trim(target_provider));

  insert into public.global_stock_audit_events(
    business_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values(
    target_business_id,
    (select auth.uid()),
    'integration.disconnected',
    'integration',
    lower(trim(target_provider)),
    jsonb_build_object('provider', lower(trim(target_provider)))
  );

  return true;
end;
$$;

revoke all on function public.global_stock_disconnect_integration(uuid,text)
from public, anon;

grant execute on function public.global_stock_disconnect_integration(uuid,text)
to authenticated;
