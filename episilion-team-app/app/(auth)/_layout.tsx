import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';

export default function AuthLayout() {
  const { colorScheme } = useThemeStore();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
        },
        headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Login'}} />
      <Stack.Screen name="otp" options={{ title: 'OTP' }} />
    </Stack>
  );
}
