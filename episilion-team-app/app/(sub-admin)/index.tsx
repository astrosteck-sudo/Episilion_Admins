import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../src/store/themeStore';
import { router } from 'expo-router';

export default function SubAdminHomeScreen() {
  const colors = useThemeStore((state) => state.colors);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const colorScheme = useThemeStore((state) => state.colorScheme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../assets/episilion_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.greeting, { color: colors.text }]}>Welcome Back</Text>
              <Text style={[styles.userName, { color: colors.textSecondary }]}>
                Sub Admin
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Text style={styles.themeIcon}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          {/* Add New Hostel Card */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(sub-admin)/add-hostel')}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.success }]}>
              <Text style={styles.iconText}>➕</Text>
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Add New Hostel</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
              Register a new hostel to the system
            </Text>
            <View style={[styles.arrowContainer, { backgroundColor: colors.inputBackground }]}>
              <Text style={[styles.arrowText, { color: colors.primary }]}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Update Existing Hostel Card */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(sub-admin)/update-hostel')}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
              <Text style={styles.iconText}>✏️</Text>
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Update Existing Hostel</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
              Modify information for existing hostels
            </Text>
            <View style={[styles.arrowContainer, { backgroundColor: colors.inputBackground }]}>
              <Text style={[styles.arrowText, { color: colors.primary }]}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Hostels</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.success }]}>8</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>4</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          <View style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.activityDot, { backgroundColor: colors.success }]} />
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: colors.text }]}>
                Hall A - Room 202
              </Text>
              <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                2 hours ago
              </Text>
            </View>
          </View>
          <View style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.activityDot, { backgroundColor: colors.primary }]} />
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: colors.text }]}>
                Hall B - Room 105
              </Text>
              <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                5 hours ago
              </Text>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 50,
    height: 50,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
  },
  userName: {
    fontSize: 14,
  },
  themeToggle: {
    padding: 8,
  },
  themeIcon: {
    fontSize: 24,
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 28,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    flex: 1,
  },
  actionDescription: {
    fontSize: 14,
    flex: 1,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
});

