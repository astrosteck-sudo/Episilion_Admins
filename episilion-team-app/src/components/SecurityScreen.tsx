import React, { useState } from 'react';
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
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { changePasswordRequest } from '../api/auth';
import { useAppAlert } from './AppAlert';
import { ScreenHeader } from './ScreenHeader';
import { Input } from './Input';

const MIN_PASSWORD_LENGTH = 8;

export default function SecurityScreen() {
  const colors = useThemeStore((state) => state.colors);
  const role = useAuthStore((state) => state.role);
  const { alert } = useAppAlert();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== newPassword
      ? 'Passwords do not match'
      : '';

  const newPasswordError =
    newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH
      ? `Must be at least ${MIN_PASSWORD_LENGTH} characters`
      : '';

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    confirmPassword === newPassword &&
    !isSaving;

  const resetFields = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async () => {
    if (isSaving) return;

    if (!currentPassword) {
      alert('Missing details', 'Please enter your current password.');
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      alert(
        'Password too short',
        `Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match', 'Please re-enter your new password to confirm.');
      return;
    }

    if (newPassword === currentPassword) {
      alert('Choose a new password', 'Your new password must differ from the current one.');
      return;
    }

    setIsSaving(true);
    try {
      await changePasswordRequest(currentPassword, newPassword);
      resetFields();
      alert('Password updated', 'Your password has been changed successfully.', undefined, {
        variant: 'success',
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Could not update your password. Please try again.';
      alert('Update failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  const eyeAction = (
    <Ionicons
      name={showPasswords ? 'eye-off-outline' : 'eye-outline'}
      size={18}
      color={colors.textSecondary}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Security"
        subtitle="Change your password"
        fallbackHref={role === 'super_admin' ? '/(super-admin)/settings' : '/(sub-admin)/settings'}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.secondary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Change Password</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Confirm your current password, then choose a new one.
                </Text>
              </View>
            </View>

            <Input
              label="Current password"
              placeholder="Enter your current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showPasswords}
              rightAction={eyeAction}
              onRightActionPress={() => setShowPasswords((prev) => !prev)}
            />

            <Input
              label="New password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPasswords}
              error={newPasswordError}
            />

            <Input
              label="Confirm new password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPasswords}
              error={confirmError}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!canSubmit}
              onPress={handleSubmit}
              accessibilityRole="button"
              accessibilityLabel="Update password"
              accessibilityState={{ disabled: !canSubmit, busy: isSaving }}
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                !canSubmit && styles.submitButtonDisabled,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.submitText}>Update Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.tip, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Use at least {MIN_PASSWORD_LENGTH} characters. You will stay signed in on this device
              after changing your password.
            </Text>
          </View>
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
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
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
