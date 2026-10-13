import type { SupportedStorage } from "@supabase/supabase-js";

/** Browser sessions use same-origin storage. No Keychain exists in web browsers.
 * Supabase access remains subject to server JWT verification and RLS.
 */
const prefix = "gs.web.session.";
const slot = (key: string) => prefix + key.replace(/[^a-zA-Z0-9_.-]/g, "_");
export const secureSessionStorage: SupportedStorage = {
  async getItem(key) {
    try { return window.localStorage.getItem(slot(key)); } catch { return null; }
  },
  async setItem(key, value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(slot(key), value);
  },
  async removeItem(key) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(slot(key));
  }
};
