import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../constants';

export type UserRole = 'super_admin' | 'sub_admin';

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
    SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
    SecureStore.setItemAsync(STORAGE_KEYS.USER_ROLE, role);
    SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },
  clearAuth: () => {
    set({ user: null, role: null, token: null });
    SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ROLE);
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
  },
  loadAuth: async () => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    const role = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ROLE) as UserRole | null;
    const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    
    if (token && role && userData) {
      set({
        token,
        role,
        user: JSON.parse(userData),
      });
    }
  },
}));
