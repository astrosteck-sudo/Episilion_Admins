import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const router = useRouter();
  const { user, role, loadAuth } = useAuthStore();

  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    } else if (role === 'super_admin') {
      router.replace('/(super-admin)');
    } else if (role === 'sub_admin') {
      router.replace('/(sub-admin)');
    }
  }, [user, role, router]);

  return null;
}
