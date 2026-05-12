import { TextStyle } from 'react-native';

export const Theme = {
  colors: {
    background: '#0a0a0a',
    card: '#1c1c1e',
    cardLight: '#2c2c2e',
    primary: '#007aff',
    success: '#28a745',
    warning: '#ff9500',
    danger: '#ff453a',
    text: '#ffffff',
    textSecondary: '#8e8e93',
    textTertiary: '#c7c7cc',
    accent: '#ffd700',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  roundness: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 30,
    full: 999,
  },
  shadows: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    strong: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '900', color: '#fff' } as TextStyle,
    h2: { fontSize: 24, fontWeight: '800', color: '#fff' } as TextStyle,
    h3: { fontSize: 18, fontWeight: '700', color: '#fff' } as TextStyle,
    body: { fontSize: 16, color: '#fff' } as TextStyle,
    caption: { fontSize: 12, color: '#8e8e93' } as TextStyle,
    button: { fontSize: 16, fontWeight: 'bold' } as TextStyle,
  }
};
