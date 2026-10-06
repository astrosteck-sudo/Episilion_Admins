import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../constants';

/**
 * `expo-notifications` throws on import in Expo Go on Android (SDK 53+ removed
 * remote push there), so it is loaded lazily and every call is guarded. When the
 * module is unavailable the toggle still persists the preference and reports why
 * push cannot be enabled.
 */
type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;
let moduleLoadAttempted = false;

function getNotifications(): NotificationsModule | null {
  if (moduleLoadAttempted) return notificationsModule;
  moduleLoadAttempted = true;
  try {
    notificationsModule = require('expo-notifications') as NotificationsModule;
  } catch {
    notificationsModule = null;
  }
  return notificationsModule;
}

/** True when push notifications can actually be used in this runtime. */
export const isPushSupported = () => getNotifications() !== null;

let handlerRegistered = false;

function registerForegroundHandler(mod: NotificationsModule) {
  if (handlerRegistered) return;
  try {
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerRegistered = true;
  } catch {
    /* the foreground handler is optional */
  }
}

async function ensureAndroidChannel(mod: NotificationsModule) {
  if (Platform.OS !== 'android') return;
  try {
    await mod.setNotificationChannelAsync('default', {
      name: 'Review updates',
      importance: mod.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007AFF',
    });
  } catch {
    /* channel creation is best effort */
  }
}

function permissionGranted(mod: NotificationsModule, permissions: any) {
  if (permissions?.granted) return true;
  const provisional = mod.IosAuthorizationStatus?.PROVISIONAL;
  return provisional !== undefined && permissions?.ios?.status === provisional;
}

interface NotificationState {
  /** User preference, persisted across launches. */
  enabled: boolean;
  /** Whether the OS has actually granted permission. */
  permissionGranted: boolean;
  isLoaded: boolean;
  isUpdating: boolean;
  loadPreference: () => Promise<void>;
  /** Turns notifications on/off, requesting OS permission when enabling. */
  setEnabled: (value: boolean) => Promise<{ ok: boolean; message?: string }>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  enabled: false,
  permissionGranted: false,
  isLoaded: false,
  isUpdating: false,

  loadPreference: async () => {
    try {
      const saved = await SecureStore.getItemAsync(STORAGE_KEYS.NOTIFICATIONS);
      const mod = getNotifications();

      if (!mod) {
        set({ enabled: false, permissionGranted: false, isLoaded: true });
        return;
      }

      registerForegroundHandler(mod);
      const permissions = await mod.getPermissionsAsync();
      const granted = permissionGranted(mod, permissions);

      set({
        enabled: saved === 'true' && granted,
        permissionGranted: granted,
        isLoaded: true,
      });
    } catch {
      set({ enabled: false, permissionGranted: false, isLoaded: true });
    }
  },

  setEnabled: async (value) => {
    if (get().isUpdating) return { ok: false };

    set({ isUpdating: true });
    try {
      if (!value) {
        await SecureStore.setItemAsync(STORAGE_KEYS.NOTIFICATIONS, 'false');
        set({ enabled: false, isUpdating: false });
        return { ok: true };
      }

      const mod = getNotifications();
      if (!mod) {
        set({ enabled: false, isUpdating: false });
        return {
          ok: false,
          message:
            'Push notifications are not available in Expo Go on Android. Install a development build to receive review and approval alerts.',
        };
      }

      registerForegroundHandler(mod);

      // Enabling requires OS permission.
      let permissions = await mod.getPermissionsAsync();
      if (!permissionGranted(mod, permissions)) {
        permissions = await mod.requestPermissionsAsync();
      }

      if (!permissionGranted(mod, permissions)) {
        set({ enabled: false, permissionGranted: false, isUpdating: false });
        return {
          ok: false,
          message:
            'Notifications are blocked for this app. Enable them in your device settings to receive review updates.',
        };
      }

      await ensureAndroidChannel(mod);
      await SecureStore.setItemAsync(STORAGE_KEYS.NOTIFICATIONS, 'true');
      set({ enabled: true, permissionGranted: true, isUpdating: false });
      return { ok: true };
    } catch (error: any) {
      set({ isUpdating: false });
      return { ok: false, message: error?.message || 'Could not update notification settings.' };
    }
  },
}));
