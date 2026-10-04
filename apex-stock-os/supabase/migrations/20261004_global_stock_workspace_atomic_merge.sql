-- Atomically merge business-scoped workspace modules.
-- Prevents concurrent modules from overwriting unrelated state fields.

create or replace function public.global_stock_merge_workspace_state(
  target_business_id uuid,
  state_patch jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  merged_state jsonb;
begin
  if target_business_id is null then
    raise exception 'business id is required';
  end if;

  insert into public.global_stock_workspaces (
    business_id,
    state,
    revision,
    updated_by,
    updated_at
  )
  values (
    target_business_id,
    coalesce(state_patch, '{}'::jsonb),
    (extract(epoch from clock_timestamp()) * 1000)::bigint,
    auth.uid(),
    now()
  )
  on conflict (business_id) do update
  set
    state = coalesce(public.global_stock_workspaces.state, '{}'::jsonb)
      || coalesce(excluded.state, '{}'::jsonb),
    revision = (extract(epoch from clock_timestamp()) * 1000)::bigint,
    updated_by = auth.uid(),
    updated_at = now()
  returning state into merged_state;

  return merged_state;
end;
$$;

revoke all on function public.global_stock_merge_workspace_state(uuid, jsonb)
from public, anon;

grant execute on function public.global_stock_merge_workspace_state(uuid, jsonb)
to authenticated;
