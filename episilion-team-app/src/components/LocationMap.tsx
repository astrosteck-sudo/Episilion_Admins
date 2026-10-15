import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
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

const MAPS_API_KEY = 'AIzaSyCkUOdZ5y7hMm0yrcCQoCvLwzdM6M8s5qk';

/**
 * Native map preview. Uses the Google Static Maps image API because a real
 * interactive map would need `react-native-maps` and a native rebuild.
 * The web build swaps this for an embedded iframe (see LocationMap.web.tsx).
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

  const uri = hasCoords
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x400&maptype=roadmap&markers=color:red%7Clabel:C%7C${latitude},${longitude}&key=${MAPS_API_KEY}`
    : null;

  return (
    <View
      style={[
        styles.wrapper,
        { height, backgroundColor: colors.inputBackground, borderColor: colors.border },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.fill}
          resizeMode="cover"
          onError={(error) => console.warn('Map Image failed to load: ', error.nativeEvent.error)}
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

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
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
