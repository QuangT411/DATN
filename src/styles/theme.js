export const colors = {
  // Nền tối
  background:    '#0D1410',   // nền chính — đen xanh rất sâu
  surface:       '#161E19',   // card / panel
  surfaceMuted:  '#1C2820',   // input, row nền phụ
  surfaceCard:   '#1A2420',   // card nâng cao hơn surface

  // Brand xanh lá
  primary:       '#3DBE6E',   // xanh lá sáng trên nền tối
  primaryDark:   '#2E9456',
  primarySoft:   '#1A3326',   // nền nhẹ cho badge/pill primary
  primaryLight:  '#142B1F',

  // Accent
  accentSun:     '#F0A430',
  accentSunSoft: '#2B2010',
  accentBlue:    '#4BA6D8',
  accentBlueSoft:'#0E2233',
  accentTeal:    '#2DC4AE',
  accentTealSoft:'#0C2722',

  // Text
  textPrimary:   '#E8F0EA',   // text chính — trắng xanh nhạt
  textSecondary: '#90A898',   // text phụ
  textMuted:     '#566B5E',   // placeholder, label mờ

  // Border
  border:        '#243029',
  borderStrong:  '#2E3D34',

  // Tiện ích
  white:         '#FFFFFF',
  danger:        '#E05C52',
  dangerSoft:    '#2D1412',
  overlay:       'rgba(0, 0, 0, 0.72)',
  overlayLight:  'rgba(0, 0, 0, 0.40)',
  glowPrimary:   '#1A3D26',   // glow xanh lá tối
  glowAccent:    '#1A2A3D',   // glow xanh dương tối
};

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
};

export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
  pill: 999,
};

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
