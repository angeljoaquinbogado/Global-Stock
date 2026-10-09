# Global Stock — Step 2: free POS test database

The workflow [Global Stock Local POS QA](../../../.github/workflows/global-stock-pos-local-qa.yml) creates an **ephemeral PostgreSQL 17 service on GitHub Actions**. It requires **no paid Supabase branch**, personal computer, customer accounts, or production credentials.

## What it tests

1. A fake product with 10 units, selling 3, yields 7 units in both product stock and location inventory.
2. The server determines ARS 300 sale value and ARS 120 cost, ignoring client-forged totals.
3. The cash movement and audit entry occur once.
4. A replay with the same operation ID does not duplicate the sale, stock movement or cash entry.
5. Overselling available inventory is blocked.
6. A partial return restocks 2 units; an excessive return is rejected.
7. A final return restores all stock and offsets cash.
8. A non-member cannot perform a sale through the authorized RPC.

The suite runs real PL/pgSQL functions and triggers taken from the deployed Global Stock database via read-only `pg_get_functiondef`, using synthetic tables/data in a throwaway database.

**Important limitations:** the test schema is a minimal fixture, not a full Supabase restore. It does not replicate every RLS policy, Auth service, production trigger (such as loyalty), recipe/variant/split-payment edge case, or race between truly concurrent requests. It also does not test the actual browser POS UI, reconnection behavior or ecommerce webhook end-to-end.

## Known issue found on unchanged deployed code

The deployed `global_stock_record_pos_sale_legacy_unsafe` function has a PL/pgSQL naming collision at `ON CONFLICT (business_id, operation_id)`. The unchanged deployed function failed in the disposable PG 17 database with `column reference "operation_id" is ambiguous`.

For now, only the **test snapshot** `live-sale-commit.sql` includes the line `#variable_conflict use_column`, allowing subsequent regression tests to run. **Production was updated on 2026-10-09** using Supabase migration `20261009023128_global_stock_pos_replay_and_duplicate_safety_20261009`. The prior definitions and grants were saved at `../../docs/backups/20261009-global-stock-pos-rpcs-before-hardening.sql`. The production permission and definition checks passed. No sales, stock movements or cash movements were created. The migration proposal is stored in `../../docs/proposed-pos-operation-id-production-fix.sql`; do not execute until authorized and backed up.

## Local CLI (optional for maintainers)

You do not need to run anything locally to use CI. If testing manually with Docker:

```bash
docker run --rm -d --name global-stock-pos-qa -e POSTGRES_PASSWORD=test-only -e POSTGRES_DB=global_stock_test -p 55432:5432 postgres:17
# Wait until: docker exec global-stock-pos-qa pg_isready -U postgres -d global_stock_test
for f in fixture-schema.sql live-helpers.sql live-sale-commit.sql live-sale-rpcs.sql assert-pos.sql; do
  docker exec -i global-stock-pos-qa psql -U postgres -d global_stock_test -v ON_ERROR_STOP=1 < "$f" || break
done
docker stop global-stock-pos-qa
```

Use these commands from this directory; they **only** target the disposable local Docker database. Do not point the fixture scripts at a production connection.

## Next step

Concurrent purchases, simultaneous replay requests, duplicate sale lines and recovery after a lost response were verified by the 12-check isolated test suite. Next extend coverage to recipe aggregation, variants, mixed payments and authenticated browser E2E before a broader POS launch. Separately exercise real logged-in flows against an authorized staging environment.
