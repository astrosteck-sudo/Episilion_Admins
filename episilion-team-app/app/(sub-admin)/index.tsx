import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { router, useFocusEffect } from 'expo-router';
import { getHostelStats, listHostels, type HostelStats, type HostelListItem, type HostelStatus } from '../../src/api/hostels';

const STATUS_COLOR_KEY: Record<HostelStatus, 'success' | 'accent' | 'error'> = {
  approved: 'success',
  pending: 'accent',
  rejected: 'error',
};

const STATUS_LABEL: Record<HostelStatus, string> = {
  approved: 'Approved',
  pending: 'Awaiting verification',
  rejected: 'Rejected',
};

/** "2 hours ago" style label from an ISO timestamp. */
const timeAgo = (iso: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export default function SubAdminHomeScreen() {
  const colors = useThemeStore((state) => state.colors);
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<HostelStats | null>(null);
  const [recent, setRecent] = useState<HostelListItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const [counters, submissions] = await Promise.all([
            getHostelStats(),
            listHostels('all'),
          ]);
          if (!active) return;
          setStats(counters);
          setRecent(submissions.slice(0, 4));
        } catch {
          if (!active) return;
          setStats({ pending: 0, approved: 0, rejected: 0, total: 0 });
          setRecent([]);
        } finally {
          if (active) setIsLoadingStats(false);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const statValue = (value: number | undefined) =>
    isLoadingStats ? '—' : String(value ?? 0);

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
                {user?.name || 'Sub Admin'}
              </Text>
            </View>
          </View>
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
                <Text style={styles.cardIcon}>+</Text>
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
            </View>
          </TouchableOpacity>

          {/* Update Existing Hostel Card */}
          <TouchableOpacity
            style={[styles.updateHostelCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(sub-admin)/update-hostel')}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.cardIcon, { color: '#4CAF50' }]}>✎</Text>
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
                <Text style={[styles.tagText, { color: '#7B1FA2' }]}>REQUEST ACCESS</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(sub-admin)/submissions')}
          >
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {statValue(stats?.total)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Hostels</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(sub-admin)/submissions')}
          >
            <Text style={[styles.statNumber, { color: colors.success }]}>
              {statValue(stats?.approved)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(sub-admin)/submissions')}
          >
            <Text style={[styles.statNumber, { color: colors.warning }]}>
              {statValue(stats?.pending)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
            {recent.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(sub-admin)/submissions')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoadingStats ? (
            <View style={styles.activityEmpty}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : recent.length === 0 ? (
            <View style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.activityDot, { backgroundColor: colors.textTertiary }]} />
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.textSecondary }]}>
                  No submissions yet
                </Text>
                <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                  Add a hostel to see it here
                </Text>
              </View>
            </View>
          ) : (
            recent.map((hostel) => (
              <TouchableOpacity
                key={hostel.hostel_id}
                style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push('/(sub-admin)/submissions')}
              >
                <View
                  style={[
                    styles.activityDot,
                    { backgroundColor: colors[STATUS_COLOR_KEY[hostel.status]] },
                  ]}
                />
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>
                    {hostel.name}
                  </Text>
                  <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                    {STATUS_LABEL[hostel.status]} • {timeAgo(hostel.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  cardIcon: {
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
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activityEmpty: {
    paddingVertical: 24,
    alignItems: 'center',
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

