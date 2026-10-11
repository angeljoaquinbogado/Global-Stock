-- Ensure a minimal owner-readable profile exists for every Supabase Auth user.
-- The web API requires global_stock_profiles before accessing Global Intelligence.
-- RLS remains enabled and all client access is restricted to auth.uid().
GRANT SELECT, INSERT, UPDATE ON TABLE public.global_stock_profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.global_stock_on_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.global_stock_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION public.global_stock_on_auth_user_created() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER global_stock_create_user_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.global_stock_on_auth_user_created();

-- Backfill only missing profile identifiers. Do not copy email or secrets.
INSERT INTO public.global_stock_profiles (user_id)
SELECT u.id
FROM auth.users u
LEFT JOIN public.global_stock_profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
