import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../src/store/themeStore';
import { ScreenHeader } from '../../src/components/ScreenHeader';

export default function UpdateHostelScreen() {
  const colors = useThemeStore((state) => state.colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Update Hostel" subtitle="Edit hostel information" />

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Update Existing Hostel</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Form to update hostel information (Placeholder)
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
