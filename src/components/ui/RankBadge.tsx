import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';

const PODIUM_COLORS = [colors.gold, '#9ca3af', '#cd7f32'] as const;

interface RankBadgeProps {
  rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
  const isPodium = rank <= 3;
  const color = isPodium ? PODIUM_COLORS[rank - 1] : colors.textMuted;
  return (
    <View style={[styles.badge, { borderColor: color + '50', backgroundColor: color + '18' }]}>
      <Text style={[styles.num, { color }]}>{rank}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  num: { fontSize: 12, fontWeight: '800' },
});
