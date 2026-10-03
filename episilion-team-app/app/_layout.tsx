import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';

function RootLayoutNav() {
  const { user, role, loadAuth } = useAuthStore();
  const { colorScheme } = useThemeStore();

  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
  }, [user, role]);

  return (
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
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
