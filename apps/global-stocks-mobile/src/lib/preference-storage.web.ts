/** Web platform: match Expo theme/language preferences without native Keychain. */
export const preferenceStorage = {
  getItemAsync: async (key: string): Promise<string | null> => {
    try { return window.localStorage.getItem("gs.pref." + key); }
    catch { return null; }
  },
  setItemAsync: async (key: string, value: string): Promise<void> => {
    window.localStorage.setItem("gs.pref." + key, value);
  }
};
