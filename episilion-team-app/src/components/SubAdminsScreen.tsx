import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { useFocusEffect } from 'expo-router';
import { Button } from './Button';
import { Input } from './Input';
import { ScreenHeader } from './ScreenHeader';
import { useThemeStore } from '../store/themeStore';
import { createSubAdmin, listSubAdmins, type SubAdmin } from '../api/subAdmins';

const MIN_PASSWORD_LENGTH = 8;

function getErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || 'Request failed';
  }
  return error instanceof Error ? error.message : 'Request failed';
}

function formatLastLogin(value: string | null) {
  if (!value) return 'Never logged in';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function SubAdminsScreen() {
  const colors = useThemeStore((state) => state.colors);
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadSubAdmins = useCallback(async () => {
    setLoadError('');
    try {
      setSubAdmins(await listSubAdmins());
    } catch (error) {
      setLoadError(getErrorMessage(error));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setIsLoading(true);
      void listSubAdmins()
        .then((users) => {
          if (active) {
            setSubAdmins(users);
            setLoadError('');
          }
        })
        .catch((error: unknown) => {
          if (active) setLoadError(getErrorMessage(error));
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadSubAdmins();
    setIsRefreshing(false);
  }, [loadSubAdmins]);

  const handleCreate = async () => {
    setFormError('');
    setSuccessMessage('');
    if (!fullName.trim() || !email.trim() || !password) {
      setFormError('Enter the sub-admin’s name, email, and sign-in password.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`The sign-in password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsCreating(true);
    try {
      const created = await createSubAdmin(fullName.trim(), email.trim(), password);
      setSubAdmins((current) =>
        [...current, created].sort((a, b) => a.full_name.localeCompare(b.full_name)),
      );
      setFullName('');
      setEmail('');
      setPassword('');
      setSuccessMessage(`${created.full_name} can now sign in with the password you set.`);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Sub-admins"
        subtitle="Manage team access"
        fallbackHref="/(super-admin)"
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeading}>
            <View style={[styles.headingIcon, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="person-add-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.headingText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Add a sub-admin</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Set their account details and initial sign-in password.
              </Text>
            </View>
          </View>

          <Input
            label="Full name"
            placeholder="Enter full name"
            value={fullName}
            onChangeText={setFullName}
          />
          <Input
            label="Email address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Input
            label="Initial sign-in password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightAction={
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            }
            onRightActionPress={() => setShowPassword((visible) => !visible)}
          />
          <Text style={[styles.passwordHint, { color: colors.textSecondary }]}>
            Use at least 8 characters. The sub-admin can change this later in Security settings.
          </Text>
          {formError ? (
            <Text accessibilityRole="alert" style={[styles.message, { color: colors.error }]}>
              {formError}
            </Text>
          ) : null}
          {successMessage ? (
            <Text style={[styles.message, { color: colors.success }]}>{successMessage}</Text>
          ) : null}
          <Button
            title="Create sub-admin"
            onPress={handleCreate}
            loading={isCreating}
            disabled={isCreating}
            icon={<Ionicons name="person-add-outline" size={18} color="#FFFFFF" />}
          />
        </View>

        <View style={styles.listHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Team members</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {subAdmins.length} {subAdmins.length === 1 ? 'sub-admin' : 'sub-admins'}
            </Text>
          </View>
          <Ionicons name="people-outline" size={22} color={colors.primary} />
        </View>

        {isLoading ? (
          <View style={styles.state}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              Loading sub-admins...
            </Text>
          </View>
        ) : loadError ? (
          <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="alert-circle-outline" size={26} color={colors.error} />
            <Text style={[styles.stateText, { color: colors.error }]}>{loadError}</Text>
            <Button title="Try again" variant="outline" onPress={loadSubAdmins} />
          </View>
        ) : subAdmins.length === 0 ? (
          <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="people-outline" size={28} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No sub-admins yet</Text>
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              Create the first account using the form above.
            </Text>
          </View>
        ) : (
          subAdmins.map((member) => (
            <View
              key={member.id}
              style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {member.full_name.trim().charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberDetails}>
                <View style={styles.memberTopLine}>
                  <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
                    {member.full_name}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          member.status === 'active'
                            ? `${colors.success}1A`
                            : `${colors.error}1A`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: member.status === 'active' ? colors.success : colors.error },
                      ]}
                    >
                      {member.status === 'active' ? 'Active' : 'Suspended'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.memberEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                  {member.email}
                </Text>
                <View style={styles.lastLogin}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.lastLoginText, { color: colors.textSecondary }]}>
                    Last login: {formatLastLogin(member.last_login_at)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 20 },
  card: { borderWidth: 1, borderRadius: 16, padding: 18 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headingIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headingText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  description: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  passwordHint: { fontSize: 12, lineHeight: 18, marginTop: -10, marginBottom: 14 },
  message: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  state: { alignItems: 'center', paddingVertical: 28, gap: 12 },
  stateCard: { alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 22, gap: 10 },
  stateText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  memberCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700' },
  memberDetails: { flex: 1 },
  memberTopLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { flex: 1, fontSize: 15, fontWeight: '600' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  memberEmail: { fontSize: 13, marginTop: 3 },
  lastLogin: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  lastLoginText: { flexShrink: 1, fontSize: 11 },
});
