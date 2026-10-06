import React from 'react';
import { Platform, StyleSheet, type ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';

type IconName = keyof typeof Ionicons.glyphMap;

/** Height of the tab bar content, excluding the device's bottom safe area. */
const TAB_BAR_CONTENT_HEIGHT = 62;

/**
 * Builds the shared tab bar styling. The bottom inset is added to the bar height
 * and padding so the tabs clear the home indicator on iOS and the gesture /
 * navigation bar on Android.
 */
export function useTabScreenOptions() {
  const colors = useThemeStore((state) => state.colors);
  const colorScheme = useThemeStore((state) => state.colorScheme);
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return {
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTintColor: colors.text,
    headerShadowVisible: false,

    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarHideOnKeyboard: true,
    tabBarStyle: {
      backgroundColor: colors.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
      paddingTop: 10,
      paddingBottom: bottomInset + 8,
      paddingHorizontal: 8,
      // Subtle lift so the bar reads as a distinct surface.
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.06,
          shadowRadius: 12,
        },
        android: {
          elevation: 12,
        },
        default: {},
      }),
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
      marginTop: 2,
    },
    tabBarItemStyle: {
      paddingVertical: 2,
    },
  };
}

interface TabIconProps {
  name: IconName;
  focusedName: IconName;
  color: ColorValue;
  size: number;
  focused: boolean;
}

/** Filled icon when active, outline when inactive — a common premium pattern. */
export function TabBarIcon({ name, focusedName, color, size, focused }: TabIconProps) {
  return <Ionicons name={focused ? focusedName : name} size={size} color={color} />;
}
