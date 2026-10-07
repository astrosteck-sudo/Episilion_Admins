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
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/store/themeStore';
import {
  listHostels,
  listUpdateRequests,
  type HostelListItem,
  type HostelStatus,
  type UpdateRequest,
  type UpdateRequestStatus,
} from '../../src/api/hostels';

const PLACEHOLDER_IMAGE = require('../../assets/episilion_logo.png');

type Filter = 'all' | HostelStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_META: Record<HostelStatus, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { label: 'Awaiting verification', icon: 'time-outline' },
  approved: { label: 'Live on the site', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Not approved', icon: 'close-circle-outline' },
};

/** A sub admin's request to change an existing hostel. */
const REQUEST_META: Record<
  UpdateRequestStatus,
  { label: string; hint: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: { label: 'PENDING', hint: 'Awaiting super admin review', icon: 'time-outline' },
  approved: { label: 'APPROVED', hint: 'You can now edit this hostel', icon: 'checkmark-circle-outline' },
  rejected: { label: 'REJECTED', hint: 'Update not approved', icon: 'close-circle-outline' },
};

const formatPrice = (min: number | null, max: number | null) => {
  if (min === null && max === null) return 'No pricing yet';
  if (min !== null && max !== null && min !== max) {
    return `₵ ${min.toLocaleString()} - ${max.toLocaleString()}`;
  }
  return `₵ ${(min ?? max)!.toLocaleString()}`;
};

