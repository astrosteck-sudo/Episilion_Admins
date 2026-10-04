export const Colors = {
  light: {
    primary: '#007AFF',
    secondary: '#5856D6',
    accent: '#FF9500',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FFCC00',
    
    background: '#FFFFFF',
    backgroundSecondary: '#F2F2F7',
    card: '#FFFFFF',
    
    text: '#000000',
    textSecondary: '#8E8E93',
    textTertiary: '#C7C7CC',    
    border: '#C6C6C8',
    divider: '#E5E5EA',
    
    inputBackground: '#F2F2F7',
    placeholder: '#8E8E93',
  },
  dark: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    accent: '#FF9F0A',
    success: '#30D158',
    error: '#FF453A',
    warning: '#FFD60A',
    
    background: '#000000',
    backgroundSecondary: '#1C1C1E',
    card: '#1C1C1E',
    
    text: '#FFFFFF',
    textSecondary: '#98989D',
    textTertiary: '#48484A',
    
    border: '#38383A',
    divider: '#38383A',
    
    inputBackground: '#2C2C2E',
    placeholder: '#AEAEB2',
  },
} as const;

export type ColorScheme = keyof typeof Colors;

export type ColorPalette = {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  background: string;
  backgroundSecondary: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  divider: string;
  inputBackground: string;
  placeholder: string;
};

export type Colors = ColorPalette;
