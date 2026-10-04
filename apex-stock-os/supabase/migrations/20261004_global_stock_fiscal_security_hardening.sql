-- Hardening for the fiscal trigger functions.
-- Trigger helpers are not callable as public RPCs and use an explicit search_path.

alter function public.global_stock_touch_fiscal_updated_at()
  set search_path = public;

alter function public.global_stock_protect_authorized_fiscal_document()
  set search_path = public;

revoke all on function public.global_stock_log_fiscal_change()
from public, anon, authenticated;
