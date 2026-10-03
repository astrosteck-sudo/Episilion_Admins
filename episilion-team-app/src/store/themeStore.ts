import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { ColorScheme, ColorPalette, Colors } from '../theme/colors';
import { STORAGE_KEYS } from '../constants';

interface ThemeState {
  colorScheme: ColorScheme;
  colors: ColorPalette;
  systemColorScheme: 'light' | 'dark' | null;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleTheme: () => void;
  resetToSystemTheme: () => void;
  loadTheme: () => Promise<void>;
  setSystemColorScheme: (scheme: 'light' | 'dark' | null) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  colorScheme: 'light',
  colors: Colors.light,
  systemColorScheme: null as 'light' | 'dark' | null,
  
  setColorScheme: (scheme) => {
    set({ 
      colorScheme: scheme, 
      colors: Colors[scheme] 
    });
    SecureStore.setItemAsync(STORAGE_KEYS.THEME, scheme);
  },
  
  toggleTheme: () => {
    const currentScheme = get().colorScheme;
    const newScheme: ColorScheme = currentScheme === 'light' ? 'dark' : 'light';
    get().setColorScheme(newScheme);
  },
  
  resetToSystemTheme: () => {
    SecureStore.deleteItemAsync(STORAGE_KEYS.THEME);
    const systemScheme = get().systemColorScheme;
    const finalScheme: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light';
    set({ 
      colorScheme: finalScheme, 
      colors: Colors[finalScheme] 
    });
  },
  
  loadTheme: async () => {
    const savedScheme = await SecureStore.getItemAsync(STORAGE_KEYS.THEME);
    
    if (savedScheme === 'light' || savedScheme === 'dark') {
      set({ 
        colorScheme: savedScheme, 
        colors: Colors[savedScheme] 
      });
    } else {
      // If no saved preference, use system scheme or default to light
      const systemScheme = get().systemColorScheme;
      const initialScheme: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light';
      set({ 
        colorScheme: initialScheme, 
        colors: Colors[initialScheme] 
      });
    }
  },
  
  setSystemColorScheme: async (scheme) => {
    set({ systemColorScheme: scheme });
    const savedScheme = await SecureStore.getItemAsync(STORAGE_KEYS.THEME);
    // Only update if user hasn't manually set a preference
    if (!savedScheme && scheme) {
      const newScheme: ColorScheme = scheme === 'dark' ? 'dark' : 'light';
      set({ 
        colorScheme: newScheme, 
        colors: Colors[newScheme] 
      });
    }
  },
}));
