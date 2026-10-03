import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type UserRole = 'super_admin' | 'sub_admin';

interface User {
  id: string;
  email: string;
  name: string;
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
    SecureStore.setItemAsync('authToken', token);
    SecureStore.setItemAsync('userRole', role);
    SecureStore.setItemAsync('userData', JSON.stringify(user));
  },
  clearAuth: () => {
    set({ user: null, role: null, token: null });
    SecureStore.deleteItemAsync('authToken');
    SecureStore.deleteItemAsync('userRole');
    SecureStore.deleteItemAsync('userData');
  },
  loadAuth: async () => {
    const token = await SecureStore.getItemAsync('authToken');
    const role = await SecureStore.getItemAsync('userRole') as UserRole | null;
    const userData = await SecureStore.getItemAsync('userData');
    
    if (token && role && userData) {
      set({
        token,
        role,
        user: JSON.parse(userData),
      });
    }
  },
}));
