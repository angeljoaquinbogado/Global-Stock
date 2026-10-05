create or replace function public.global_stock_delete_my_account(
  p_confirm_email text,
  p_confirm_phrase text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_owned_workspaces integer := 0;
  v_shared_owned_workspaces integer := 0;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  if coalesce(trim(p_confirm_phrase), '') <> 'ELIMINAR MI CUENTA' then
    raise exception using errcode = 'P0001', message = 'CONFIRMATION_REQUIRED';
  end if;

  select lower(u.email)
  into v_email
  from auth.users u
  where u.id = v_user_id
  for update;

  if v_email is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  if lower(trim(coalesce(p_confirm_email, ''))) <> v_email then
    raise exception using errcode = 'P0001', message = 'EMAIL_MISMATCH';
  end if;

  select count(*)
  into v_owned_workspaces
  from public.global_stock_businesses b
  where b.owner_user_id = v_user_id;

  select count(*)
  into v_shared_owned_workspaces
  from public.global_stock_businesses b
  where b.owner_user_id = v_user_id
    and exists (
      select 1
      from public.global_stock_members m
      where m.business_id = b.id
        and m.user_id <> v_user_id
    );

  if v_shared_owned_workspaces > 0 then
    raise exception using
      errcode = 'P0001',
      message = 'OWNERSHIP_TRANSFER_REQUIRED';
  end if;

  delete from auth.users
  where id = v_user_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  return jsonb_build_object(
    'deleted', true,
    'owned_workspaces_deleted', v_owned_workspaces
  );
end;
$$;

revoke all on function public.global_stock_delete_my_account(text, text)
from public, anon, service_role;

grant execute on function public.global_stock_delete_my_account(text, text)
to authenticated;

comment on function public.global_stock_delete_my_account(text, text)
is 'Authenticated self-service account deletion. Requires exact email and confirmation phrase. Refuses deletion while the user owns a workspace that still has another member.';
