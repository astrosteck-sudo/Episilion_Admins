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
            style={styles.addHostelCard}
            onPress={() => router.push('/(sub-admin)/add-hostel')}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.icon}>+</Text>
              </View>
              <TouchableOpacity style={styles.cardArrowButton}>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.addHostelTitle}>Add New Hostel</Text>
            <Text style={styles.addHostelDescription}>
              Visit a hostel not yet listed and submit its details, room pricing and verified photos for catalog approval.
            </Text>
            <View style={styles.cardFooter}>
              <View style={styles.tagContainer}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.tagText}>REQUIRES SUPER ADMIN REVIEW</Text>
              </View>
              <Text style={styles.actionText}>NEW ENTRY</Text>
            </View>
          </TouchableOpacity>

          {/* Update Existing Hostel Card */}
          <TouchableOpacity
            style={[styles.updateHostelCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(sub-admin)/update-hostel')}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.icon, { color: '#4CAF50' }]}>✎</Text>
              </View>
              <TouchableOpacity style={[styles.cardArrowButton, { backgroundColor: '#F3E5F5' }]}>
                <Text style={[styles.arrow, { color: '#7B1FA2' }]}>→</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.updateHostelTitle, { color: colors.text }]}>Update Existing Hostel</Text>
            <Text style={[styles.updateHostelDescription, { color: colors.textSecondary }]}>
              Request temporary field permission to modify rates, vacancy, or amenities for an active hostel listing.
            </Text>
            <View style={styles.cardFooter}>
              <View style={[styles.tagContainer, { backgroundColor: '#F3E5F5' }]}>
                <Text style={[styles.lockIcon, { color: '#7B1FA2' }]}>🔒</Text>
                <Text style={[styles.tagText, { color: '#7B1FA2' }]}>NEEDS 24H SCOUT TOKEN</Text>
              </View>
              <Text style={[styles.actionText, { color: '#4CAF50' }]}>REQUEST ACCESS</Text>
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
  addHostelCard: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateHostelCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  cardArrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  addHostelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  addHostelDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 16,
  },
  updateHostelTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  updateHostelDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  checkIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  lockIcon: {
    fontSize: 14,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
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

