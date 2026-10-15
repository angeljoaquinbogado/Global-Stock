/**
 * Auth UI feedback and a per-browser courtesy lockout.
 *
 * The browser lock reduces accidental/repeated attempts. It is NOT the
 * authoritative security boundary: it can be cleared or bypassed, so the
 * application must continue to honor Supabase Auth server-side rate limits.
 * Do not store account identifiers or passwords in this state.
 */
export const LOGIN_ATTEMPT_LIMIT = 5;
export const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_ATTEMPT_STORAGE_KEY = "gs.auth.password-attempts.v1";

export type LoginAttemptState = {
  failed: number;
  startedAt: number;
  lockedUntil: number;
};

const empty: LoginAttemptState = { failed: 0, startedAt: 0, lockedUntil: 0 };
export const emptyLoginAttemptState = (): LoginAttemptState => ({ ...empty });

export function readLoginAttemptState(serialized: string | null, now = Date.now()): LoginAttemptState {
  if (!serialized) return emptyLoginAttemptState();
  try {
    const data = JSON.parse(serialized) as Partial<LoginAttemptState>;
    const failed = Number(data.failed);
    const startedAt = Number(data.startedAt);
    const lockedUntil = Number(data.lockedUntil);
    if (
      !Number.isInteger(failed) || failed < 0 || failed > LOGIN_ATTEMPT_LIMIT ||
      !Number.isFinite(startedAt) || !Number.isFinite(lockedUntil) ||
      startedAt < 0 || lockedUntil < 0 ||
      startedAt > now || lockedUntil > now + LOGIN_ATTEMPT_WINDOW_MS
    ) return emptyLoginAttemptState();
    if (lockedUntil > now) return { failed, startedAt, lockedUntil };
    if (!startedAt || startedAt + LOGIN_ATTEMPT_WINDOW_MS <= now) return emptyLoginAttemptState();
    return { failed, startedAt, lockedUntil: 0 };
  } catch {
    return emptyLoginAttemptState();
  }
}

export function addFailedLoginAttempt(state: LoginAttemptState, now = Date.now()): LoginAttemptState {
  if (state.lockedUntil > now) return state;
  const fresh = !state.startedAt || state.startedAt + LOGIN_ATTEMPT_WINDOW_MS <= now;
  const failed = Math.min(LOGIN_ATTEMPT_LIMIT, (fresh ? 0 : state.failed) + 1);
  return {
    failed,
    startedAt: fresh ? now : state.startedAt,
    lockedUntil: failed >= LOGIN_ATTEMPT_LIMIT ? now + LOGIN_ATTEMPT_WINDOW_MS : 0
  };
}

export function loginLockSeconds(state: LoginAttemptState, now = Date.now()): number {
  return Math.max(0, Math.ceil((state.lockedUntil - now) / 1000));
}

/** Generic wording prevents revealing which email addresses have accounts. */
export type AuthFailure = "invalid" | "unconfirmed" | "rate_limited" | "duplicate" | "network";

export function classifyAuthFailure(error: unknown): AuthFailure {
  const failure = error && typeof error === "object"
    ? error as { code?: unknown; message?: unknown; status?: unknown }
    : {};
  const code = String(failure.code ?? "").toLowerCase();
  const message = String(failure.message ?? "").toLowerCase();
  const status = Number(failure.status ?? 0);
  if (status === 429 || /rate.limit|over_request|too.many.requests|email_send_rate_limit/.test(code + " " + message)) {
    return "rate_limited";
  }
  if (/email_not_confirmed|email not confirmed|not.confirmed/.test(code + " " + message)) {
    return "unconfirmed";
  }
  if (/user_already_exists|user_already_registered|already registered|already exists|email_exists/.test(code + " " + message)) {
    return "duplicate";
  }
  if (/invalid_credentials|invalid_login_credentials|invalid login credentials|invalid email or password/.test(code + " " + message)) {
    return "invalid";
  }
  return "network";
}
