-- Round USD reference pricing and irreversible cancellation for Global Stock subscriptions.
-- Paid checkout remains disabled; these are display/catalog values only.
ALTER TABLE public.global_stock_subscriptions
  ADD COLUMN IF NOT EXISTS price_usd integer NOT NULL DEFAULT 0 CHECK (price_usd >= 0);

UPDATE public.global_stock_subscriptions
SET price_usd = CASE plan_key WHEN 'starter' THEN 10 WHEN 'pro' THEN 20 ELSE 0 END,
    price_ars = 0,
    billing_currency = 'USD',
    updated_at = now()
WHERE provider_subscription_id IS NULL;

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
      OR NEW.price_usd IS DISTINCT FROM OLD.price_usd
      OR NEW.billing_currency IS DISTINCT FROM OLD.billing_currency
      OR NEW.accepted_terms_version IS DISTINCT FROM OLD.accepted_terms_version
      OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'SUBSCRIPTION_FIELDS_READ_ONLY' USING ERRCODE = '42501';
    END IF;
    IF OLD.cancel_at_period_end AND NOT NEW.cancel_at_period_end THEN
      RAISE EXCEPTION 'SUBSCRIPTION_CANCELLATION_CANNOT_BE_REVERSED' USING ERRCODE = '42501';
    END IF;
    IF NEW.cancel_at_period_end IS DISTINCT FROM OLD.cancel_at_period_end THEN
      IF NEW.cancel_at_period_end THEN
        NEW.status := 'cancelled';
        NEW.cancelled_at := now();
      ELSE
        RAISE EXCEPTION 'SUBSCRIPTION_CANCELLATION_CANNOT_BE_REVERSED' USING ERRCODE = '42501';
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

CREATE OR REPLACE FUNCTION public.global_stock_create_subscription_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  selected_plan text;
  selected_price_usd integer;
BEGIN
  IF coalesce(NEW.raw_user_meta_data ->> 'app', '') <> 'global_stock' THEN
    RETURN NEW;
  END IF;
  selected_plan := CASE
    WHEN NEW.raw_user_meta_data ->> 'global_stock_selected_plan' IN ('free', 'starter', 'pro')
      THEN NEW.raw_user_meta_data ->> 'global_stock_selected_plan'
    ELSE 'free'
  END;
  selected_price_usd := CASE selected_plan WHEN 'starter' THEN 10 WHEN 'pro' THEN 20 ELSE 0 END;
  INSERT INTO public.global_stock_subscriptions
    (user_id, plan_key, status, trial_started_at, trial_ends_at, price_ars, price_usd, billing_currency, accepted_terms_version)
  VALUES
    (NEW.id, selected_plan, 'trialing', now(), now() + interval '15 days', 0, selected_price_usd, 'USD', '2026-10-27-ar-subscriptions')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.global_stock_create_subscription_for_new_user() FROM PUBLIC, anon, authenticated;
