import * as SecureStore from "expo-secure-store";

/** Native platform: non-sensitive preferences remain in the OS key store. */
export const preferenceStorage = {
  getItemAsync: (key: string) => SecureStore.getItemAsync(key),
  setItemAsync: (key: string, value: string) => SecureStore.setItemAsync(key, value)
};
