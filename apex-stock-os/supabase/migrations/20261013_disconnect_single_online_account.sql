-- Disconnect one selected connected shop; never disconnect every store of the
-- same provider. Provider credentials must not be exposed to the client.
CREATE OR REPLACE FUNCTION public.global_stock_disconnect_integration_account(
  target_business_id uuid, target_account_id uuid
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_account record;
  v_remaining integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR public.global_stock_member_role(target_business_id) NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('gs-shop-unlink-' || target_business_id::text));
  SELECT id, provider, external_account_id, display_name
  INTO v_account
  FROM public.global_stock_integration_accounts
  WHERE business_id = target_business_id AND id = target_account_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INTEGRATION_ACCOUNT_NOT_FOUND';
  END IF;

  DELETE FROM public.global_stock_integration_accounts
    WHERE business_id = target_business_id AND id = target_account_id;

  -- Remove only a token explicitly keyed to this external account.
  DELETE FROM public.global_stock_integration_secrets
    WHERE business_id = target_business_id
      AND provider = v_account.provider
      AND connection_key = v_account.external_account_id;

  SELECT count(*) INTO v_remaining
    FROM public.global_stock_integration_accounts
    WHERE business_id = target_business_id AND provider = v_account.provider;
  IF v_remaining = 0 THEN
    -- Legacy providers may have stored one provider-wide "primary" token.
    -- Only remove such shared credentials when no connected accounts remain.
    DELETE FROM public.global_stock_integration_secrets
      WHERE business_id = target_business_id
        AND provider = v_account.provider;
  END IF;

  INSERT INTO public.global_stock_audit_events(
    business_id, user_id, action, entity_type, entity_id, metadata
  ) VALUES (
    target_business_id, (SELECT auth.uid()), 'integration.account_disconnected',
    'integration', target_account_id::text,
    jsonb_build_object('provider',v_account.provider,
      'account_id',target_account_id,
      'other_accounts_preserved',v_remaining)
  );
  RETURN true;
END
$$;
REVOKE ALL ON FUNCTION public.global_stock_disconnect_integration_account(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.global_stock_disconnect_integration_account(uuid,uuid) TO authenticated;
