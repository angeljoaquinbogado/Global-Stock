-- 2026-10-09: wrap the JWT function itself in an uncorrelated SELECT
-- so Postgres caches the claim once per statement while preserving row checks.
ALTER POLICY "gs_member_invites_invitee_read"
ON public.global_stock_member_invites
USING (lower(email) = lower(COALESCE(((SELECT auth.jwt()) ->> 'email'), '')));
