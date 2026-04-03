import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const typography = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textMuted,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  gold: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gold,
  },
  goldLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gold,
  },
});
