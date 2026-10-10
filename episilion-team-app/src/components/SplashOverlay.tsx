import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';

const LIGHT_ICON = require('../../assets/splash-icon.png');
const DARK_ICON = require('../../assets/splash-icon-dark.png');

/**
 * Brand palette for the splash. It intentionally mirrors the native splash screen
 * (configured in app.json) and follows the device colour scheme so the hand-off
 * from the native splash to this overlay is seamless.
 */
const Palette = {
  light: {
    background: '#FFFFFF',
    title: '#0B1220',
    accent: '#1E4E9C',
    divider: '#E5E5EA',
    tagline: '#8E8E93',
  },
  dark: {
    background: '#000000',
    title: '#FFFFFF',
    accent: '#5B9BFF',
    divider: '#2C2C2E',
    tagline: '#98989D',
  },
} as const;

export function SplashOverlay({ onFinish }: { onFinish: () => void }) {
  const deviceScheme = useColorScheme();
  const palette = deviceScheme === 'dark' ? Palette.dark : Palette.light;

  // react-native-web has no native animation driver and warns when asked for one.
  const useNativeDriver = Platform.OS !== 'web';

  const [fade] = useState(() => new Animated.Value(1));
  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [logoScale] = useState(() => new Animated.Value(0.9));
  const [textOpacity] = useState(() => new Animated.Value(0));
  const [textShift] = useState(() => new Animated.Value(14));

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 480,
          delay: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(textShift, {
          toValue: 0,
          duration: 560,
          delay: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
      ]),
      Animated.delay(560),
      Animated.timing(fade, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.quad),
        useNativeDriver,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onFinish();
      }
    });

    return () => animation.stop();
  }, [fade, logoOpacity, logoScale, textOpacity, textShift, onFinish, useNativeDriver]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { backgroundColor: palette.background, opacity: fade }]}
    >
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Image
          source={deviceScheme === 'dark' ? DARK_ICON : LIGHT_ICON}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.textBlock,
          { opacity: textOpacity, transform: [{ translateY: textShift }] },
        ]}
      >
        <Text style={[styles.wordmark, { color: palette.title }]}>EPISILION</Text>
        <Text style={[styles.subMark, { color: palette.accent }]}>ADMINS</Text>
        <View style={[styles.divider, { backgroundColor: palette.divider }]} />
        <Text style={[styles.tagline, { color: palette.tagline }]}>Hostel Management Console</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  logo: {
    width: 148,
    height: 148,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 30,
  },
  wordmark: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 7,
    marginLeft: 7,
  },
  subMark: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 9,
    marginLeft: 9,
    marginTop: 8,
  },
  divider: {
    width: 44,
    height: 2,
    borderRadius: 1,
    marginTop: 22,
  },
  tagline: {
    fontSize: 12,
    letterSpacing: 1.4,
    marginTop: 16,
  },
});
