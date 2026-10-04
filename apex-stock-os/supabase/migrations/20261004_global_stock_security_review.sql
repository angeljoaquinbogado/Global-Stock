-- Global Stock security/performance follow-up
-- 2026-10-04
--
-- 1. Trigger helpers do not need direct RPC execution from browser roles.
-- 2. Cache auth.uid() once per statement in hot profile/business RLS policies.

revoke execute on function public.global_stock_touch_updated_at()
  from public, anon, authenticated;
revoke execute on function public.global_stock_touch_fiscal_updated_at()
  from public, anon, authenticated;
revoke execute on function public.global_stock_protect_authorized_fiscal_document()
  from public, anon, authenticated;

drop policy if exists global_stock_profiles_select_own
  on public.global_stock_profiles;
create policy global_stock_profiles_select_own
  on public.global_stock_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists global_stock_profiles_insert_own
  on public.global_stock_profiles;
create policy global_stock_profiles_insert_own
  on public.global_stock_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists global_stock_profiles_update_own
  on public.global_stock_profiles;
create policy global_stock_profiles_update_own
  on public.global_stock_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists gs_businesses_read
  on public.global_stock_businesses;
create policy gs_businesses_read
  on public.global_stock_businesses
  for select
  to authenticated
  using (
    owner_user_id = (select auth.uid())
    or public.global_stock_is_member(id)
  );

drop policy if exists gs_businesses_insert
  on public.global_stock_businesses;
create policy gs_businesses_insert
  on public.global_stock_businesses
  for insert
  to authenticated
  with check (owner_user_id = (select auth.uid()));

drop policy if exists gs_businesses_update
  on public.global_stock_businesses;
create policy gs_businesses_update
  on public.global_stock_businesses
  for update
  to authenticated
  using (
    owner_user_id = (select auth.uid())
    or public.global_stock_is_admin(id)
  )
  with check (
    owner_user_id = (select auth.uid())
    or public.global_stock_is_admin(id)
  );
