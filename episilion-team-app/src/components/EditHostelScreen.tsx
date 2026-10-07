import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useAppAlert } from '../../src/components/AppAlert';
import { Input } from '../../src/components/Input';
import {
  getHostelChanges,
  stageHostelChanges,
  type HostelChangeForm,
  type HostelChanges,
} from '../../src/api/hostels';

interface DraftForm {
  name: string;
  type: string;
  university: string;
  year_established: string;
  directions: string;
  distance_to_campus_in_minutes: string;
  latitude: string;
  longitude: string;
  manager_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  office_hours: string;
  website: string;
  price_min: string;
  price_max: string;
  utilities_fee: string;
  maintenance_fee: string;
  caution_deposit: string;
  refund_policy: string;
  rooms: string;
  perks: string;
  rules: string;
}

/** "Single - 1200" per line, matching how the add form takes room types. */
const serializeRooms = (rooms?: { type: string; price: number | null }[]) =>
  (rooms ?? [])
    .map((r) => `${r.type}${r.price !== null && r.price !== undefined ? ` - ${r.price}` : ''}`)
    .join('\n');

const parseRooms = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [type, price] = line.split('-').map((part) => part.trim());
      const parsed = price ? Number(price.replace(/[^\d.]/g, '')) : NaN;
      return { type, price: Number.isFinite(parsed) ? parsed : null };
    })
    .filter((r) => r.type);

const parseLines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const toDraft = (form: HostelChangeForm): DraftForm => {
  const v = form.values;
  const s = (x: unknown) => (x === null || x === undefined ? '' : String(x));
  return {
    name: s(v.name),
    type: s(v.type),
    university: s(v.university),
    year_established: s(v.year_established),
    directions: s(v.directions),
    distance_to_campus_in_minutes: s(v.distance_to_campus_in_minutes),
    latitude: s(v.latitude),
    longitude: s(v.longitude),
    manager_name: s(v.manager_name),
    phone: s(v.phone),
    whatsapp: s(v.whatsapp),
    email: s(v.email),
    office_hours: s(v.office_hours),
    website: s(v.website),
    price_min: s(v.price_min),
    price_max: s(v.price_max),
    utilities_fee: s(v.utilities_fee),
    maintenance_fee: s(v.maintenance_fee),
    caution_deposit: s(v.caution_deposit),
    refund_policy: s(v.refund_policy),
    rooms: serializeRooms(v.rooms),
    perks: (v.perks ?? []).join('\n'),
    rules: (v.rules ?? []).join('\n'),
  };
};

/** Only send fields that actually changed, so untouched columns stay put. */
function buildDiff(form: HostelChangeForm, draft: DraftForm): HostelChanges {
  const changes: HostelChanges = {};
  const v = form.values;

  const assign = (key: keyof HostelChanges, value: unknown) => {
    if (value !== undefined) (changes as Record<string, unknown>)[key] = value;
  };

  const text = (key: keyof DraftForm, live: unknown) => {
    const next = (draft[key] as string).trim();
    const liveText = live === null || live === undefined ? '' : String(live);
    return next === liveText ? undefined : next;
  };
  const number = (key: keyof DraftForm, live: unknown) => {
    const raw = (draft[key] as string).trim();
    const liveNum = live === null || live === undefined || live === '' ? null : Number(live);
    if (!raw) return liveNum === null ? undefined : null;
    const next = Number(raw.replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(next)) return undefined;
    return next === liveNum ? undefined : next;
  };

  assign('name', text('name', v.name));
  assign('type', text('type', v.type));
  assign('university', text('university', v.university));
  assign('year_established', number('year_established', v.year_established));
  assign('directions', text('directions', v.directions));
  assign('distance_to_campus_in_minutes', number('distance_to_campus_in_minutes', v.distance_to_campus_in_minutes));
  assign('latitude', number('latitude', v.latitude));
  assign('longitude', number('longitude', v.longitude));
  assign('manager_name', text('manager_name', v.manager_name));
  assign('phone', text('phone', v.phone));
  assign('whatsapp', text('whatsapp', v.whatsapp));
  assign('email', text('email', v.email));
  assign('office_hours', text('office_hours', v.office_hours));
  assign('website', text('website', v.website));
  assign('price_min', number('price_min', v.price_min));
  assign('price_max', number('price_max', v.price_max));
  assign('utilities_fee', number('utilities_fee', v.utilities_fee));
  assign('maintenance_fee', number('maintenance_fee', v.maintenance_fee));
  assign('caution_deposit', number('caution_deposit', v.caution_deposit));
  assign('refund_policy', text('refund_policy', v.refund_policy));

  if (draft.rooms.trim() && draft.rooms.trim() !== serializeRooms(v.rooms)) {
    changes.rooms = parseRooms(draft.rooms);
  }
  if (draft.perks.trim() && draft.perks.trim() !== (v.perks ?? []).join('\n')) {
    changes.perks = parseLines(draft.perks);
  }
  if (draft.rules.trim() && draft.rules.trim() !== (v.rules ?? []).join('\n')) {
    changes.rules = parseLines(draft.rules);
  }

  return changes;
}

