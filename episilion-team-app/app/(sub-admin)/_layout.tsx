import { Tabs } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';
import { Ionicons } from '@expo/vector-icons';

export default function SubAdminLayout() {
  const { colorScheme } = useThemeStore();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
        },
        headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
        },
        tabBarActiveTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#98989D' : '#8E8E93',
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="submissions" 
        options={{ 
          title: 'My Submissions',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }} 
      />
      <Tabs.Screen name="add-hostel" options={{ href: null }} />
      <Tabs.Screen name="update-hostel" options={{ href: null }} />
    </Tabs>
  );
}