const formatDate = (iso: string | null) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function SubmissionsScreen() {
  const colors = useThemeStore((state) => state.colors);
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>();
  const [hostels, setHostels] = useState<HostelListItem[]>([]);
  const [requests, setRequests] = useState<UpdateRequest[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Reset to the requested filter each time the screen is opened from a stat card.
  useFocusEffect(
    useCallback(() => {
      if (filterParam === 'pending' || filterParam === 'approved' || filterParam === 'rejected' || filterParam === 'all') {
        setFilter(filterParam);
      }
    }, [filterParam]),
  );

  const load = useCallback(async () => {
    try {
      setError('');
      const [submissions, updateRequests] = await Promise.all([
        listHostels('all'),
        // A failed request list should not hide the submissions.
        listUpdateRequests('all').catch(() => [] as UpdateRequest[]),
      ]);
      setHostels(submissions);
      setRequests(updateRequests);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load your submissions');
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

  const statusColor = (status: HostelStatus) => {
    if (status === 'approved') return colors.success;
    if (status === 'rejected') return colors.error;
    return colors.accent;
  };

  const requestColor = (status: UpdateRequestStatus) => {
    if (status === 'approved') return colors.success;
    if (status === 'rejected') return colors.error;
    return colors.accent;
  };

  const visibleHostels = filter === 'all' ? hostels : hostels.filter((h) => h.status === filter);
  const visibleRequests = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  // "Pending" counts both new submissions and requested updates.
  const counts = {
    all: hostels.length + requests.length,
    pending:
      hostels.filter((h) => h.status === 'pending').length +
      requests.filter((r) => r.status === 'pending').length,
    approved:
      hostels.filter((h) => h.status === 'approved').length +
      requests.filter((r) => r.status === 'approved').length,
    rejected:
      hostels.filter((h) => h.status === 'rejected').length +
      requests.filter((r) => r.status === 'rejected').length,
  };

  const hasNothing = visibleHostels.length === 0 && visibleRequests.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Submissions</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Track the hostels you have submitted and their review status.
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersGrid}>
        {FILTERS.map((item) => {
          const isActive = filter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              onPress={() => setFilter(item.key)}
              style={[
                styles.filterCard,
                {
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterCount,
                  { color: isActive ? '#FFFFFF' : colors.text },
                ]}
              >
                {counts[item.key]}
              </Text>
              <Text
                style={[
                  styles.filterLabel,
                  { color: isActive ? 'rgba(255,255,255,0.85)' : colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              Loading your submissions...
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
        ) : hasNothing ? (
          <View style={styles.stateBox}>
            <Ionicons name="document-text-outline" size={44} color={colors.textTertiary} />
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              {filter === 'all'
                ? "You haven't submitted any hostels yet."
                : `No ${filter} submissions.`}
            </Text>
          </View>
        ) : (
          <>
            {/* Hostels this sub admin submitted, plus the ones requested for update. */}
            {visibleRequests.length > 0 ? (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  REQUESTED UPDATES
                </Text>
                {visibleRequests.map((request) => (
                  <View
                    key={`request-${request.id}`}
                    style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.cardTop}>
                      <Image
                        source={
                          request.main_image ? { uri: request.main_image } : PLACEHOLDER_IMAGE
                        }
                        style={styles.thumbnail}
                      />
                      <View style={styles.cardInfo}>
                        <Text style={[styles.hostelName, { color: colors.text }]} numberOfLines={2}>
                          {request.hostel_name}
                        </Text>
                        <Text
                          style={[styles.hostelLocation, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          Requested an update
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.statusRow, { borderTopColor: colors.divider }]}>
                      <View
                        style={[styles.statusBadge, { backgroundColor: requestColor(request.status) }]}
                      >
                        <Ionicons
                          name={REQUEST_META[request.status].icon}
                          size={13}
                          color="#FFFFFF"
                        />
                        <Text style={styles.statusBadgeText}>
                          {REQUEST_META[request.status].label}
                        </Text>
                      </View>
                      <Text style={[styles.statusHint, { color: colors.textSecondary }]}>
                        {REQUEST_META[request.status].hint}
                      </Text>
                    </View>

                    <View style={[styles.reasonBox, { backgroundColor: colors.inputBackground }]}>
                      <Text style={[styles.reasonLabel, { color: colors.primary }]}>
                        YOUR REASON
                      </Text>
                      <Text style={[styles.reasonText, { color: colors.text }]}>
                        {request.reason}
                      </Text>
                    </View>

                    {request.decision_note ? (
                      <View style={[styles.reasonBox, { backgroundColor: colors.inputBackground }]}>
                        <Text style={[styles.reasonLabel, { color: colors.textSecondary }]}>
                          SUPER ADMIN
                        </Text>
                        <Text style={[styles.reasonText, { color: colors.text }]}>
                          {request.decision_note}
                        </Text>
                      </View>
                    ) : null}

                    {request.status === 'approved' ? (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                          router.push(`/(sub-admin)/edit-hostel?id=${request.hostel_id}`)
                        }
                        style={[styles.editButton, { backgroundColor: colors.success }]}
                      >
                        <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.editButtonText}>Edit Hostel Details</Text>
                      </TouchableOpacity>
                    ) : null}

                    <View style={styles.metaRow}>
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        Requested {formatDate(request.created_at)}
                      </Text>
                      {request.reviewed_at ? (
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          Reviewed {formatDate(request.reviewed_at)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            {visibleHostels.length > 0 ? (
              <>
                {visibleRequests.length > 0 ? (
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    HOSTELS SUBMITTED
                  </Text>
                ) : null}
                {visibleHostels.map((hostel) => (
            <View
              key={hostel.hostel_id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.cardTop}>
                <Image
                  source={hostel.main_image ? { uri: hostel.main_image } : PLACEHOLDER_IMAGE}
                  style={styles.thumbnail}
                />
                <View style={styles.cardInfo}>
                  <Text style={[styles.hostelName, { color: colors.text }]} numberOfLines={2}>
                    {hostel.name}
                  </Text>
                  <Text style={[styles.hostelLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                    📍 {[hostel.directions, hostel.university].filter(Boolean).join(', ') || 'Location not set'}
                  </Text>
                  <Text style={[styles.hostelPrice, { color: colors.primary }]}>
                    {formatPrice(hostel.price_min, hostel.price_max)}
                  </Text>
                </View>
              </View>

              <View style={[styles.statusRow, { borderTopColor: colors.divider }]}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(hostel.status) }]}>
                  <Ionicons name={STATUS_META[hostel.status].icon} size={13} color="#FFFFFF" />
                  <Text style={styles.statusBadgeText}>{hostel.status.toUpperCase()}</Text>
                </View>
                <Text style={[styles.statusHint, { color: colors.textSecondary }]}>
                  {STATUS_META[hostel.status].label}
                </Text>
              </View>

              {hostel.status === 'rejected' && hostel.rejection_reason ? (
                <View style={[styles.reasonBox, { backgroundColor: colors.inputBackground }]}>
                  <Text style={[styles.reasonLabel, { color: colors.error }]}>REASON</Text>
                  <Text style={[styles.reasonText, { color: colors.text }]}>
                    {hostel.rejection_reason}
                  </Text>
                </View>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  Submitted {formatDate(hostel.created_at)}
                </Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {hostel.room_count} room {hostel.room_count === 1 ? 'type' : 'types'} •{' '}
                  {hostel.photo_count} {hostel.photo_count === 1 ? 'photo' : 'photos'}
                </Text>
              </View>
            </View>
          ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
    marginLeft: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
    marginTop: 12,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  filterCard: {
    flexGrow: 1,
    flexBasis: '45%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
  filterCount: {
    fontSize: 22,
    fontWeight: '700',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 76,
    height: 76,
    borderRadius: 12,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  hostelName: {
    fontSize: 16,
    fontWeight: '700',
  },
  hostelLocation: {
    fontSize: 12,
  },
  hostelPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  statusHint: {
    fontSize: 12,
    flex: 1,
  },
  reasonBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    gap: 3,
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metaText: {
    fontSize: 11,
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
