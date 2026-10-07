import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

  const initials = (user?.name || 'SA')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                Welcome back
              </Text>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {user?.name || 'Sub Admin'}
              </Text>
            </View>
          </View>
          <View style={[styles.rolePill, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="person" size={11} color={colors.primary} />
            <Text style={[styles.rolePillText, { color: colors.primary }]}>Sub Admin</Text>
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          {/* Add New Hostel */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.actionCard,
              styles.addCard,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ]}
            onPress={() => router.push('/(sub-admin)/add-hostel')}
          >
            <View style={styles.actionTop}>
              <View style={styles.actionIconOnFill}>
                <Ionicons name="add" size={26} color="#FFFFFF" />
              </View>
              <View style={styles.actionChevronOnFill}>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.actionTitleOnFill}>Add New Hostel</Text>
            <Text style={styles.actionDescriptionOnFill}>
              Visit a hostel that isn't listed yet and submit its details, room pricing
              and verified photos for review.
            </Text>

            <View style={styles.actionTagOnFill}>
              <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
              <Text style={styles.actionTagTextOnFill}>REQUIRES SUPER ADMIN REVIEW</Text>
            </View>
          </TouchableOpacity>

          {/* Update Existing Hostel */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.actionCard,
              {
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
              },
            ]}
            onPress={() => router.push('/(sub-admin)/update-hostel')}
          >
            <View style={styles.actionTop}>
              <View
                style={[
                  styles.actionIconTinted,
                  { backgroundColor: colors.secondary + '1A' },
                ]}
              >
                <Ionicons name="create-outline" size={24} color={colors.secondary} />
              </View>
              <View style={[styles.actionChevron, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="arrow-forward" size={18} color={colors.secondary} />
              </View>
            </View>

            <Text style={[styles.actionTitle, { color: colors.text }]}>
              Update Existing Hostel
            </Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
              Request temporary field access to correct rates, vacancy or perks on an
              active hostel listing.
            </Text>

            <View style={[styles.actionTag, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="lock-closed" size={12} color={colors.secondary} />
              <Text style={[styles.actionTagText, { color: colors.secondary }]}>
                REQUEST ACCESS
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.7}
            onPress={() => router.push('/(sub-admin)/submissions')}
          >
            <Ionicons name="layers-outline" size={18} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {statValue(stats?.total)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </TouchableOpacity>

          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.7}
            onPress={() => router.push('/(sub-admin)/submissions')}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {statValue(stats?.approved)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
          </TouchableOpacity>

          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.7}
            onPress={() => router.push('/(sub-admin)/submissions')}
          >
            <Ionicons name="time-outline" size={18} color={colors.accent} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
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

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 12,
  },
  userName: {
    fontSize: 19,
    fontWeight: '700',
    marginTop: 1,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Action cards */
  actionsContainer: {
    gap: 14,
    marginBottom: 24,
  },
  actionCard: {
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  addCard: {
    shadowOpacity: 0.28,
  },
  actionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  actionIconOnFill: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  actionChevronOnFill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  actionIconTinted: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionChevron: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitleOnFill: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 7,
  },
  actionDescriptionOnFill: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 7,
  },
  actionDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  actionTagOnFill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  actionTagTextOnFill: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#FFFFFF',
  },
  actionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  actionTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  /* Quick stats */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    marginBottom: 28,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 34,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Recent activity */
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
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
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  activityDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
});