import { Platform } from 'react-native';

/**
 * Single source of truth for platform branching.
 *
 * `Platform.OS` is 'ios' | 'android' | 'web'. Screens and stores should branch
 * on these flags instead of comparing `Platform.OS` inline, so the set of
 * platforms the app supports is declared in exactly one place.
 */
export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isNative = !isWeb;

/** Value sent to the API in the `X-Client-Platform` header. */
export type ClientPlatform = 'web' | 'ios' | 'android';

export const clientPlatform: ClientPlatform = isWeb ? 'web' : isIOS ? 'ios' : 'android';
