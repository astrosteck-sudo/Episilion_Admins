import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * `expo-secure-store` has no web implementation (its web module is an empty
 * object), so every call would throw on web. This adapter keeps the keychain on
 * native and falls back to `localStorage` in the browser.
 *
 * Note: `localStorage` is readable by any script on the origin, so it is not a
 * substitute for the keychain. Moving the token to an httpOnly cookie is the
 * proper hardening step for the web build.
 */
const isWeb = Platform.OS === 'web';

function webStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) return webStorage()?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      webStorage()?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (isWeb) {
      webStorage()?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
