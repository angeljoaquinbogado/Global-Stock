-- Subscription lifecycle for Global Stock Argentina beta.
-- New users choose a plan at sign-up; all plans begin with a 15-day trial.
-- No automatic charge is created when the trial ends.
CREATE TABLE IF NOT EXISTS public.global_stock_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_key text NOT NULL DEFAULT 'free' CHECK (plan_key IN ('free', 'starter', 'pro')),
  status text NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  trial_started_at timestamptz NOT NULL DEFAULT now(),
  trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '15 days'),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  cancelled_at timestamptz,
  provider text CHECK (provider IS NULL OR provider IN ('paypal')),
  provider_subscription_id text UNIQUE,
  price_ars integer NOT NULL DEFAULT 0 CHECK (price_ars >= 0),
  billing_currency text NOT NULL DEFAULT 'ARS' CHECK (billing_currency IN ('ARS', 'USD')),
  accepted_terms_version text NOT NULL DEFAULT '2026-10-27-ar-subscriptions',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (trial_ends_at > trial_started_at),
  CHECK ((provider_subscription_id IS NULL) OR provider IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS global_stock_subscriptions_status_trial_end_idx
ON public.global_stock_subscriptions (status, trial_ends_at);

ALTER TABLE public.global_stock_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.global_stock_subscriptions FROM PUBLIC, anon;
GRANT SELECT, UPDATE ON public.global_stock_subscriptions TO authenticated;

DROP POLICY IF EXISTS global_stock_subscriptions_read_own ON public.global_stock_subscriptions;
CREATE POLICY global_stock_subscriptions_read_own
ON public.global_stock_subscriptions FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS global_stock_subscriptions_update_own ON public.global_stock_subscriptions;
CREATE POLICY global_stock_subscriptions_update_own
ON public.global_stock_subscriptions FOR UPDATE TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

CREATE OR REPLACE FUNCTION public.global_stock_guard_subscription_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF OLD.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'SUBSCRIPTION_FORBIDDEN' USING ERRCODE = '42501';
    END IF;
    IF OLD.provider_subscription_id IS NOT NULL THEN
      RAISE EXCEPTION 'PROVIDER_SUBSCRIPTION_REQUIRES_BILLING_ENDPOINT' USING ERRCODE = '42501';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.plan_key IS DISTINCT FROM OLD.plan_key
      OR NEW.status IS DISTINCT FROM OLD.status
      OR NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at
      OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
      OR NEW.current_period_start IS DISTINCT FROM OLD.current_period_start
      OR NEW.current_period_end IS DISTINCT FROM OLD.current_period_end
      OR NEW.provider IS DISTINCT FROM OLD.provider
      OR NEW.provider_subscription_id IS DISTINCT FROM OLD.provider_subscription_id
      OR NEW.price_ars IS DISTINCT FROM OLD.price_ars
      OR NEW.billing_currency IS DISTINCT FROM OLD.billing_currency
      OR NEW.accepted_terms_version IS DISTINCT FROM OLD.accepted_terms_version
      OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'SUBSCRIPTION_FIELDS_READ_ONLY' USING ERRCODE = '42501';
    END IF;
    IF NEW.cancel_at_period_end IS DISTINCT FROM OLD.cancel_at_period_end THEN
      IF NEW.cancel_at_period_end THEN
        NEW.status := 'cancelled';
        NEW.cancelled_at := now();
      ELSE
        NEW.status := 'trialing';
        NEW.cancelled_at := NULL;
      END IF;
    ELSIF NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
      OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'SUBSCRIPTION_CANCELLATION_ONLY' USING ERRCODE = '42501';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.global_stock_guard_subscription_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS global_stock_subscriptions_guard_update ON public.global_stock_subscriptions;
CREATE TRIGGER global_stock_subscriptions_guard_update
BEFORE UPDATE ON public.global_stock_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.global_stock_guard_subscription_update();

CREATE OR REPLACE FUNCTION public.global_stock_create_subscription_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  selected_plan text;
  selected_price integer;
BEGIN
  IF coalesce(NEW.raw_user_meta_data ->> 'app', '') <> 'global_stock' THEN
    RETURN NEW;
  END IF;
  selected_plan := CASE
    WHEN NEW.raw_user_meta_data ->> 'global_stock_selected_plan' IN ('free', 'starter', 'pro')
      THEN NEW.raw_user_meta_data ->> 'global_stock_selected_plan'
    ELSE 'free'
  END;
  selected_price := CASE selected_plan
    WHEN 'starter' THEN 9900
    WHEN 'pro' THEN 19900
    ELSE 0
  END;
  INSERT INTO public.global_stock_subscriptions
    (user_id, plan_key, status, trial_started_at, trial_ends_at, price_ars, billing_currency, accepted_terms_version)
  VALUES
    (NEW.id, selected_plan, 'trialing', now(), now() + interval '15 days', selected_price, 'ARS', '2026-10-27-ar-subscriptions')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.global_stock_create_subscription_for_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS global_stock_auth_user_subscription ON auth.users;
CREATE TRIGGER global_stock_auth_user_subscription
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.global_stock_create_subscription_for_new_user();

-- Existing beta accounts receive a fresh 15-day trial only if no billing row exists.
INSERT INTO public.global_stock_subscriptions
  (user_id, plan_key, status, trial_started_at, trial_ends_at, price_ars, billing_currency, accepted_terms_version)
SELECT u.id, 'free', 'trialing', now(), now() + interval '15 days', 0, 'ARS', '2026-10-27-ar-subscriptions'
FROM auth.users u
WHERE coalesce(u.raw_user_meta_data ->> 'app', '') = 'global_stock'
ON CONFLICT (user_id) DO NOTHING;
