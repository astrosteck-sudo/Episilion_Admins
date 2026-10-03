import { Tabs } from 'expo-router';

export default function SuperAdminLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
    </Tabs>
  );
}
