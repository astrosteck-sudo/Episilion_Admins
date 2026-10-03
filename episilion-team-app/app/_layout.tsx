import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';

function RootLayoutNav() {
  const router = useRouter();
  const { user, role, loadAuth } = useAuthStore();
  const { colorScheme } = useThemeStore();

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

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
          },
          headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(sub-admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(super-admin)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
