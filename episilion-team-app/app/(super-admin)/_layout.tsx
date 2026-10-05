import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';

export default function SuperAdminLayout() {
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
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Dashboard',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
