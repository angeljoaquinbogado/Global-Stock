-- Keep location safety rules even when administrators update the table directly.
create or replace function public.global_stock_guard_branch_archive()
returns trigger language plpgsql security definer
set search_path=pg_catalog, public as $$
begin
 if old.active and not new.active then
   perform pg_advisory_xact_lock(hashtext('gs-locations-'||old.business_id::text));
   if (select count(*) from public.global_stock_locations
        where business_id=old.business_id and active) <= 1 then
     raise exception 'CANNOT_ARCHIVE_LAST_LOCATION';
   end if;
   if exists (select 1 from public.global_stock_inventory_levels
       where business_id=old.business_id and location_id=old.id
         and (on_hand<>0 or reserved<>0)) then
     raise exception 'LOCATION_HAS_STOCK_OR_RESERVATIONS';
   end if;
 end if;
 return new;
end $$;
drop trigger if exists global_stock_locations_archive_guard on public.global_stock_locations;
create trigger global_stock_locations_archive_guard
before update of active on public.global_stock_locations
for each row execute function public.global_stock_guard_branch_archive();
