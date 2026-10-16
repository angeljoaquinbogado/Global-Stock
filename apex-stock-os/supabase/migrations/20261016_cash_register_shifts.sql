-- Cash register shift operations, isolated by business and location.
-- Derived cash receipts come only from confirmed POS payments: no manual sale duplication.
create unique index if not exists gs_cash_one_open_shift_per_location
  on public.global_stock_cash_sessions (business_id, (coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid)))
  where status = 'open';

create unique index if not exists gs_cash_movement_idempotency
  on public.global_stock_cash_movements (cash_session_id, reference_id)
  where cash_session_id is not null and reference_id is not null;

create or replace function public.global_stock_open_cash_shift(
  target_business_id uuid,
  target_location_id uuid,
  opening_cash numeric
) returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  shift_id uuid;
begin
  if auth.uid() is null or not public.global_stock_can_write(target_business_id, 'cash') then
    raise exception 'No autorizado para administrar caja';
  end if;
  if opening_cash is null or opening_cash < 0 or opening_cash > 100000000000
    or opening_cash::text in ('NaN','Infinity','-Infinity')
    or opening_cash <> round(opening_cash,2) then
    raise exception 'Importe inicial inválido';
  end if;
  if target_location_id is not null and not exists (
    select 1 from public.global_stock_locations
    where id=target_location_id and business_id=target_business_id and active=true
  ) then
    raise exception 'Sucursal inválida';
  end if;

  perform pg_advisory_xact_lock(hashtext(target_business_id::text),hashtext(coalesce(target_location_id::text,'general')));
  if exists (
    select 1 from public.global_stock_cash_sessions
    where business_id=target_business_id and location_id is not distinct from target_location_id and status='open'
  ) then
    raise exception 'Ya hay un turno de caja abierto en esta ubicación';
  end if;
  insert into public.global_stock_cash_sessions
    (business_id,location_id,user_id,opening_amount,status,opened_at)
  values (target_business_id,target_location_id,auth.uid(),opening_cash,'open',clock_timestamp())
  returning id into shift_id;
  return shift_id;
end;
$$;

create or replace function public.global_stock_record_cash_adjustment(
  target_business_id uuid,
  target_session_id uuid,
  client_operation_id text,
  movement_kind text,
  movement_amount numeric,
  movement_description text
) returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  current_session public.global_stock_cash_sessions%rowtype;
  existing_id uuid;
  created_id uuid;
begin
  if auth.uid() is null or not public.global_stock_can_write(target_business_id,'cash') then
    raise exception 'No autorizado para administrar caja';
  end if;
  if client_operation_id is null or length(client_operation_id)<8 or length(client_operation_id)>160 then
    raise exception 'Identificador de movimiento inválido';
  end if;
  if movement_kind not in ('income','deposit','expense','withdrawal') then
    raise exception 'Tipo de movimiento inválido';
  end if;
  if movement_amount is null or movement_amount<=0 or movement_amount>100000000000
    or movement_amount::text in ('NaN','Infinity','-Infinity')
    or movement_amount<>round(movement_amount,2) then
    raise exception 'Importe de movimiento inválido';
  end if;
  if length(trim(coalesce(movement_description,'')))<3 or length(movement_description)>240 then
    raise exception 'Ingresá un motivo de 3 a 240 caracteres';
  end if;

  select * into current_session
  from public.global_stock_cash_sessions
  where id=target_session_id and business_id=target_business_id
  for update;
  if not found then raise exception 'Turno de caja no encontrado'; end if;

  select id into existing_id
  from public.global_stock_cash_movements
  where business_id=target_business_id and cash_session_id=target_session_id
    and reference_id=client_operation_id;
  if existing_id is not null then return existing_id; end if;

  if current_session.status <> 'open' then
    raise exception 'La caja ya está cerrada';
  end if;

  insert into public.global_stock_cash_movements
    (business_id,cash_session_id,user_id,kind,amount,description,payment_method,reference_id)
  values (target_business_id,target_session_id,auth.uid(),movement_kind,movement_amount,
          trim(movement_description),'cash',client_operation_id)
  returning id into created_id;
  return created_id;
end;
$$;

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
    'incomes',income_total,'outgoings',outgoing_total,
    'expected',expected_total,'closed',shift_row.closed_at is not null
  );
end;
$$;

create or replace function public.global_stock_close_cash_shift(
  target_business_id uuid,
  target_session_id uuid,
  counted_cash numeric,
  closing_notes text default null
) returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  shift_row public.global_stock_cash_sessions%rowtype;
  totals jsonb;
  expected_total numeric;
  now_value timestamptz := clock_timestamp();
begin
  if auth.uid() is null or not public.global_stock_can_write(target_business_id,'cash') then
    raise exception 'No autorizado para cerrar caja';
  end if;
  if counted_cash is null or counted_cash<0 or counted_cash>100000000000
    or counted_cash::text in ('NaN','Infinity','-Infinity')
    or counted_cash<>round(counted_cash,2) then
    raise exception 'Importe contado inválido';
  end if;
  if length(coalesce(closing_notes,''))>600 then
    raise exception 'La nota es demasiado extensa';
  end if;

  select * into shift_row from public.global_stock_cash_sessions
  where id=target_session_id and business_id=target_business_id
  for update;
  if not found then raise exception 'Turno no encontrado'; end if;
  if shift_row.status='closed' then raise exception 'El turno ya fue cerrado'; end if;

  -- Prevent a later sale from being counted by this reconciliation.
  update public.global_stock_cash_sessions
    set closed_at=now_value
    where id=target_session_id;
  totals := public.global_stock_cash_shift_snapshot(target_business_id,target_session_id);
  expected_total := (totals->>'expected')::numeric;

  update public.global_stock_cash_sessions
  set closing_amount=counted_cash,expected_amount=expected_total,
      difference=counted_cash-expected_total,status='closed',
      notes=nullif(trim(coalesce(closing_notes,'')),'')
  where id=target_session_id;

  return jsonb_build_object('expected',expected_total,'counted',counted_cash,
                            'difference',counted_cash-expected_total);
end;
$$;

revoke all on function public.global_stock_open_cash_shift(uuid,uuid,numeric) from public,anon;
revoke all on function public.global_stock_record_cash_adjustment(uuid,uuid,text,text,numeric,text) from public,anon;
revoke all on function public.global_stock_cash_shift_snapshot(uuid,uuid) from public,anon;
revoke all on function public.global_stock_close_cash_shift(uuid,uuid,numeric,text) from public,anon;
grant execute on function public.global_stock_open_cash_shift(uuid,uuid,numeric) to authenticated;
grant execute on function public.global_stock_record_cash_adjustment(uuid,uuid,text,text,numeric,text) to authenticated;
grant execute on function public.global_stock_cash_shift_snapshot(uuid,uuid) to authenticated;
grant execute on function public.global_stock_close_cash_shift(uuid,uuid,numeric,text) to authenticated;
