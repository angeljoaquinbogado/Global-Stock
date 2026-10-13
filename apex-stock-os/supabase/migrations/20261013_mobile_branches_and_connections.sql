-- Manage multiple store locations without deleting historic operations.
create or replace function public.global_stock_archive_location(
  target_business_id uuid, target_location_id uuid
) returns boolean language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_current record;
  v_active integer;
begin
  if auth.uid() is null or
    public.global_stock_member_role(target_business_id) not in ('owner','admin') then
    raise exception 'NOT_AUTHORIZED' using errcode = '42501';
  end if;
  select * into v_current from public.global_stock_locations
   where id=target_location_id and business_id=target_business_id for update;
  if not found then raise exception 'LOCATION_NOT_FOUND'; end if;
  if not v_current.active then return true; end if;
  select count(*) into v_active from public.global_stock_locations
   where business_id=target_business_id and active;
  if v_active <= 1 then raise exception 'CANNOT_ARCHIVE_LAST_LOCATION'; end if;
  if exists (
    select 1 from public.global_stock_inventory_levels
     where business_id=target_business_id and location_id=target_location_id
       and (on_hand<>0 or reserved<>0)
  ) then raise exception 'LOCATION_HAS_STOCK_OR_RESERVATIONS'; end if;
  update public.global_stock_locations set active=false,updated_at=now()
   where id=target_location_id and business_id=target_business_id;
  return true;
end $$;
revoke all on function public.global_stock_archive_location(uuid,uuid) from public,anon;
grant execute on function public.global_stock_archive_location(uuid,uuid) to authenticated;

-- Requests contain public store metadata only, not OAuth secrets.
create or replace function public.global_stock_manage_integration_request(
 target_business_id uuid, target_request_id uuid, action text,
 new_display_name text default null, new_store_url text default null
) returns boolean language plpgsql security definer
set search_path=pg_catalog, public
as $$
declare
  v_req record;
  v_url text;
  v_name text;
begin
  if auth.uid() is null or public.global_stock_member_role(target_business_id)
    not in ('owner','admin') then
    raise exception 'NOT_AUTHORIZED' using errcode='42501';
  end if;
  select * into v_req from public.global_stock_integration_requests
    where id=target_request_id and business_id=target_business_id for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  if v_req.status<>'requested' then
    raise exception 'ONLY_PENDING_REQUESTS_CAN_BE_CHANGED';
  end if;
  if action='delete' then
    delete from public.global_stock_integration_requests
      where id=target_request_id and business_id=target_business_id;
    return true;
  elsif action='edit' then
    v_name=trim(coalesce(new_display_name,''));
    v_url=nullif(trim(coalesce(new_store_url,'')),'');
    if length(v_name)<2 or length(v_name)>120 then
      raise exception 'INVALID_DISPLAY_NAME';
    end if;
    if v_url is not null and (
      length(v_url)>500 or v_url !~* '^https://[a-z0-9.-]+(/[^[:space:]]*)?$'
      or v_url ~* 'https://(localhost|127\\.|10\\.|192\\.168\\.|169\\.254\\.|172\\.)'
      or v_url like '%@%' or v_url like '%#%'
    ) then raise exception 'INVALID_STORE_URL'; end if;
    if v_url is null and v_req.provider in ('custom','other') then
      raise exception 'STORE_URL_REQUIRED';
    end if;
    update public.global_stock_integration_requests
      set display_name=v_name,store_url=v_url,updated_at=now()
      where id=target_request_id and business_id=target_business_id;
    return true;
  end if;
  raise exception 'INVALID_ACTION';
end $$;
revoke all on function public.global_stock_manage_integration_request(uuid,uuid,text,text,text) from public,anon;
grant execute on function public.global_stock_manage_integration_request(uuid,uuid,text,text,text) to authenticated;
