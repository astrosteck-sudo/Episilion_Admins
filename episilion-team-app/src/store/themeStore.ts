import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { ColorScheme, ColorPalette, Colors } from '../theme/colors';
import { STORAGE_KEYS } from '../constants';

interface ThemeState {
  colorScheme: ColorScheme;
  colors: ColorPalette;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  colorScheme: 'light',
  colors: Colors.light,
  
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
  
  loadTheme: async () => {
    const savedScheme = await SecureStore.getItemAsync(STORAGE_KEYS.THEME);
    if (savedScheme === 'light' || savedScheme === 'dark') {
      set({ 
        colorScheme: savedScheme, 
        colors: Colors[savedScheme] 
      });
    }
  },
}));
