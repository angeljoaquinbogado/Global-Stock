# Global Stock — Security and mobile release review (2026-10-11)

## Scope and evidence
Read-only audit of public Supabase metadata, Security Advisors, selected privileged function definitions and the current mobile/web source. No penetration test, unauthorized user impersonation, native iOS simulator or account data export was performed. These results are not a guarantee against every attack.

## P1 release blocker: iPhone blank after sign-out
**Observed:** user's iPhone screenshots show a light screen with only the page background after sign-out, rather than the authentication page.
**Likely layer:** React Native iOS presentation lifecycle; the earlier implementation used native Modals for the menu, account picker and assistant, plus a native confirmation Alert. These are now rendered and confirmed inside the authenticated React view. When the session changes, all overlays unmount along with the workspace.
**Verification required:** sign in → sign out through Settings → welcome visible → sign in again; repeat through the menu, theme light and dark, and with Global Intelligence open. Also test canceling sign-out and confirm that pending offline drafts are explicitly deleted only after confirmation. Treat as NOT READY until these tests pass on an actual iPhone.

## Authorization and exposure checks
- All reviewed `public.global_stock_*` tables have RLS enabled. This checks presence, not correctness of every policy. Two separate test users/businesses are still needed for cross-tenant negative tests.
- All 27 inspected `global_stock_*` SECURITY DEFINER routines reported `anon_execute = false`.
- Security Advisors flagged **16** SECURITY DEFINER functions callable by `authenticated`. The reviewed stock count, POS sale, membership and account deletion routines include checks based on `auth.uid()` and/or business permissions. All 16 must be reviewed before expanding production permissions; authenticated does not inherently mean authorized for every business.
- The mobile configuration endpoint restricts its response to a verified Supabase origin and a public publishable/anon key; it must never expose service-role or Gemini credentials.
- The Global Intelligence API checks server-side authentication and business membership and requires per-business AI consent in its mobile flow.
- The mobile app uses Expo SecureStore for auth tokens; offline merchant snapshots are stored in SQLite and should be treated as plaintext on the device. Verified logout purges the signed-in user's local snapshots and unsynced drafts after explicit consent. **Device-level data-at-rest encryption for all offline business data is not established.**

## Supabase Security Advisor notices (read 2026-10-11)
1. **WARN:** Auth leaked-password protection not enabled. Enable in Supabase Auth settings if supported by the project plan. Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
2. **WARN:** 16 user-executable SECURITY DEFINER functions; review every function's authorization and grant scope. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
3. **INFO:** `api_rate_limits` has RLS enabled and no policies. This may be intentional for a service-only rate limiting table; verify access by the service. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

Do not indiscriminately grant EXECUTE on privileged functions or bypass RLS to silence warnings.

## Release test gates
1. iOS Expo Go authenticated lifecycle including sign-out, cancel, relogin and fresh install (P1).
2. Test cross-tenant reads and mutations using two accounts with independent businesses (P1).
3. Test account deletion, explicit confirmation, and removal of local SQLite data (P1 privacy).
4. Verify assistant remains scoped to the selected business and respects consent revocation (P1).
5. Review public server secrets, dependency audit, rate limits, error surfaces and all 16 definer permissions (P1/P2).
6. Repeat responsive web Playwright and native keyboard/camera tests separately; browser Playwright does **not** validate Expo Go runtime behavior.
7. Enable leaked-password protection and manually review recovery, MFA and email verification policies (P2).

**Verdict:** NOT READY for unrestricted public beta until P1 verification passes. The iOS code correction is committed but has not been verified on a physical iPhone.
