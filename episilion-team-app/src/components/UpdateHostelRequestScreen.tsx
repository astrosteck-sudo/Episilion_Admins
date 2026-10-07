import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useAppAlert } from '../../src/components/AppAlert';
import {
  listUpdateCandidates,
  createUpdateRequest,
  type HostelLookupMatch,
} from '../../src/api/hostels';

const REASON_MAX = 500;

const STATUS_META: Record<
  'pending' | 'approved' | 'rejected',
  { label: string; icon: keyof typeof Ionicons.glyphMap; colorKey: 'accent' | 'success' | 'error' }
> = {
  pending: { label: 'Awaiting super admin review', icon: 'time-outline', colorKey: 'accent' },
  approved: { label: 'Approved — you can now edit this hostel', icon: 'checkmark-circle-outline', colorKey: 'success' },
  rejected: { label: 'Not approved', icon: 'close-circle-outline', colorKey: 'error' },
};

export default function UpdateHostelScreen() {
  const colors = useThemeStore((state) => state.colors);
  const { alert } = useAppAlert();

  const [hostels, setHostels] = useState<HostelLookupMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  /** Optional filter over the loaded list. */
  const [query, setQuery] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadHostels = useCallback(async () => {
    try {
      setLoadError('');
      setHostels(await listUpdateCandidates());
    } catch (err: any) {
      setLoadError(err?.response?.data?.message || err?.message || 'Failed to load hostels');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload on focus so request states are fresh after a super admin decides.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await loadHostels();
        if (!active) return;
      })();
      return () => {
        active = false;
      };
    }, [loadHostels]),
  );

  const handleSubmit = async () => {
    if (isSubmitting || !selectedId) return;

    if (!reason.trim()) {
      alert('Add a reason', 'Tell the super admin why this hostel needs an update.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUpdateRequest(selectedId, reason.trim());
      setReason('');
      await loadHostels();
      alert(
        'Request sent',
        'Your update request is now with the super admin. You will be able to edit the hostel once it is approved.',
        undefined,
        { variant: 'success' },
      );
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Could not send the update request.';
      alert('Request failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const needle = query.trim().toLowerCase();
  const visibleHostels = needle
    ? hostels.filter((h) => h.name.toLowerCase().includes(needle))
    : hostels;

  const selectedMatch = hostels.find((h) => h.hostel_id === selectedId) || null;
  const requestState = selectedMatch?.request_state ?? null;
  const existing = requestState === 'pending_other' ? null : selectedMatch?.latest_request ?? null;
  // Another admin's request is already in the queue, so ours would be a duplicate.
  const isBlockedByOther = requestState === 'pending_other';
  const isLocked = requestState === 'pending';
  const isUnlocked = requestState === 'approved';
  const canSubmit =
    Boolean(selectedId) &&
    reason.trim().length > 0 &&
    !isSubmitting &&
    !isLocked &&
    !isBlockedByOther;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Update Hostel" subtitle="Request an update" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.notice, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              Hostel details cannot be edited directly. Pick the hostel, explain why it needs an
              update, and a super admin will approve or reject the request.
            </Text>
          </View>

          {/* Step 1 — choose the hostel */}
          <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
            1. WHICH HOSTEL?
          </Text>

          {isLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>
                Loading hostels...
              </Text>
            </View>
          ) : loadError ? (
            <View style={styles.stateBox}>
              <Text style={[styles.stateText, { color: colors.error }]}>{loadError}</Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setIsLoading(true);
                  loadHostels();
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : hostels.length === 0 ? (
            <View style={styles.stateBox}>
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>
                No hostels are available to update right now.
              </Text>
            </View>
          ) : (
            <>
              {/* Optional filter for long lists. */}
              <View
                style={[
                  styles.searchRow,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border },
                ]}
              >
                <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Filter hostels by name"
                  placeholderTextColor={colors.placeholder}
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {query.length > 0 ? (
                  <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {visibleHostels.length === 0 ? (
                <View
                  style={[
                    styles.emptyCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No hostel matches “{query.trim()}”.
                  </Text>
                </View>
              ) : (
                <View style={styles.hostelList}>
                  <Text style={[styles.matchHint, { color: colors.textSecondary }]}>
                    {visibleHostels.length} hostel{visibleHostels.length === 1 ? '' : 's'}
                  </Text>

                  {visibleHostels.map((match) => {
                    const isSelected = match.hostel_id === selectedId;
                    const busy = match.request_state === 'pending_other';
                    return (
                      <TouchableOpacity
                        key={match.hostel_id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedId(isSelected ? null : match.hostel_id)}
                        style={[
                          styles.hostelOption,
                          {
                            backgroundColor: isSelected ? colors.primary + '14' : colors.card,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.radio,
                            { borderColor: isSelected ? colors.primary : colors.border },
                          ]}
                        >
                          {isSelected ? (
                            <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                          ) : null}
                        </View>

                        <View style={styles.hostelOptionText}>
                          <Text style={[styles.hostelName, { color: colors.text }]} numberOfLines={1}>
                            {match.name}
                          </Text>
                          <Text
                            style={[styles.hostelMeta, { color: colors.textSecondary }]}
                            numberOfLines={1}
                          >
                            {match.university || 'University not set'}
                          </Text>
                        </View>

                        {match.request_state ? (
                          <View
                            style={[
                              styles.badge,
                              {
                                backgroundColor:
                                  colors[
                                    busy
                                      ? 'textTertiary'
                                      : match.request_state === 'pending'
                                        ? 'accent'
                                        : match.request_state === 'approved'
                                          ? 'success'
                                          : 'error'
                                  ] + '22',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                {
                                  color:
                                    colors[
                                      busy
                                        ? 'textSecondary'
                                        : match.request_state === 'pending'
                                          ? 'accent'
                                          : match.request_state === 'approved'
                                            ? 'success'
                                            : 'error'
                                    ],
                                },
                              ]}
                            >
                              {busy
                                ? 'Taken'
                                : match.request_state === 'pending'
                                  ? 'Pending'
                                  : match.request_state === 'approved'
                                    ? 'Approved'
                                    : 'Rejected'}
                            </Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {/* Step 2 — the reason */}
          <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
            2. WHY DOES IT NEED AN UPDATE?
          </Text>

          <View
            style={[
              styles.reasonWrapper,
              { backgroundColor: colors.inputBackground, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.reasonInput, { color: colors.text }]}
              placeholder="e.g. The room prices changed for the new semester and the manager's phone number is out of date."
              placeholderTextColor={colors.placeholder}
              value={reason}
              onChangeText={(text) => setReason(text.slice(0, REASON_MAX))}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!isLocked}
            />
            <Text style={[styles.counter, { color: colors.textSecondary }]}>
              {reason.length}/{REASON_MAX}
            </Text>
          </View>

          {/* Existing request state */}
          {existing ? (
            <View
              style={[
                styles.statusCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors[STATUS_META[existing.status].colorKey],
                },
              ]}
            >
              <View style={styles.statusHeader}>
                <Ionicons
                  name={STATUS_META[existing.status].icon}
                  size={18}
                  color={colors[STATUS_META[existing.status].colorKey]}
                />
                <Text
                  style={[
                    styles.statusTitle,
                    { color: colors[STATUS_META[existing.status].colorKey] },
                  ]}
                >
                  {STATUS_META[existing.status].label}
                </Text>
              </View>

              <Text style={[styles.statusReason, { color: colors.textSecondary }]}>
                “{existing.reason}”
              </Text>

              {existing.decision_note ? (
                <Text style={[styles.statusNote, { color: colors.textSecondary }]}>
                  Super admin: {existing.decision_note}
                </Text>
              ) : null}

              {isUnlocked ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(`/(sub-admin)/edit-hostel?id=${existing.hostel_id}`)
                  }
                  style={[styles.unlockButton, { backgroundColor: colors.success }]}
                >
                  <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.unlockButtonText}>Edit Hostel Details</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!canSubmit}
            onPress={handleSubmit}
            accessibilityRole="button"
            accessibilityLabel="Send update request"
            accessibilityState={{ disabled: !canSubmit, busy: isSubmitting }}
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              !canSubmit && styles.submitButtonDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Send Request for Approval</Text>
              </>
            )}
          </TouchableOpacity>

          {isBlockedByOther ? (
            <View
              style={[styles.blockedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.blockedText, { color: colors.textSecondary }]}>
                Another admin already has a pending update request for {selectedMatch?.name}. Wait
                for the super admin to decide it before sending another.
              </Text>
            </View>
          ) : selectedMatch && isLocked ? (
            <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
              {selectedMatch.name} already has a request awaiting review.
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 14,
    marginBottom: 24,
  },
  emptyText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  matchHint: {
    fontSize: 12,
    marginBottom: 2,
    marginLeft: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  hostelList: {
    gap: 10,
    marginBottom: 24,
  },
  hostelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  hostelOptionText: {
    flex: 1,
  },
  hostelName: {
    fontSize: 15,
    fontWeight: '600',
  },
  hostelMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  reasonWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  reasonInput: {
    fontSize: 14,
    minHeight: 110,
    lineHeight: 20,
  },
  counter: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
  },
  statusCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusReason: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 19,
  },
  statusNote: {
    fontSize: 12,
    marginTop: 8,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
    marginTop: 14,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  blockedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
  },
  blockedText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  stateBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 28,
    marginBottom: 12,
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