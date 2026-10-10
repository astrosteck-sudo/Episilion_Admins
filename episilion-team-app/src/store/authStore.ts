import { create } from 'zustand';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants';

export type UserRole = 'super_admin' | 'sub_admin';

/**
 * On web the token lives in an httpOnly cookie, so it is deliberately never
 * written to storage where any script could read it. The native app has no
 * cookie jar and keeps using the keychain.
 */
const persistToken = Platform.OS !== 'web';

interface User {
  id: string;
  email: string;
  name: string; // This maps to full_name from backend
}

interface AuthState {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  setAuth: (user: User, role: UserRole, token: string) => void;
  clearAuth: () => void;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  token: null,
  setAuth: (user, role, token) => {
    set({ user, role, token });
    if (persistToken) storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    storage.setItem(STORAGE_KEYS.USER_ROLE, role);
    storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },
  clearAuth: () => {
    set({ user: null, role: null, token: null });
    storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    storage.removeItem(STORAGE_KEYS.USER_ROLE);
    storage.removeItem(STORAGE_KEYS.USER_DATA);
  },
  loadAuth: async () => {
    const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const role = await storage.getItem(STORAGE_KEYS.USER_ROLE) as UserRole | null;
    const userData = await storage.getItem(STORAGE_KEYS.USER_DATA);

    // On web the cookie is the credential, so a stored profile is enough to
    // restore the session; the API rejects it with a 401 if the cookie expired.
    const hasCredential = persistToken ? Boolean(token) : true;

    if (hasCredential && role && userData) {
      set({
        token,
        role,
        user: JSON.parse(userData),
      });
    }
  },
}));
