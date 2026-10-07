import { Tabs } from "expo-router";
import { TabBarIcon, useTabScreenOptions } from "../../src/components/AppTabs";

export default function SubAdminLayout() {
  const screenOptions = useTabScreenOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name="home-outline"
              focusedName="home"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="submissions"
        options={{
          title: "Submissions",
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
          title: "Settings",
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
      {/* Hidden from the tab bar and rendered full-screen, without the bar. */}
      <Tabs.Screen
        name="add-hostel"
        options={{
          headerShown: false,
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="update-hostel"
        options={{
          headerShown: false,
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="security"
        options={{
          headerShown: false,
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
