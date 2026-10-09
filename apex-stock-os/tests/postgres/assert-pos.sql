-- Run against an EPHEMERAL database only. Never connect this script to production.
-- These tests call snapshots of the same PostgreSQL functions deployed to Global Stock.
\set ON_ERROR_STOP on

insert into public.global_stock_members (business_id, user_id, role)
 values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111','owner');
insert into public.global_stock_locations (id,business_id,name,kind)
 values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
         'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Depósito de pruebas','store');
insert into public.global_stock_products
 (id,business_id,client_key,name,price,cost,stock)
 values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',
         'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
         'demo-sku-01','Artículo ficticio',100,40,10);
insert into public.global_stock_cash_sessions
 (id,business_id,location_id,status)
 values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd',
         'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
         'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','open');

set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

do $test$
declare
  business_id constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  sale_id uuid;
  same_sale_id uuid;
  sale_item_id uuid;
  return_id uuid;
  original_quantity numeric;
  strict_sale_status text;
  value numeric;
  operation_count integer;
begin
  -- 1: Customer/browser totals are untrusted; price and cost must be server-derived.
  sale_id := public.global_stock_record_pos_sale(
    business_id, 'e2e-sale-local-001', 'ARS',
    1, 9999, null,
    '[{"productKey":"demo-sku-01","quantity":3,"unitPrice":1,"unitCost":0}]'::jsonb,
    '[{"method":"cash","amount":300}]'::jsonb,
    300
  );
  if sale_id is null then raise exception 'TEST 1: sale id missing'; end if;
  select total, cost_total into value, original_quantity
    from public.global_stock_sales where global_stock_sales.id=sale_id;
  if value <> 300 or original_quantity <> 120 then
    raise exception 'TEST 1: expected server sale total 300/cost 120, got %/%',
      value, original_quantity;
  end if;
  raise notice 'PASS 1/8: sale uses trusted database price/cost (gross 300, cost 120, profit 180)';

  -- 2: Inventory total, location stock, cash and audit should be committed once.
  select stock into value from public.global_stock_products where client_key='demo-sku-01';
  if value <> 7 then raise exception 'TEST 2: expected product stock 7; got %',value; end if;
  select on_hand into value from public.global_stock_inventory_levels
    where global_stock_inventory_levels.business_id=business_id and product_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  if value <> 7 then raise exception 'TEST 2: expected location stock 7; got %', value; end if;
  select coalesce(sum(amount),0) into value
    from public.global_stock_cash_movements where kind='sale';
  if value <> 300 then raise exception 'TEST 2: cash expected 300; got %',value; end if;
  select count(*) into operation_count from public.global_stock_audit_events
    where action='sale.completed';
  if operation_count <> 1 then raise exception 'TEST 2: expected one audit row'; end if;
  raise notice 'PASS 2/8: product 10 to 7, location 7, cash +300 and audit recorded';

  -- 3: Replayed operation_id must not duplicate cash/stock/record.
  same_sale_id := public.global_stock_record_pos_sale(
    business_id, 'e2e-sale-local-001', 'ARS',
    300, 120, null,
    '[{"productKey":"demo-sku-01","quantity":3}]'::jsonb,
    '[{"method":"cash","amount":300}]'::jsonb, 300
  );
  if same_sale_id <> sale_id then raise exception 'TEST 3: retry returned a different sale'; end if;
  select count(*) into operation_count from public.global_stock_sales;
  if operation_count <> 1 then raise exception 'TEST 3: duplicated sale'; end if;
  select count(*) into operation_count from public.global_stock_stock_movements
    where kind='sale';
  if operation_count <> 1 then raise exception 'TEST 3: duplicated stock movement'; end if;
  select count(*) into operation_count from public.global_stock_cash_movements
    where kind='sale';
  if operation_count <> 1 then raise exception 'TEST 3: duplicated cash movement'; end if;
  raise notice 'PASS 3/8: same operation ID does not register second sale';

  -- 4: Reject overselling without affecting existing ledger/stock.
  begin
    perform public.global_stock_record_pos_sale(
      business_id,'e2e-oversell-local-002','ARS',800,320,null,
      '[{"productKey":"demo-sku-01","quantity":8}]'::jsonb,
      '[{"method":"cash","amount":800}]'::jsonb,800
    );
    raise exception 'TEST 4: oversell was incorrectly accepted';
  exception
    when others then
      if sqlerrm = 'TEST 4: oversell was incorrectly accepted' then raise; end if;
      if sqlerrm not like '%insufficient stock%' then
        raise exception 'TEST 4: unexpected rejection: %',sqlerrm;
      end if;
  end;
  select count(*) into operation_count from public.global_stock_sales;
  if operation_count <> 1 then raise exception 'TEST 4: oversell created a sale'; end if;
  raise notice 'PASS 4/8: oversell prevented atomically';

  -- 5: Refund of 2 of 3 items restores 2 units and pays back 200 cash.
  select id into sale_item_id from public.global_stock_sale_items
    where global_stock_sale_items.sale_id=sale_id limit 1;
  return_id := public.global_stock_return_sale_item(
    business_id,sale_item_id,2,'Test de devolución',true,'cash'
  );
  if return_id is null then raise exception 'TEST 5: refund id missing'; end if;
  select stock into value from public.global_stock_products where client_key='demo-sku-01';
  if value <> 9 then raise exception 'TEST 5: stock after refund must be 9; got %',value; end if;
  select status into strict_sale_status from public.global_stock_sales where id=sale_id;
  if strict_sale_status <> 'partially_refunded' then
    raise exception 'TEST 5: wrong status %',strict_sale_status;
  end if;
  raise notice 'PASS 5/8: 2-unit refund restores 2 and marks partial refund';

  -- 6: Reject more than the remaining 1 unit.
  begin
    perform public.global_stock_return_sale_item(
      business_id,sale_item_id,2,'Duplicated refund test',true,'cash'
    );
    raise exception 'TEST 6: over-refund was accepted';
  exception when others then
    if sqlerrm = 'TEST 6: over-refund was accepted' then raise; end if;
    if sqlerrm not like '%return quantity exceeds%' then
      raise exception 'TEST 6: unexpected rejection: %',sqlerrm;
    end if;
  end;
  raise notice 'PASS 6/8: cannot refund more than remaining quantity';

  -- 7: Final refund restores all inventory and offsets cash, status refunded.
  perform public.global_stock_return_sale_item(
    business_id,sale_item_id,1,'Final refund',true,'cash'
  );
  select stock into value from public.global_stock_products where client_key='demo-sku-01';
  if value <> 10 then raise exception 'TEST 7: stock after final refund should be 10'; end if;
  select coalesce(sum(case when kind='sale' then amount when kind='refund' then -amount else 0 end),0)
    into value from public.global_stock_cash_movements;
  if value <> 0 then raise exception 'TEST 7: cash net expected 0, got %',value; end if;
  raise notice 'PASS 7/8: final refund restores stock 10 and cash net 0';

  -- 8: Another user's requests must be denied.
  perform set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
  begin
    perform public.global_stock_record_pos_sale(
      business_id,'e2e-unauthorized-003','ARS',100,40,null,
      '[{"productKey":"demo-sku-01","quantity":1}]'::jsonb,
      '[{"method":"cash","amount":100}]'::jsonb,100
    );
    raise exception 'TEST 8: unauthorized user placed a sale';
  exception when others then
    if sqlerrm='TEST 8: unauthorized user placed a sale' then raise; end if;
    if sqlerrm not like '%not authorized%' then
      raise exception 'TEST 8: unexpected error: %',sqlerrm;
    end if;
  end;
  raise notice 'PASS 8/8: non-member cannot record a sale';
end;
$test$;

select 'Isolated PostgreSQL POS smoke: 8 validations passed' as result;
