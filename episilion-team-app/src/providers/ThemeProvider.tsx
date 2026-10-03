import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const setSystemColorScheme = useThemeStore((state) => state.setSystemColorScheme);
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  useEffect(() => {
    if (systemColorScheme === 'light' || systemColorScheme === 'dark') {
      setSystemColorScheme(systemColorScheme);
    }
  }, [systemColorScheme, setSystemColorScheme]);

  return <>{children}</>;
}
