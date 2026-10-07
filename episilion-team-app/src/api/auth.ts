import { apiClient } from './client';
import type { UserRole } from '../store/authStore';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    full_name: string;
    email: string;
    role: UserRole;
  };
}

export async function loginRequest(email: string, password: string) {
  const res = await apiClient.post<LoginResponse>('/api/team/auth/login', { email, password });
  return res.data;
}

export async function changePasswordRequest(currentPassword: string, newPassword: string) {
  const res = await apiClient.post<{ message: string }>('/api/team/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return res.data;
}