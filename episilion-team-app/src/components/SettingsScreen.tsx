import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore, isPushSupported } from '../store/notificationStore';
import { useAppAlert } from './AppAlert';
import { router } from 'expo-router';

const APP_VERSION = '1.0.0';

type IconName = keyof typeof Ionicons.glyphMap;

interface RowProps {
  icon: IconName;
  iconColor: string;
  iconBackground: string;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
  /** Renders a toggle instead of a chevron. */
  toggle?: {
    value: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
  };
}

function SettingRow({
  icon,
  iconColor,
  iconBackground,
  label,
  description,
  value,
  onPress,
  destructive,
  isLast,
  toggle,
}: RowProps) {
  const colors = useThemeStore((state) => state.colors);

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>

      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowLabel,
            { color: destructive ? colors.error : colors.text },
          ]}
        >
          {label}
        </Text>
        {description ? (
          <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        ) : null}
      </View>

      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          disabled={toggle.disabled}
          trackColor={{ false: colors.border, true: colors.success }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.border}
        />
      ) : (
        <>
          {value ? (
            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>
          ) : null}
          {onPress ? (
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
}

interface ThemeOptionProps {
  icon: IconName;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

function ThemeOption({ icon, label, description, selected, onPress }: ThemeOptionProps) {
  const colors = useThemeStore((state) => state.colors);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.themeOption,
        {
          backgroundColor: selected ? colors.primary : colors.inputBackground,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={selected ? '#FFFFFF' : colors.textSecondary}
      />
      <Text
        style={[
          styles.themeOptionLabel,
          { color: selected ? '#FFFFFF' : colors.text },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.themeOptionDescription,
          { color: selected ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
        ]}
      >
        {description}
      </Text>
      {selected ? (
        <View style={styles.themeCheck}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const colors = useThemeStore((state) => state.colors);
  const { colorScheme, setColorScheme, resetToSystemTheme, followSystem } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const notificationsEnabled = useNotificationStore((state) => state.enabled);
  const notificationsUpdating = useNotificationStore((state) => state.isUpdating);
  const loadPreference = useNotificationStore((state) => state.loadPreference);
  const setNotificationsEnabled = useNotificationStore((state) => state.setEnabled);
  const { alert } = useAppAlert();

  const [pushSupported, setPushSupported] = useState(true);

  useEffect(() => {
    setPushSupported(isPushSupported());
    loadPreference();
  }, [loadPreference]);

  const handleToggleNotifications = async (value: boolean) => {
    const result = await setNotificationsEnabled(value);
    if (!result.ok && result.message) {
      alert('Notifications unavailable', result.message);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.replace('/(auth)/login');
  };

  const confirmLogout = () => {
    alert(
      'Log out?',
      'You will need to sign in again to review hostels and manage submissions on this device.',
      [
        { text: 'Stay signed in', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: handleLogout },
      ],
      { variant: 'question' },
    );
  };

  const roleLabel = role === 'super_admin' ? 'Super Admin' : 'Sub Admin';
  const initials = (user?.name || 'A')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* Profile */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
              {user?.name || 'Team Member'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>
              {user?.email || 'Not signed in'}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons
                name={role === 'super_admin' ? 'shield-checkmark' : 'person'}
                size={11}
                color={colors.primary}
              />
              <Text style={[styles.roleBadgeText, { color: colors.primary }]}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.themeGrid}>
            <ThemeOption
              icon="phone-portrait-outline"
              label="System"
              description="Match device"
              selected={followSystem}
              onPress={resetToSystemTheme}
            />
            <ThemeOption
              icon="sunny-outline"
              label="Light"
              description="Bright theme"
              selected={!followSystem && colorScheme === 'light'}
              onPress={() => setColorScheme('light')}
            />
            <ThemeOption
              icon="moon-outline"
              label="Dark"
              description="Dim theme"
              selected={!followSystem && colorScheme === 'dark'}
              onPress={() => setColorScheme('dark')}
            />
          </View>
        </View>

        {/* Account */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="person-circle-outline"
            iconColor={colors.primary}
            iconBackground={colors.backgroundSecondary}
            label="Profile"
            description="Name, email and role"
            value={roleLabel}
          />
          <SettingRow
            icon="notifications-outline"
            iconColor={colors.accent}
            iconBackground={colors.backgroundSecondary}
            label="Push Notifications"
            description={
              pushSupported
                ? 'Alerts for reviews and approvals'
                : 'Requires a development build'
            }
            toggle={{
              value: notificationsEnabled,
              onChange: handleToggleNotifications,
              disabled: notificationsUpdating,
            }}
          />
          <SettingRow
            icon="lock-closed-outline"
            iconColor={colors.secondary}
            iconBackground={colors.backgroundSecondary}
            label="Security"
            description="Change your password"
            onPress={() =>
              router.push(role === 'super_admin' ? '/(super-admin)/security' : '/(sub-admin)/security')
            }
          />
          <SettingRow
            icon="log-out-outline"
            iconColor={colors.error}
            iconBackground={colors.backgroundSecondary}
            label="Log out"
            description="Sign out of this device"
            onPress={confirmLogout}
            destructive
            isLast
          />
        </View>

        {/* About */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="information-circle-outline"
            iconColor={colors.primary}
            iconBackground={colors.backgroundSecondary}
            label="App Version"
            value={APP_VERSION}
          />
          <SettingRow
            icon="business-outline"
            iconColor={colors.success}
            iconBackground={colors.backgroundSecondary}
            label="Episilion Hostels"
            description="Admin console"
            isLast
          />
        </View>

        <View style={styles.footer}>
          <Image
            source={require('../../assets/episilion_logo.png')}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Episilion Admins v{APP_VERSION}
          </Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 13,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 3,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  themeOptionDescription: {
    fontSize: 10,
    textAlign: 'center',
  },
  themeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowDescription: {
    fontSize: 12,
  },
  rowValue: {
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  footerLogo: {
    width: 40,
    height: 40,
    opacity: 0.5,
  },
  footerText: {
    fontSize: 11,
  },
});
