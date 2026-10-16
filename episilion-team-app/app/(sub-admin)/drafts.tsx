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
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { useAppAlert } from '../../src/components/AppAlert';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { deleteDraft, listDrafts, type HostelDraft } from '../../src/utils/draftStore';

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

/** How much of the form is filled in, so an unfinished draft is obvious at a glance. */
const progressOf = (draft: HostelDraft) => {
  const steps = [
    Boolean(draft.hostelName.trim()),
    Boolean(draft.latitude.trim() && draft.longitude.trim()),
    draft.roomTypes.some((room) => room.type.trim()),
    draft.selectedAmenities.length > 0,
    Boolean(draft.managerName.trim() && draft.phoneNumber.trim()),
    Boolean(draft.photo),
  ];
  return steps.filter(Boolean).length;
};

export default function DraftsScreen() {
  const colors = useThemeStore((state) => state.colors);
  const user = useAuthStore((state) => state.user);
  const { alert } = useAppAlert();
  const [drafts, setDrafts] = useState<HostelDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setDrafts([]);
      return;
    }
    setDrafts(await listDrafts(user.id));
  }, [user]);

  // Reload on focus so a draft saved on the form shows up on the way back.
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

  const confirmDelete = (draft: HostelDraft) => {
    alert(
      'Delete draft?',
      `"${draft.hostelName.trim() || 'Untitled hostel'}" and its photo will be removed from this device.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDraft(draft.id);
            await load();
          },
        },
      ],
    );
  };

  const renderDraft = (draft: HostelDraft) => {
    const completed = progressOf(draft);
    const title = draft.hostelName.trim() || 'Untitled hostel';

    return (
      <View
        key={draft.id}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.cardTop}>
          {/* The pressable area and the delete button are siblings: nesting one
              button inside another is invalid HTML on web. */}
          <TouchableOpacity
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Continue draft ${title}`}
            style={styles.cardMain}
            onPress={() => router.push(`/(sub-admin)/add-hostel?draftId=${draft.id}`)}
          >
            {draft.photo ? (
              <Image source={{ uri: draft.photo }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty, { backgroundColor: colors.inputBackground }]}>
                <Ionicons name="image-outline" size={20} color={colors.textTertiary} />
              </View>
            )}

            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                Saved {timeAgo(draft.savedAt)}
              </Text>
              <View style={styles.progressRow}>
                <View style={[styles.progressTrack, { backgroundColor: colors.inputBackground }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: colors.primary, width: `${(completed / 6) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                  {completed}/6
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => confirmDelete(draft)}
            accessibilityRole="button"
            accessibilityLabel={`Delete draft ${title}`}
            hitSlop={8}
            style={[styles.deleteButton, { backgroundColor: colors.inputBackground }]}
          >
            <Ionicons name="trash-outline" size={17} color={colors.error} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Continue editing ${title}`}
          style={[styles.continueRow, { borderTopColor: colors.divider }]}
          onPress={() => router.push(`/(sub-admin)/add-hostel?draftId=${draft.id}`)}
        >
          <Ionicons name="create-outline" size={15} color={colors.primary} />
          <Text style={[styles.continueText, { color: colors.primary }]}>
            Continue editing
          </Text>
          <Ionicons name="arrow-forward" size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="My Drafts" subtitle="Saved on this device" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : drafts.length === 0 ? (
          <View style={styles.stateBox}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.inputBackground }]}>
              <Ionicons name="bookmark-outline" size={26} color={colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No drafts yet</Text>
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              Start adding a hostel and tap &quot;Save as Draft&quot; to finish it later.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.replace('/(sub-admin)/add-hostel')}
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Add a hostel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.count, { color: colors.textSecondary }]}>
              {drafts.length} draft{drafts.length === 1 ? '' : 's'} waiting to be finished
            </Text>
            {drafts.map(renderDraft)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  count: { fontSize: 12.5, marginBottom: 12 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 11.5 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { fontSize: 10.5, fontWeight: '600' },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  continueText: { fontSize: 12.5, fontWeight: '700' },
  stateBox: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyHint: { fontSize: 12.5, textAlign: 'center', lineHeight: 18, paddingHorizontal: 24 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 12,
    marginTop: 6,
  },
  emptyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
