import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeStore } from '../store/themeStore';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /**
   * Route used when there is nothing to go back to (e.g. the screen was opened
   * directly). Keeps the back arrow functional on iOS, where a tab screen may
   * have no navigation history.
   */
  fallbackHref?: Parameters<typeof router.replace>[0];
}

/** Large page title with a back arrow, matching the Settings screen header. */
export function ScreenHeader({
  title,
  subtitle,
  fallbackHref = '/(sub-admin)',
}: ScreenHeaderProps) {
  const colors = useThemeStore((state) => state.colors);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={handleBack}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={[styles.backButton, { backgroundColor: colors.backgroundSecondary }]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
