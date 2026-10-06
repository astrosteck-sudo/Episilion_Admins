import { Tabs } from 'expo-router';
import { TabBarIcon, useTabScreenOptions } from '../../src/components/AppTabs';

export default function SubAdminLayout() {
  const screenOptions = useTabScreenOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="home-outline" focusedName="home" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="submissions"
        options={{
          title: 'Submissions',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name="document-text-outline"
              focusedName="document-text"
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
      <Tabs.Screen name="add-hostel" options={{ href: null }} />
      <Tabs.Screen name="update-hostel" options={{ href: null }} />
    </Tabs>
  );
}
