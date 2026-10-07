import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { router, useFocusEffect } from 'expo-router';
import {
  listHostels,
  getHostelStats,
  type HostelListItem,
  type HostelStats,
} from '../../src/api/hostels';

const PLACEHOLDER_IMAGE = require('../../assets/episilion_logo.png');

const formatPrice = (min: number | null, max: number | null) => {
  if (min === null && max === null) return 'N/A';
  if (min !== null && max !== null && min !== max) return `₵ ${min.toLocaleString()} - ${max.toLocaleString()}`;
  const value = min ?? max;
  return `₵ ${(value as number).toLocaleString()}`;
};

export default function SuperAdminHomeScreen() {
  const colors = useThemeStore((state) => state.colors);
  const user = useAuthStore((state) => state.user);
  const [activeFilter, setActiveFilter] = useState('All items');
  const [hostels, setHostels] = useState<HostelListItem[]>([]);
  const [stats, setStats] = useState<HostelStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    update_pending: 0,
    pending_total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [list, counters] = await Promise.all([listHostels('pending'), getHostelStats()]);
      setHostels(list);
      setStats(counters);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load hostels');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setIsLoading(true);
        await load();
        if (active) setIsLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }, [load]);

  const firstName = (user?.name || 'Admin').split(' ')[0];

  const visibleHostels = hostels.filter((hostel) => {
    if (activeFilter === 'Today') {
      const created = new Date(hostel.created_at);
      const now = new Date();
      return (
        created.getDate() === now.getDate() &&
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }
    if (activeFilter === 'Update Requests') return false;
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../assets/episilion_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.greeting, { color: colors.text }]}>Welcome back, {firstName}</Text>
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {stats.pending} {stats.pending === 1 ? 'item' : 'items'} waiting for review
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.success }]}>
              <Text style={styles.statIconText}>🏠</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>New Hostels</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.pending} in queue</Text>
              <Text style={[styles.statHint, { color: colors.textSecondary }]}>
                Awaiting your audit
              </Text>
            </View>
            <View style={[styles.statCountBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.statCountText}>{stats.pending}</Text>
            </View>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.statIconText}>✏️</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Approved Hostels</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.approved} live</Text>
              <Text style={[styles.statHint, { color: colors.textSecondary }]}>
                Published to the site
              </Text>
            </View>
            <View style={[styles.statCountBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.statCountText}>{stats.approved}</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'All items' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            onPress={() => setActiveFilter('All items')}
          >
            <Text style={[styles.filterText, activeFilter === 'All items' ? { color: '#FFFFFF' } : { color: colors.text }]}>All items</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'Today' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            onPress={() => setActiveFilter('Today')}
          >
            <Text style={[styles.filterText, activeFilter === 'Today' ? { color: '#FFFFFF' } : { color: colors.text }]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'Update Requests' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            onPress={() => router.push('/(super-admin)/update-requests')}
          >
            <Text style={[styles.filterText, activeFilter === 'Update Requests' ? { color: '#FFFFFF' } : { color: colors.text }]}>Update Requests</Text>
          </TouchableOpacity>
        </View>

        {/* Hostel List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>New Entries</Text>
        </View>

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              Loading pending hostels...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={[styles.stateText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={onRefresh}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : visibleHostels.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              No hostels waiting for review.
            </Text>
          </View>
        ) : (
          visibleHostels.map((hostel) => (
            <TouchableOpacity
              key={hostel.hostel_id}
              activeOpacity={0.85}
              onPress={() => router.push(`/(super-admin)/review-detail?id=${hostel.hostel_id}`)}
              style={[styles.hostelCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.hostelImageWrapper}>
                <Image
                  source={hostel.main_image ? { uri: hostel.main_image } : PLACEHOLDER_IMAGE}
                  style={styles.hostelImage}
                />
                {hostel.status === 'pending' && (
                  <View style={[styles.newBadge, { backgroundColor: colors.success }]}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </View>

              <View style={styles.hostelBody}>
                <Text style={[styles.hostelName, { color: colors.text }]}>{hostel.name}</Text>
                <Text style={[styles.hostelLocation, { color: colors.textSecondary }]}>
                  📍 {[hostel.directions, hostel.university].filter(Boolean).join(', ') || 'Location not set'}
                </Text>

                <View style={styles.hostelMetaRow}>
                  <View style={styles.hostelMetaItem}>
                    <Text style={[styles.hostelMetaLabel, { color: colors.textSecondary }]}>
                      PRICE
                    </Text>
                    <Text style={[styles.hostelPrice, { color: colors.primary }]}>
                      {formatPrice(hostel.price_min, hostel.price_max)}
                    </Text>
                  </View>
                  <View style={[styles.hostelMetaDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.hostelMetaItem}>
                    <Text style={[styles.hostelMetaLabel, { color: colors.textSecondary }]}>
                      SCOUT
                    </Text>
                    <Text style={[styles.hostelScout, { color: colors.text }]}>
                      {hostel.submitted_by_name || 'Unknown'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.auditButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push(`/(super-admin)/review-detail?id=${hostel.hostel_id}`)}
                >
                  <Text style={styles.auditButtonText}>Audit Hostel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
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
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backText: {
    fontSize: 24,
    fontWeight: '600',
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  notificationBadge: {
    marginTop: 4,
  },
  notificationText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
  },
  statsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconText: {
    fontSize: 24,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statHint: {
    fontSize: 12,
    marginTop: 2,
  },
  statCountBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statCountText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  hostelCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  hostelImageWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  hostelImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  hostelBody: {
    gap: 4,
  },
  hostelName: {
    fontSize: 17,
    fontWeight: '700',
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hostelLocation: {
    fontSize: 13,
    marginBottom: 8,
  },
  hostelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  hostelMetaItem: {
    flex: 1,
  },
  hostelMetaDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 12,
  },
  hostelMetaLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hostelPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  hostelScout: {
    fontSize: 14,
    fontWeight: '600',
  },
  auditButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  auditButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

