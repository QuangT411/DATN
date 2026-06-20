// ─── Dark Mode Colors ────────────────────────────────────────────
export const darkColors = {
  // Nền tối
  background:    '#0D1410',
  surface:       '#161E19',
  surfaceMuted:  '#1C2820',

  // Brand xanh lá
  primary:       '#3DBE6E',
  primaryDark:   '#2E9456',
  primarySoft:   '#1A3326',
  primaryLight:  '#142B1F',

  // Accent
  accentSun:     '#F0A430',
  accentSunSoft: '#2B2010',
  accentBlue:    '#4BA6D8',
  accentBlueSoft:'#0E2233',
  accentTeal:    '#2DC4AE',

  // Text
  textPrimary:   '#E8F0EA',
  textSecondary: '#90A898',
  textMuted:     '#566B5E',

  // Border
  border:        '#243029',

  // Tiện ích
  white:         '#FFFFFF',
  danger:        '#E05C52',
  overlay:       'rgba(0, 0, 0, 0.72)',
  glowPrimary:   '#1A3D26',
  glowAccent:    '#1A2A3D',
};

// ─── Light Mode Colors ───────────────────────────────────────────
export const lightColors = {
  // Nền sáng
  background:    '#F2F7F4',
  surface:       '#FFFFFF',
  surfaceMuted:  '#EBF2EE',

  // Brand xanh lá (giữ nguyên)
  primary:       '#2EA85A',
  primaryDark:   '#247A42',
  primarySoft:   '#D4F0E1',
  primaryLight:  '#E6F7EE',

  // Accent
  accentSun:     '#D48A1A',
  accentSunSoft: '#FEF3DC',
  accentBlue:    '#2E86BE',
  accentBlueSoft:'#DBF0FF',
  accentTeal:    '#1FA893',

  // Text
  textPrimary:   '#1A2E22',
  textSecondary: '#4A6358',
  textMuted:     '#8AA898',

  // Border
  border:        '#D0E5D8',

  // Tiện ích
  white:         '#FFFFFF',
  danger:        '#D63B31',
  overlay:       'rgba(0, 0, 0, 0.50)',
  glowPrimary:   '#C8EDD8',
  glowAccent:    '#C8D8ED',
};

// ─── Hàm lấy màu theo theme ─────────────────────────────────────
export const getColors = (isDark) => isDark ? darkColors : lightColors;

// ─── Typography ──────────────────────────────────────────────────
export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
};

// ─── Border Radii ────────────────────────────────────────────────
export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
  pill: 999,
};

// ─── Spacing ─────────────────────────────────────────────────────
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
  xxxl: 48,
};

// ─── Shadows ─────────────────────────────────────────────────────
export const shadows = {
  soft: {
    shadowColor: '#0A1A10',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  lift: {
    shadowColor: '#0A1A10',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#0A1A10',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};
