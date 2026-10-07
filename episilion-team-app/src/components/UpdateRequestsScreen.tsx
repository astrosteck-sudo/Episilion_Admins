import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useThemeStore } from '../store/themeStore';
import { ScreenHeader } from './ScreenHeader';
import { useAppAlert } from './AppAlert';
import {
  listUpdateRequests,
  approveUpdateRequest,
  rejectUpdateRequest,
  approveStagedChanges,
  rejectStagedChanges,
  type UpdateRequest,
  type UpdateRequestStatus,
} from '../api/hostels';

const PLACEHOLDER_IMAGE = require('../../assets/episilion_logo.png');

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const STATUS_META: Record<
  UpdateRequestStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap; colorKey: 'accent' | 'success' | 'error' }
> = {
  pending: { label: 'Awaiting your decision', icon: 'time-outline', colorKey: 'accent' },
  approved: { label: 'Approved', icon: 'checkmark-circle-outline', colorKey: 'success' },
  rejected: { label: 'Rejected', icon: 'close-circle-outline', colorKey: 'error' },
};

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

export default function UpdateRequestsScreen() {
  const colors = useThemeStore((state) => state.colors);
  const { alert, prompt } = useAppAlert();

  const [requests, setRequests] = useState<UpdateRequest[]>([]);
  const [filter, setFilter] = useState<Filter>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async (status: Filter) => {
    try {
      setError('');
      const list = await listUpdateRequests(status);
      setRequests(list);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load update requests');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setIsLoading(true);
        await load(filter);
        if (active) setIsLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [load, filter]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load(filter);
    setIsRefreshing(false);
  }, [load, filter]);

  const changeFilter = (next: Filter) => {
    setFilter(next);
    setIsLoading(true);
    load(next).finally(() => setIsLoading(false));
  };

  const approve = (request: UpdateRequest) => {
    alert(
      'Approve this update?',
      `${request.requested_by_name || 'The sub admin'} will be able to edit "${request.hostel_name}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setBusyId(request.id);
            try {
              await approveUpdateRequest(request.id);
              await load(filter);
              alert('Request approved', 'The sub admin can now edit this hostel.', undefined, {
                variant: 'success',
              });
            } catch (err: any) {
              alert(
                'Could not approve',
                err?.response?.data?.message || err?.message || 'Please try again.',
              );
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
      { variant: 'question' },
    );
  };

  const reject = (request: UpdateRequest) => {
    prompt(
      'Reject this update?',
      'Tell the sub admin why this request was not approved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (value?: string) => {
            const reason = (value || '').trim();
            if (!reason) {
              alert('Reason required', 'Please explain why the request was rejected.');
              return;
            }
            setBusyId(request.id);
            try {
              await rejectUpdateRequest(request.id, reason);
              await load(filter);
            } catch (err: any) {
              alert(
                'Could not reject',
                err?.response?.data?.message || err?.message || 'Please try again.',
              );
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
      'e.g. Prices were already updated last month',
    );
  };

  /** Applies the sub admin's staged edits to the live listing. */
  const approveChanges = (request: UpdateRequest) => {
    alert(
      'Apply these changes?',
      `The edits to "${request.hostel_name}" will go live immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply Changes',
          onPress: async () => {
            setBusyId(request.id);
            try {
              const result = await approveStagedChanges(request.id);
              await load(filter);
              alert(
                'Changes applied',
                result?.applied?.length
                  ? `Updated: ${result.applied.join(', ')}`
                  : 'The listing was updated.',
                undefined,
                { variant: 'success' },
              );
            } catch (err: any) {
              alert(
                'Could not apply',
                err?.response?.data?.message || err?.message || 'Please try again.',
              );
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
      { variant: 'question' },
    );
  };

  /** Drops the staged edits; the live listing keeps its current values. */
  const rejectChanges = (request: UpdateRequest) => {
    prompt(
      'Reject these changes?',
      'The listing will keep its current values. Tell the sub admin why.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Changes',
          style: 'destructive',
          onPress: async (value?: string) => {
            const reason = (value || '').trim();
            if (!reason) {
              alert('Reason required', 'Please explain why the changes were rejected.');
              return;
            }
            setBusyId(request.id);
            try {
              await rejectStagedChanges(request.id, reason);
              await load(filter);
            } catch (err: any) {
              alert(
                'Could not reject',
                err?.response?.data?.message || err?.message || 'Please try again.',
              );
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
      'e.g. The new price does not match the manager contract',
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Update Requests" subtitle="Approve or reject edits" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.filters}>
          {FILTERS.map((item) => {
            const isActive = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => changeFilter(item.key)}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: isActive ? colors.primary : colors.inputBackground,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.filterText, { color: isActive ? '#FFFFFF' : colors.text }]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              Loading update requests...
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
        ) : requests.length === 0 ? (
          <View style={styles.stateBox}>
            <Ionicons name="file-tray-outline" size={32} color={colors.textTertiary} />
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              No {filter === 'all' ? '' : filter} update requests.
            </Text>
          </View>
        ) : (
          requests.map((request) => {
            const meta = STATUS_META[request.status];
            const isBusy = busyId === request.id;
            return (
              <View
                key={request.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardHeader}>
                  <Image
                    source={request.main_image ? { uri: request.main_image } : PLACEHOLDER_IMAGE}
                    style={styles.thumb}
                  />
                  <View style={styles.cardHeaderText}>
                    <Text style={[styles.hostelName, { color: colors.text }]} numberOfLines={1}>
                      {request.hostel_name}
                    </Text>
                    <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                      {request.requested_by_name || 'Team member'} • {timeAgo(request.created_at)}
                    </Text>
                  </View>
                  <View
                    style={[styles.statusPill, { backgroundColor: colors[meta.colorKey] + '1F' }]}
                  >
                    <Ionicons name={meta.icon} size={12} color={colors[meta.colorKey]} />
                    <Text style={[styles.statusPillText, { color: colors[meta.colorKey] }]}>
                      {request.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={[styles.reasonBox, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.reasonLabel, { color: colors.textSecondary }]}>
                    REASON FOR UPDATE
                  </Text>
                  <Text style={[styles.reasonText, { color: colors.text }]}>{request.reason}</Text>
                </View>

                {/* Edits the sub admin submitted after the request was approved. */}
                {request.has_staged_changes ? (
                  <View style={[styles.stagedBox, { borderColor: colors.accent }]}>
                    <View style={styles.stagedHeader}>
                      <Ionicons name="create-outline" size={14} color={colors.accent} />
                      <Text style={[styles.stagedTitle, { color: colors.accent }]}>
                        EDITS AWAITING YOUR REVIEW
                      </Text>
                    </View>
                    <Text style={[styles.stagedHint, { color: colors.textSecondary }]}>
                      These changes are not live yet. Applying them updates the listing
                      immediately.
                    </Text>
                  </View>
                ) : null}

                {request.decision_note ? (
                  <Text style={[styles.decisionNote, { color: colors.textSecondary }]}>
                    Your note: {request.decision_note}
                  </Text>
                ) : null}

                {request.has_staged_changes ? (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isBusy}
                      onPress={() => rejectChanges(request)}
                      style={[
                        styles.rejectButton,
                        { borderColor: colors.error, opacity: isBusy ? 0.5 : 1 },
                      ]}
                    >
                      <Ionicons name="close" size={18} color={colors.error} />
                      <Text style={[styles.rejectText, { color: colors.error }]}>
                        Reject Changes
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isBusy}
                      onPress={() => approveChanges(request)}
                      style={[
                        styles.approveButton,
                        { backgroundColor: colors.success, opacity: isBusy ? 0.5 : 1 },
                      ]}
                    >
                      {isBusy ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                          <Text style={styles.approveText}>Apply Changes</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : request.status === 'pending' ? (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isBusy}
                      onPress={() => reject(request)}
                      style={[
                        styles.rejectButton,
                        { borderColor: colors.error, opacity: isBusy ? 0.5 : 1 },
                      ]}
                    >
                      <Ionicons name="close" size={18} color={colors.error} />
                      <Text style={[styles.rejectText, { color: colors.error }]}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isBusy}
                      onPress={() => approve(request)}
                      style={[
                        styles.approveButton,
                        { backgroundColor: colors.success, opacity: isBusy ? 0.5 : 1 },
                      ]}
                    >
                      {isBusy ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                          <Text style={styles.approveText}>Approve Update</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  cardHeaderText: {
    flex: 1,
  },
  hostelName: {
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  reasonBox: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  decisionNote: {
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
  stagedBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 12,
    marginTop: 12,
  },
  stagedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stagedTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  stagedHint: {
    fontSize: 11.5,
    marginTop: 6,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 18,
  },
  rejectText: {
    fontSize: 14,
    fontWeight: '700',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 12,
  },
  approveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stateBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  stateText: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
