-- Global Stock security hardening based on the Strix/OWASP review.
-- Applied to production Supabase on 2026-10-04.

begin;

revoke create on schema public from public, anon, authenticated;

drop policy if exists gs_member_access_global_stock_locations
  on public.global_stock_locations;
drop policy if exists gs_locations_read
  on public.global_stock_locations;
drop policy if exists gs_locations_write
  on public.global_stock_locations;

create policy gs_locations_read
on public.global_stock_locations
for select
to authenticated
using (
  (select auth.uid()) is not null
  and public.global_stock_is_member(business_id)
);

create policy gs_locations_write
on public.global_stock_locations
for all
to authenticated
using (
  public.global_stock_member_role(business_id)
    in ('owner','admin','manager','warehouse')
)
with check (
  public.global_stock_member_role(business_id)
    in ('owner','admin','manager','warehouse')
);

drop policy if exists gs_member_access_global_stock_payment_terminals
  on public.global_stock_payment_terminals;
drop policy if exists gs_payment_terminals_read
  on public.global_stock_payment_terminals;
drop policy if exists gs_payment_terminals_write
  on public.global_stock_payment_terminals;

create policy gs_payment_terminals_read
on public.global_stock_payment_terminals
for select
to authenticated
using (
  (select auth.uid()) is not null
  and public.global_stock_is_member(business_id)
);

create policy gs_payment_terminals_write
on public.global_stock_payment_terminals
for all
to authenticated
using (
  public.global_stock_member_role(business_id)
    in ('owner','admin','manager')
)
with check (
  public.global_stock_member_role(business_id)
    in ('owner','admin','manager')
);

drop policy if exists gs_member_access_global_stock_price_lists
  on public.global_stock_price_lists;
drop policy if exists gs_price_lists_read
  on public.global_stock_price_lists;
drop policy if exists gs_price_lists_write
  on public.global_stock_price_lists;

create policy gs_price_lists_read
on public.global_stock_price_lists
for select
to authenticated
using (
  (select auth.uid()) is not null
  and public.global_stock_is_member(business_id)
);

create policy gs_price_lists_write
on public.global_stock_price_lists
for all
to authenticated
using (
  public.global_stock_member_role(business_id)
    in ('owner','admin','manager','sales')
)
with check (
  public.global_stock_member_role(business_id)
    in ('owner','admin','manager','sales')
);

drop policy if exists gs_audit_insert
  on public.global_stock_audit_events;

create policy gs_audit_insert
on public.global_stock_audit_events
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and public.global_stock_is_member(business_id)
);

drop policy if exists gs_authorization_challenges_no_client_access
  on public.global_stock_authorization_challenges;
create policy gs_authorization_challenges_no_client_access
on public.global_stock_authorization_challenges
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists gs_authorization_grants_no_client_access
  on public.global_stock_authorization_grants;
create policy gs_authorization_grants_no_client_access
on public.global_stock_authorization_grants
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists gs_integrations_no_client_access
  on public.global_stock_integrations;
create policy gs_integrations_no_client_access
on public.global_stock_integrations
for all
to anon, authenticated
using (false)
with check (false);

revoke execute on function public.global_stock_accept_pending_invites() from public, anon;
revoke execute on function public.global_stock_apply_payable_payment(uuid, uuid, numeric) from public, anon;
revoke execute on function public.global_stock_apply_stock_count(uuid, uuid, text, numeric, numeric, text) from public, anon;
revoke execute on function public.global_stock_can_write(uuid, text) from public, anon;
revoke execute on function public.global_stock_disconnect_integration(uuid, text) from public, anon;
revoke execute on function public.global_stock_execute_transfer(uuid, uuid, uuid, text, numeric, text) from public, anon;
revoke execute on function public.global_stock_is_admin(uuid) from public, anon;
revoke execute on function public.global_stock_is_member(uuid) from public, anon;
revoke execute on function public.global_stock_member_role(uuid) from public, anon;
revoke execute on function public.global_stock_post_customer_ledger(uuid, uuid, text, numeric, text, text) from public, anon;
revoke execute on function public.global_stock_record_pos_sale(uuid, text, text, numeric, numeric, uuid, jsonb, jsonb, numeric) from public, anon;
revoke execute on function public.global_stock_record_stock_adjustment(uuid, text, text, numeric, numeric, text) from public, anon;
revoke execute on function public.global_stock_return_sale_item(uuid, uuid, numeric, text, boolean, text) from public, anon;
revoke execute on function public.global_stock_seed_inventory_levels(uuid) from public, anon;
revoke execute on function public.global_stock_set_variant_stock(uuid, uuid, numeric, uuid) from public, anon;

commit;
