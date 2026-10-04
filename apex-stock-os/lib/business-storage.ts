export function businessStorageKey(
  baseKey: string,
  businessId: string | null | undefined,
  demoMode = false
) {
  if (demoMode) return `${baseKey}:demo`;
  if (!businessId) return null;
  return `${baseKey}:business:${businessId}`;
}

export function readBusinessJson<T>(
  baseKey: string,
  businessId: string | null | undefined,
  demoMode: boolean,
  fallback: T
): T {
  if (typeof window === "undefined") return fallback;

  const key = businessStorageKey(baseKey, businessId, demoMode);
  if (!key) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeBusinessJson(
  baseKey: string,
  businessId: string | null | undefined,
  demoMode: boolean,
  value: unknown
) {
  if (typeof window === "undefined") return false;

  const key = businessStorageKey(baseKey, businessId, demoMode);
  if (!key) return false;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
