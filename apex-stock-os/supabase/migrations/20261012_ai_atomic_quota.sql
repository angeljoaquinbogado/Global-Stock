-- Bound authenticated AI usage across Vercel instances without exposing
-- the private rate-limit table through PostgREST.
-- Three rolling fixed windows: 20/minute, 150/hour, 500/day.
-- auth.uid() determines the identity; callers cannot choose another user.
CREATE OR REPLACE FUNCTION public.global_stock_ai_allow_request()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_key text;
  v_count integer;
  v_started timestamptz;
  v_limit integer;
  v_duration integer;
  v_scope text;
  v_retry integer;
  v_keys text[] := ARRAY[]::text[];
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'retryAfter', 60);
  END IF;

  -- Serialize requests from this user across serverless instances.
  PERFORM pg_advisory_xact_lock(hashtext('gs-ai-budget-' || v_user::text));
  FOR i IN 1..3 LOOP
    v_scope := CASE i WHEN 1 THEN 'minute' WHEN 2 THEN 'hour' ELSE 'day' END;
    v_duration := CASE i WHEN 1 THEN 60 WHEN 2 THEN 3600 ELSE 86400 END;
    v_limit := CASE i WHEN 1 THEN 20 WHEN 2 THEN 150 ELSE 500 END;
    v_key := md5('global-stock-ai-' || v_scope || ':' || v_user::text);
    v_keys := array_append(v_keys, v_key);

    INSERT INTO public.api_rate_limits(key_hash,window_started_at,request_count,updated_at)
    VALUES(v_key,v_now,0,v_now) ON CONFLICT (key_hash) DO NOTHING;
    SELECT request_count,window_started_at INTO v_count,v_started
      FROM public.api_rate_limits WHERE key_hash=v_key FOR UPDATE;

    IF v_started <= v_now - make_interval(secs => v_duration) THEN
      UPDATE public.api_rate_limits SET request_count=0,
        window_started_at=v_now,updated_at=v_now WHERE key_hash=v_key;
      v_count := 0;
      v_started := v_now;
    END IF;

    IF v_count >= v_limit THEN
      v_retry := greatest(1,ceil(extract(epoch from (v_started +
        make_interval(secs => v_duration) - v_now)))::integer);
      RETURN jsonb_build_object('allowed',false,'retryAfter',v_retry);
    END IF;
  END LOOP;

  UPDATE public.api_rate_limits
    SET request_count=request_count+1,updated_at=v_now
    WHERE key_hash=ANY(v_keys);
  RETURN jsonb_build_object('allowed',true,'retryAfter',0);
END;
$function$;

REVOKE ALL ON FUNCTION public.global_stock_ai_allow_request() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.global_stock_ai_allow_request() FROM anon;
GRANT EXECUTE ON FUNCTION public.global_stock_ai_allow_request() TO authenticated;
