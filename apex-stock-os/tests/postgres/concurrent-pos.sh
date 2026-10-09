#!/usr/bin/env bash
# Run ONLY against the disposable PostgreSQL CI database configured by workflow.
set -euo pipefail

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

business_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
actor='11111111-1111-4111-8111-111111111111'

# Set up two independent synthetic catalog items.
psql -X -v ON_ERROR_STOP=1 -q <<SQL
insert into public.global_stock_products
 (business_id,client_key,name,price,cost,stock) values
 ('$business_id','race-retry','Simultaneous retry',100,40,2),
 ('$business_id','race-compete','Concurrent oversell',100,40,10);
SQL

sale() {
  local operation="$1" sku="$2" qty="$3" total="$4"
  psql -X -qAt -v ON_ERROR_STOP=1 <<SQL
set request.jwt.claim.sub = '$actor';
select public.global_stock_record_pos_sale(
  '$business_id','$operation','ARS',0,0,null,
  '[{"productKey":"$sku","quantity":$qty}]'::jsonb,
  '[{"method":"cash","amount":$total}]'::jsonb,
  $total
);
SQL
}

# Two sessions may read the same inventory at almost exactly the same moment.
# They MUST return the same persisted ID on same-operation retry, with one deduction.
sale "race-retry-001" "race-retry" 2 200 > "$tmp/retry1" 2>"$tmp/retry1.err" &
pid1=$!
sale "race-retry-001" "race-retry" 2 200 > "$tmp/retry2" 2>"$tmp/retry2.err" &
pid2=$!
set +e
wait "$pid1"; status1=$?
wait "$pid2"; status2=$?
set -e
if (( status1 != 0 || status2 != 0 )); then
  cat "$tmp/retry1.err" "$tmp/retry2.err" >&2
  echo "FAIL: concurrent same-operation retries must both return a sale" >&2
  exit 1
fi
id1="$(tr -d '[:space:]' < "$tmp/retry1")"
id2="$(tr -d '[:space:]' < "$tmp/retry2")"
if [[ ! "$id1" =~ ^[0-9a-f-]{36}$ || "$id1" != "$id2" ]]; then
  echo "FAIL: two retry results disagree ($id1 vs $id2)" >&2
  exit 1
fi

check="$(psql -X -qAt -v ON_ERROR_STOP=1 -c "
select count(*)::text||':'||min(stock)::text||':'||
(select count(*) from public.global_stock_cash_movements where reference_id='$id1')
from public.global_stock_products where client_key='race-retry';")"
[[ "$check" == "1:0:1" ]] || { echo "FAIL: retry inventory/cash: $check"; exit 1; }
echo "PASS 11/12: parallel replay returns same ID, one stock deduction and one cash entry"

# Two different operations both attempting to sell seven units from ten:
# only one can win. The other must fail with insufficient stock.
sale "race-compete-001" "race-compete" 7 700 > "$tmp/compete1" 2> "$tmp/compete1.err" &
pid1=$!
sale "race-compete-002" "race-compete" 7 700 > "$tmp/compete2" 2> "$tmp/compete2.err" &
pid2=$!
set +e
wait "$pid1"; status1=$?
wait "$pid2"; status2=$?
set -e
if ! { (( status1 == 0 && status2 != 0 )) || (( status1 != 0 && status2 == 0 )); }; then
  cat "$tmp/compete1.err" "$tmp/compete2.err" >&2
  echo "FAIL: expected exactly one successful competing sale ($status1/$status2)" >&2
  exit 1
fi
if (( status1 != 0 )); then
  grep -q 'insufficient stock' "$tmp/compete1.err" || { cat "$tmp/compete1.err"; exit 1; }
else
  grep -q 'insufficient stock' "$tmp/compete2.err" || { cat "$tmp/compete2.err"; exit 1; }
fi

final="$(psql -X -qAt -v ON_ERROR_STOP=1 -c "
select (select count(*) from public.global_stock_sales where external_id like 'client:race-compete%')::text
||':'||(select stock from public.global_stock_products where client_key='race-compete')::text
||':'||(select coalesce(sum(quantity),0) from public.global_stock_stock_movements where product_key='race-compete')::text;")"
[[ "$final" == "1:3:-7" ]] || { echo "FAIL: competing sale invariants: $final"; exit 1; }
echo "PASS 12/12: different simultaneous operations cannot oversell the same inventory"
