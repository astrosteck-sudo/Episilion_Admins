import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar as RNStatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { AppAlertProvider } from '../src/components/AppAlert';
import { SplashOverlay } from '../src/components/SplashOverlay';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';

// Keep the native splash visible until the JS splash overlay is mounted, so the
// hand-off between the two is seamless.
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const router = useRouter();
  const { user, role, loadAuth } = useAuthStore();
  const { colorScheme } = useThemeStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  // The JS splash overlay is now mounted, so the native splash can be removed.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
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

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      <RNStatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colorScheme === 'dark' ? '#000000' : '#FFFFFF'}
      />
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
      {showSplash ? <SplashOverlay onFinish={handleSplashFinish} /> : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppAlertProvider>
        <RootLayoutNav />
      </AppAlertProvider>
    </ThemeProvider>
  );
}
