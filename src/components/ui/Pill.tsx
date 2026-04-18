import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

export type PillTone = 'neutral' | 'gold' | 'ok' | 'triggered' | 'buy' | 'sell';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface PillProps {
  label: string;
  tone?: PillTone;
  icon?: IconName;
  style?: ViewStyle;
}

const TONES: Record<PillTone, { bg: string; border?: string; fg: string; iconFg?: string }> = {
  neutral: { bg: colors.card, border: colors.cardBorder, fg: colors.textSecondary },
  gold: { bg: colors.gold, fg: colors.background, iconFg: colors.background },
  ok: { bg: colors.buyDim, border: colors.buyBorder, fg: colors.buy, iconFg: colors.buy },
  triggered: { bg: colors.gold, fg: colors.background, iconFg: colors.background },
  buy: { bg: colors.buyDim, border: colors.buyBorder, fg: colors.buy, iconFg: colors.buy },
  sell: { bg: colors.sellDim, border: colors.sellBorder, fg: colors.sell, iconFg: colors.sell },
};

export function Pill({ label, tone = 'neutral', icon, style }: PillProps) {
  const t = TONES[tone];
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: t.bg, borderColor: t.border ?? 'transparent' },
        t.border ? styles.bordered : null,
        style,
      ]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={11} color={t.iconFg ?? t.fg} /> : null}
      <Text style={[styles.label, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bordered: { borderWidth: 1 },
  label: { fontSize: 11, fontWeight: '700' },
});
