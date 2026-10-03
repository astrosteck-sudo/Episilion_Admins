import { Tabs } from 'expo-router';

export default function SubAdminLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
    </Tabs>
  );
}
