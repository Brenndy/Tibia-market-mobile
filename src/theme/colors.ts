export const colors = {
  // Backgrounds — deep midnight
  background: '#060b14',
  surface: '#0c1423',
  surfaceElevated: '#111e30',
  card: '#0e1929',
  cardBorder: '#1a2d45',
  cardBorderGold: '#c9a22740',

  // Tibia Gold
  gold: '#c9a227',
  goldLight: '#e8c76a',
  goldDim: '#c9a22720',
  goldDark: '#7a5f0e',

  // Text
  textPrimary: '#f0e8d0',
  textSecondary: '#7a8ba8',
  textMuted: '#3d5070',

  // Market colors
  buy: '#16c784',
  buyDim: '#16c78420',
  buyBorder: '#16c78440',
  sell: '#ea3943',
  sellDim: '#ea394320',
  sellBorder: '#ea394340',

  // UI
  border: '#1a2d45',
  divider: '#0e1929',
  inputBg: '#080f1c',

  // Tabs
  tabActive: '#c9a227',
  tabInactive: '#3d5070',
  tabBar: '#080f1c',

  // Badges
  badgePvp: '#ef4444',
  badgeOptional: '#3b82f6',
  badgeOpen: '#22c55e',
  badgePremium: '#a855f7',

  // Glow colors
  glowGold: '#c9a22730',
  glowBuy: '#16c78420',
  glowSell: '#ea394320',
} as const;

export type ColorKey = keyof typeof colors;
