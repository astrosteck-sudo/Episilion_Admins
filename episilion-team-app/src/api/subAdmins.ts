import { apiClient } from './client';

export interface SubAdmin {
  id: number;
  full_name: string;
  email: string;
  status: 'active' | 'suspended';
  last_login_at: string | null;
  created_at: string;
}

export async function listSubAdmins() {
  const response = await apiClient.get<{ subAdmins: SubAdmin[] }>('/api/team/sub-admins');
  return response.data.subAdmins;
}

export async function createSubAdmin(fullName: string, email: string, password: string) {
  const response = await apiClient.post<{ subAdmin: SubAdmin }>('/api/team/sub-admins', {
    full_name: fullName,
    email,
    password,
  });
  return response.data.subAdmin;
}
