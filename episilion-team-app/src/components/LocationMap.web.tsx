import type { CSSProperties } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useThemeStore } from '../store/themeStore';

export interface LocationMapProps {
  latitude: string | number | null | undefined;
  longitude: string | number | null | undefined;
  /** Height of the map frame. Defaults to 200. */
  height?: number;
  style?: StyleProp<ViewStyle>;
  /** Shown when no coordinates are available. */
  emptyText?: string;
}

/**
 * Web map preview. Google Maps' keyless embed endpoint renders inside an
 * iframe, so the map stays interactive (pan, zoom, fullscreen) without an API
 * key. The native build uses a static map image instead (see LocationMap.tsx).
 */
export function LocationMap({
  latitude,
  longitude,
  height = 200,
  style,
  emptyText,
}: LocationMapProps) {
  const colors = useThemeStore((state) => state.colors);
  const hasCoords = Boolean(latitude && longitude);

  const src = hasCoords
    ? `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
    : null;

  return (
    <View
      style={[
        styles.wrapper,
        { height, backgroundColor: colors.inputBackground, borderColor: colors.border },
        style,
      ]}
    >
      {src ? (
        <iframe
          title={`Map showing ${latitude}, ${longitude}`}
          src={src}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          style={frameStyle}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            {emptyText ?? 'Map Preview'}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Plain CSS: `StyleSheet.create` returns RN styles, which a DOM iframe rejects. */
const frameStyle: CSSProperties = {
  border: 0,
  width: '100%',
  height: '100%',
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  placeholderText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
