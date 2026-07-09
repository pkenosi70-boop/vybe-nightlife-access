// VYBE Nightlife Design Tokens
export const COLORS = {
  // Brand
  primary: '#8B5CF6',       // Neon purple
  primaryDark: '#6D28D9',
  primaryLight: '#A78BFA',
  accent: '#3B82F6',        // Electric blue
  accentDark: '#1D4ED8',
  accentLight: '#60A5FA',
  neonPink: '#EC4899',
  neonGreen: '#10B981',

  // Backgrounds
  bg: '#0A0A0F',            // Near black
  bgCard: '#12121A',        // Card background
  bgSurface: '#1A1A26',     // Surface
  bgElevated: '#1E1E2E',    // Elevated surface

  // Text
  textPrimary: '#F0F0FF',
  textSecondary: '#A0A0C0',
  textTertiary: '#606080',
  textMuted: '#404060',

  // States
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  pending: '#F59E0B',
  approved: '#10B981',
  denied: '#EF4444',

  // Borders
  border: '#2A2A3E',
  borderLight: '#3A3A52',
};

export const VIBE_COLORS: Record<string, { bg: string; text: string }> = {
  'Amapiano': { bg: '#1A0F2E', text: '#C084FC' },
  'Afrohouse': { bg: '#0F1A2E', text: '#60A5FA' },
  'Chill': { bg: '#0F2E1A', text: '#34D399' },
  'VIP': { bg: '#2E1A0F', text: '#FCD34D' },
  'Deep House': { bg: '#1A1A2E', text: '#818CF8' },
  'Techno': { bg: '#2E0F0F', text: '#F87171' },
  'Electronic': { bg: '#0F2E2E', text: '#22D3EE' },
  'Exclusive': { bg: '#2E1F0F', text: '#F59E0B' },
  'Private': { bg: '#2E0F1A', text: '#F472B6' },
  'Soul': { bg: '#1A0F0F', text: '#FCA5A5' },
  'Live': { bg: '#0F1A0F', text: '#6EE7B7' },
  'Premium': { bg: '#1A1500', text: '#FDE68A' },
  'Underground': { bg: '#0F0F0F', text: '#9CA3AF' },
  'Festival': { bg: '#1A0A2E', text: '#DDD6FE' },
  'Massive': { bg: '#2E0A0A', text: '#FCA5A5' },
  'Neon': { bg: '#0A1A2E', text: '#67E8F9' },
  'Outdoor': { bg: '#0A2E14', text: '#86EFAC' },
  'Brunch': { bg: '#2E1A00', text: '#FDE68A' },
  '18+': { bg: '#2E0A0A', text: '#F87171' },
  'default': { bg: '#1A1A2E', text: '#A78BFA' },
};

export function getVibeColor(tag: string) {
  return VIBE_COLORS[tag] || VIBE_COLORS['default'];
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const FONT = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 36,
};
