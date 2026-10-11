-- Global Stock Argentina beta: record explicit self-attested operation in AR.
-- This is an eligibility declaration, NOT geolocation or identity verification.
ALTER TABLE public.global_stock_legal_acceptances
  ADD COLUMN IF NOT EXISTS operates_in_ar_attested boolean NOT NULL DEFAULT false;

ALTER POLICY global_stock_legal_acceptances_insert_own
  ON public.global_stock_legal_acceptances
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND adult_18_attested = true
    AND operates_in_ar_attested = true
  );