export default function EditHostelScreen() {
  const colors = useThemeStore((state) => state.colors);
  const { alert } = useAppAlert();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [form, setForm] = useState<HostelChangeForm | null>(null);
  const [draft, setDraft] = useState<DraftForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError('No hostel selected.');
      setIsLoading(false);
      return;
    }
    try {
      setError('');
      const data = await getHostelChanges(String(id));
      setForm(data);
      setDraft(toDraft(data));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'You do not have permission to edit this hostel.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await load();
        if (!active) return;
      })();
      return () => {
        active = false;
      };
    }, [load]),
  );

  const set = (key: keyof DraftForm) => (value: string) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = async () => {
    if (!form || !draft || isSaving) return;

    if (!draft.name.trim()) {
      alert('Name required', 'The hostel name cannot be empty.');
      return;
    }

    const changes = buildDiff(form, draft);
    if (Object.keys(changes).length === 0) {
      alert('No changes', 'You have not changed anything yet.');
      return;
    }

    setIsSaving(true);
    try {
      await stageHostelChanges(form.hostel.hostel_id, changes);
      alert(
        'Sent for review',
        'Your changes were sent to the super admin. They are not live yet — you will see the outcome in My Submissions.',
        [
          {
            text: 'View My Submissions',
            onPress: () => router.replace('/(sub-admin)/submissions?filter=pending'),
          },
        ],
        { variant: 'success' },
      );
    } catch (err: any) {
      alert('Could not save', err?.response?.data?.message || err?.message || 'Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Loading the hostel...
          </Text>
        </View>
      );
    }

    if (error || !form || !draft) {
      return (
        <View style={styles.stateBox}>
          <Ionicons name="lock-closed-outline" size={44} color={colors.textTertiary} />
          <Text style={[styles.stateText, { color: colors.error }]}>
            {error || 'This hostel cannot be edited.'}
          </Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            You need an approved update request for this hostel before you can change it.
          </Text>
        </View>
      );
    }

    // A previous change set is still in the super admin's queue.
    if (form.staged) {
      return (
        <View style={styles.pendingWrap}>
          <View style={[styles.banner, { backgroundColor: colors.accent + '1F' }]}>
            <Ionicons name="time-outline" size={18} color={colors.accent} />
            <Text style={[styles.bannerText, { color: colors.accent }]}>
              Your changes are awaiting review. You cannot edit again until the super admin decides.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{form.hostel.name}</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Submitted changes</Text>
            {Object.entries(form.staged)
              .filter(([, value]) => value !== null && value !== undefined && value !== '')
              .map(([key, value]) => (
                <View key={key} style={styles.diffRow}>
                  <Text style={[styles.diffKey, { color: colors.textSecondary }]}>
                    {key.replace(/_/g, ' ')}
                  </Text>
                  <Text style={[styles.diffValue, { color: colors.text }]} numberOfLines={3}>
                    {Array.isArray(value)
                      ? value.map((v) => (typeof v === 'object' ? v.type : v)).join(', ')
                      : String(value)}
                  </Text>
                </View>
              ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(sub-admin)/submissions?filter=pending')}
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
          >
            <Ionicons name="documents-outline" size={18} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              View in My Submissions
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <View style={[styles.banner, { backgroundColor: colors.success + '1F' }]}>
          <Ionicons name="lock-open-outline" size={18} color={colors.success} />
          <Text style={[styles.bannerText, { color: colors.success }]}>
            Your request was approved. Edit the fields below — changes are sent to the super admin
            for review before going live.
          </Text>
        </View>

        <Text style={[styles.hostelName, { color: colors.text }]}>{form.hostel.name}</Text>
        <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
          Approved reason: “{form.request_reason}”
        </Text>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>HOSTEL</Text>
        <Input label="Name" placeholder="Hostel name" value={draft.name} onChangeText={set('name')} />
        <Input label="Type" placeholder="Hostel / Apartment" value={draft.type} onChangeText={set('type')} />
        <Input label="University" placeholder="University" value={draft.university} onChangeText={set('university')} />
        <Input
          label="Year established"
          placeholder="e.g. 2018"
          keyboardType="numeric"
          value={draft.year_established}
          onChangeText={set('year_established')}
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>LOCATION</Text>
        <Input label="Directions" placeholder="How to get there" value={draft.directions} onChangeText={set('directions')} />
        <Input
          label="Minutes to campus"
          placeholder="e.g. 10"
          keyboardType="numeric"
          value={draft.distance_to_campus_in_minutes}
          onChangeText={set('distance_to_campus_in_minutes')}
        />
        <Input label="Latitude" placeholder="e.g. 5.1234" keyboardType="numeric" value={draft.latitude} onChangeText={set('latitude')} />
        <Input label="Longitude" placeholder="e.g. -0.1234" keyboardType="numeric" value={draft.longitude} onChangeText={set('longitude')} />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>MANAGER CONTACT</Text>
        <Input label="Manager name" placeholder="Full name" value={draft.manager_name} onChangeText={set('manager_name')} />
        <Input label="Phone" placeholder="Phone number" keyboardType="numeric" value={draft.phone} onChangeText={set('phone')} />
        <Input label="WhatsApp" placeholder="WhatsApp number" keyboardType="numeric" value={draft.whatsapp} onChangeText={set('whatsapp')} />
        <Input label="Email" placeholder="Email" keyboardType="email-address" value={draft.email} onChangeText={set('email')} />
        <Input label="Office hours" placeholder="e.g. 8am to 6pm" value={draft.office_hours} onChangeText={set('office_hours')} />
        <Input label="Website" placeholder="https://" value={draft.website} onChangeText={set('website')} />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PRICING</Text>
        <Input label="Price from" placeholder="e.g. 1200" keyboardType="numeric" value={draft.price_min} onChangeText={set('price_min')} />
        <Input label="Price to" placeholder="e.g. 2500" keyboardType="numeric" value={draft.price_max} onChangeText={set('price_max')} />
        <Input label="Utilities fee" placeholder="e.g. 200" keyboardType="numeric" value={draft.utilities_fee} onChangeText={set('utilities_fee')} />
        <Input label="Maintenance fee" placeholder="e.g. 100" keyboardType="numeric" value={draft.maintenance_fee} onChangeText={set('maintenance_fee')} />
        <Input label="Caution deposit" placeholder="e.g. 500" keyboardType="numeric" value={draft.caution_deposit} onChangeText={set('caution_deposit')} />
        <Input label="Refund policy" placeholder="Refund policy" value={draft.refund_policy} onChangeText={set('refund_policy')} />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ROOMS</Text>
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          One room per line, formatted as: Room type - price
        </Text>
        <Input label="Room types" placeholder={'Single - 1200\nDouble - 2000'} value={draft.rooms} onChangeText={set('rooms')} />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PERKS & RULES</Text>
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          One per line. The first three perks appear on the listing card.
        </Text>
        <Input label="Perks" placeholder={'WiFi\nWater heater\nGym'} value={draft.perks} onChangeText={set('perks')} />
        <Input label="House rules" placeholder={'No smoking\nNo pets'} value={draft.rules} onChangeText={set('rules')} />

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleSave}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Send changes for review"
          accessibilityState={{ disabled: isSaving, busy: isSaving }}
          style={[styles.submitButton, { backgroundColor: colors.primary }, isSaving && styles.disabled]}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitText}>Send Changes for Review</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
          Nothing changes on the live listing until a super admin approves your edits.
        </Text>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Edit Hostel" subtitle="Changes need approval" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderBody()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 48 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  bannerText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  hostelName: { fontSize: 20, fontWeight: '700' },
  reasonText: { fontSize: 12.5, fontStyle: 'italic', marginTop: 6, lineHeight: 18 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 14,
    marginLeft: 4,
  },
  hint: { fontSize: 11.5, marginBottom: 8, marginLeft: 4, lineHeight: 16 },
  pendingWrap: { paddingTop: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: 2, marginBottom: 12 },
  diffRow: { marginBottom: 10 },
  diffKey: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  diffValue: { fontSize: 13.5, marginTop: 2, lineHeight: 19 },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '700' },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    marginTop: 16,
  },
  disabled: { opacity: 0.5 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  footerNote: { fontSize: 11.5, textAlign: 'center', marginTop: 12, lineHeight: 16 },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  stateText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
