import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const colors = useThemeStore((state) => state.colors);
  const { colorScheme, setColorScheme, resetToSystemTheme } = useThemeStore();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            clearAuth();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* Theme Setting */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => resetToSystemTheme()}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔄</Text>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Follow System Theme
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {colorScheme === 'light' || colorScheme === 'dark' ? 'OFF' : 'ON'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setColorScheme('light')}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>☀️</Text>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Light Mode
              </Text>
            </View>
            <View style={[styles.radioButton, colorScheme === 'light' && { backgroundColor: colors.primary }]}>
              {colorScheme === 'light' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setColorScheme('dark')}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🌙</Text>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Dark Mode
              </Text>
            </View>
            <View style={[styles.radioButton, colorScheme === 'dark' && { backgroundColor: colors.primary }]}>
              {colorScheme === 'dark' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Setting */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🚪</Text>
              <Text style={[styles.settingLabel, { color: colors.error }]}>
                Logout
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>📱</Text>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                App Version
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#8E8E93',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    fontSize: 20,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 14,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C6C6C8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  arrow: {
    fontSize: 18,
    color: '#8E8E93',
  },
});
