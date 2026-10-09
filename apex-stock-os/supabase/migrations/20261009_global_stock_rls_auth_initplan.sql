-- Global Stock · 2026-10-09
-- Preserve existing SELECT permissions while evaluating the authenticated
-- identity once per statement instead of once per inspected table row.
-- No tables, users, or business records are modified.
ALTER POLICY "Admin can read own admin row"
ON public.admin_users
USING (user_id = (SELECT auth.uid()));

ALTER POLICY "gs_member_invites_invitee_read"
ON public.global_stock_member_invites
USING (lower(email) = lower(COALESCE((SELECT auth.jwt() ->> 'email'), '')));
