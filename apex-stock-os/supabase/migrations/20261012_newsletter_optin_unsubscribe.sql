-- Global Stock optional feature-update emails. This migration does NOT
-- subscribe anybody automatically or enable outbound marketing.
CREATE TABLE IF NOT EXISTS public.global_stock_newsletter_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  subscribed boolean NOT NULL DEFAULT false,
  consented_at timestamptz,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT global_stock_newsletter_email_length CHECK (length(email) BETWEEN 5 AND 254)
);

ALTER TABLE public.global_stock_newsletter_preferences ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.global_stock_newsletter_preferences FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.global_stock_newsletter_preferences TO authenticated;

DROP POLICY IF EXISTS "global_stock_newsletter_select_own" ON public.global_stock_newsletter_preferences;
CREATE POLICY "global_stock_newsletter_select_own"
 ON public.global_stock_newsletter_preferences FOR SELECT TO authenticated
 USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "global_stock_newsletter_insert_own" ON public.global_stock_newsletter_preferences;
CREATE POLICY "global_stock_newsletter_insert_own"
 ON public.global_stock_newsletter_preferences FOR INSERT TO authenticated
 WITH CHECK ((select auth.uid()) = user_id AND
    lower(email) = lower((select auth.jwt()->>'email')));

DROP POLICY IF EXISTS "global_stock_newsletter_update_own" ON public.global_stock_newsletter_preferences;
CREATE POLICY "global_stock_newsletter_update_own"
 ON public.global_stock_newsletter_preferences FOR UPDATE TO authenticated
 USING ((select auth.uid()) = user_id)
 WITH CHECK ((select auth.uid()) = user_id AND
    lower(email) = lower((select auth.jwt()->>'email')));

-- Only return a boolean: never disclose whose email a token belongs to.
-- Anonymous one-click unsubscribe is intentionally permitted.
CREATE OR REPLACE FUNCTION public.global_stock_newsletter_unsubscribe(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE v_changed boolean;
BEGIN
  UPDATE public.global_stock_newsletter_preferences
   SET subscribed=false, unsubscribed_at=now(), updated_at=now(),
       unsubscribe_token=gen_random_uuid()
   WHERE unsubscribe_token=p_token AND subscribed=true;
  GET DIAGNOSTICS v_changed = ROW_COUNT;
  RETURN v_changed;
END;
$$;
REVOKE ALL ON FUNCTION public.global_stock_newsletter_unsubscribe(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.global_stock_newsletter_unsubscribe(uuid) TO anon, authenticated;
