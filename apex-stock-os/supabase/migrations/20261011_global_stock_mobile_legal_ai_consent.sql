-- Versioned, auditable acceptance: mobile onboarding for adult operators.
-- Self-declared age is NOT identity verification or full jurisdictional compliance.
CREATE TABLE IF NOT EXISTS public.global_stock_legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version text NOT NULL CHECK (length(terms_version) BETWEEN 4 AND 60),
  privacy_version text NOT NULL CHECK (length(privacy_version) BETWEEN 4 AND 60),
  adult_18_attested boolean NOT NULL CHECK (adult_18_attested = true),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, terms_version, privacy_version)
);
ALTER TABLE public.global_stock_legal_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY global_stock_legal_acceptances_read_own
ON public.global_stock_legal_acceptances FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));
CREATE POLICY global_stock_legal_acceptances_insert_own
ON public.global_stock_legal_acceptances FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()) AND adult_18_attested = true);
REVOKE ALL ON public.global_stock_legal_acceptances FROM PUBLIC, anon;
GRANT SELECT, INSERT ON public.global_stock_legal_acceptances TO authenticated;

-- Separate, revocable per-business consent for providing merchant inventory
-- context to Global Intelligence's server-side AI provider.
CREATE TABLE IF NOT EXISTS public.global_stock_ai_data_consents (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.global_stock_businesses(id) ON DELETE CASCADE,
  approved boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, business_id)
);
ALTER TABLE public.global_stock_ai_data_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY global_stock_ai_data_consents_own_select
ON public.global_stock_ai_data_consents FOR SELECT TO authenticated
USING (user_id = (select auth.uid()) AND public.global_stock_is_member(business_id));
CREATE POLICY global_stock_ai_data_consents_own_insert
ON public.global_stock_ai_data_consents FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()) AND public.global_stock_is_member(business_id));
CREATE POLICY global_stock_ai_data_consents_own_update
ON public.global_stock_ai_data_consents FOR UPDATE TO authenticated
USING (user_id = (select auth.uid()) AND public.global_stock_is_member(business_id))
WITH CHECK (user_id = (select auth.uid()) AND public.global_stock_is_member(business_id));
REVOKE ALL ON public.global_stock_ai_data_consents FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.global_stock_ai_data_consents TO authenticated;