import { Tabs } from 'expo-router';
import { TabBarIcon, useTabScreenOptions } from '../../src/components/AppTabs';

export default function SuperAdminLayout() {
  const screenOptions = useTabScreenOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name="grid-outline"
              focusedName="grid"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name="settings-outline"
              focusedName="settings"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="review-detail"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="security"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="update-requests"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}
