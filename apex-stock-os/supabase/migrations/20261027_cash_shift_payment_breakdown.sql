-- Add a per-payment-method breakdown to cash shift snapshots without changing
-- the physical-cash reconciliation formula.
begin;
create or replace function public.global_stock_cash_shift_snapshot(
  target_business_id uuid,
  target_session_id uuid
) returns jsonb
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare
  shift_row public.global_stock_cash_sessions%rowtype;
  cash_sales numeric := 0;
  other_sales numeric := 0;
  other_sales_count integer := 0;
  method_breakdown jsonb := '{}'::jsonb;
  income_total numeric := 0;
  outgoing_total numeric := 0;
  expected_total numeric := 0;
begin
  if auth.uid() is null or not public.global_stock_is_member(target_business_id) then
    raise exception 'No autorizado para ver la caja';
  end if;
  select * into shift_row from public.global_stock_cash_sessions
  where id=target_session_id and business_id=target_business_id;
  if not found then raise exception 'Turno no encontrado'; end if;

  select coalesce(sum(case when p.method='cash' then p.amount else 0 end),0),
         coalesce(sum(case when p.method<>'cash' then p.amount else 0 end),0),
         count(distinct s.id)::integer
  into cash_sales,other_sales,other_sales_count
  from public.global_stock_sales s
  join public.global_stock_payments p on p.sale_id=s.id and p.business_id=s.business_id
  where s.business_id=target_business_id
    and s.channel='pos' and s.status='completed'
    and s.location_id is not distinct from shift_row.location_id
    and s.created_at>=shift_row.opened_at
    and (shift_row.closed_at is null or s.created_at<=shift_row.closed_at);

  select coalesce(jsonb_object_agg(method,amount),'{}'::jsonb)
  into method_breakdown
  from (
    select p.method,coalesce(sum(p.amount),0) as amount
    from public.global_stock_sales s
    join public.global_stock_payments p on p.sale_id=s.id and p.business_id=s.business_id
    where s.business_id=target_business_id
      and s.channel='pos' and s.status='completed'
      and s.location_id is not distinct from shift_row.location_id
      and s.created_at>=shift_row.opened_at
      and (shift_row.closed_at is null or s.created_at<=shift_row.closed_at)
    group by p.method
  ) method_totals;

  select coalesce(sum(case when m.kind in ('income','deposit') then m.amount else 0 end),0),
         coalesce(sum(case when m.kind in ('expense','withdrawal','refund') then m.amount else 0 end),0)
  into income_total,outgoing_total
  from public.global_stock_cash_movements m
  where m.business_id=target_business_id and m.cash_session_id=target_session_id
    and (shift_row.closed_at is null or m.created_at<=shift_row.closed_at);

  expected_total := shift_row.opening_amount+cash_sales+income_total-outgoing_total;
  return jsonb_build_object(
    'opening',shift_row.opening_amount,'cash_sales',cash_sales,
    'other_sales',other_sales,'sales_count',other_sales_count,
    'sales_by_method',method_breakdown,
    'incomes',income_total,'outgoings',outgoing_total,
    'expected',expected_total,'closed',shift_row.closed_at is not null
  );
end;
$$;
commit;
