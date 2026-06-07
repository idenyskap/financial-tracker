// Modern design tokens — emerald "financial" theme.
// Existing keys are preserved so every component that reads from `theme`
// is restyled automatically; new keys power the redesigned components.

const shared = {
  // Typography
  fontFamily:
    "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontMono:
    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",

  // Radius scale
  radiusSm: '8px',
  radius: '12px',
  radiusLg: '16px',
  radiusXl: '20px',
  radiusFull: '9999px',

  // Brand gradient
  gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
};

export const lightTheme = {
  ...shared,

  background: '#f5f7f6',
  backgroundSecondary: '#eef2f0',
  backgroundTertiary: '#e4eae7',

  text: '#0f1f1a',
  textSecondary: '#566b63',
  textTertiary: '#8a9c95',

  border: '#e5ebe8',
  borderLight: '#eef2f0',

  cardBackground: '#ffffff',
  cardBorder: '#e8edeb',

  inputBackground: '#ffffff',
  inputBorder: '#d6dedb',
  inputText: '#15261f',

  primary: '#059669',
  primaryHover: '#047857',
  primaryStrong: '#065f46',
  primarySoft: '#ecfdf5',
  onPrimary: '#ffffff',

  success: '#059669',
  successSoft: '#d1fae5',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  warning: '#d97706',
  warningSoft: '#fef3c7',
  info: '#0891b2',
  infoSoft: '#cffafe',

  // Aliases consumed by older components (kept so they render correctly)
  primaryLight: '#ecfdf5',
  primaryShadow: 'rgba(5, 150, 105, 0.25)',
  secondary: '#566b63',
  errorBackground: '#fee2e2',
  errorBorder: '#fecaca',
  errorText: '#dc2626',
  warningBackground: '#fef3c7',
  warningText: '#92400e',

  shadow:
    '0 1px 2px rgba(16, 31, 26, 0.04), 0 2px 8px rgba(16, 31, 26, 0.06)',
  shadowLarge: '0 8px 28px rgba(16, 31, 26, 0.12)',
  shadowHover: '0 6px 20px rgba(16, 31, 26, 0.10)',

  overlay: 'rgba(15, 31, 26, 0.45)',
};

export const darkTheme = {
  ...shared,

  background: '#0b1310',
  backgroundSecondary: '#101b15',
  backgroundTertiary: '#17251e',

  text: '#e8efeb',
  textSecondary: '#9bada5',
  textTertiary: '#6b7d75',

  border: '#1f2e26',
  borderLight: '#18241e',

  cardBackground: '#13201a',
  cardBorder: '#22322a',

  inputBackground: '#17241d',
  inputBorder: '#2a3b32',
  inputText: '#e8efeb',

  primary: '#10b981',
  primaryHover: '#34d399',
  primaryStrong: '#059669',
  primarySoft: 'rgba(16, 185, 129, 0.14)',
  onPrimary: '#04130d',

  success: '#34d399',
  successSoft: 'rgba(52, 211, 153, 0.15)',
  danger: '#f87171',
  dangerSoft: 'rgba(248, 113, 113, 0.15)',
  warning: '#fbbf24',
  warningSoft: 'rgba(251, 191, 36, 0.15)',
  info: '#22d3ee',
  infoSoft: 'rgba(34, 211, 238, 0.15)',

  // Aliases consumed by older components (kept so they render correctly)
  primaryLight: 'rgba(16, 185, 129, 0.14)',
  primaryShadow: 'rgba(16, 185, 129, 0.35)',
  secondary: '#9bada5',
  errorBackground: 'rgba(248, 113, 113, 0.15)',
  errorBorder: 'rgba(248, 113, 113, 0.4)',
  errorText: '#f87171',
  warningBackground: 'rgba(251, 191, 36, 0.15)',
  warningText: '#fbbf24',

  shadow: '0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 10px rgba(0, 0, 0, 0.35)',
  shadowLarge: '0 10px 30px rgba(0, 0, 0, 0.5)',
  shadowHover: '0 8px 24px rgba(0, 0, 0, 0.45)',

  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const getTheme = (theme) => {
  return theme === 'dark' ? darkTheme : lightTheme;
};
