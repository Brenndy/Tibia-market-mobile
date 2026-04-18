import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

interface WorldSectionHeaderProps {
  world: string;
  count: number;
  countLabel: string;
  right?: React.ReactNode;
}

export function WorldSectionHeader({ world, count, countLabel, right }: WorldSectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <MaterialCommunityIcons name="earth" size={14} color={colors.gold} />
        <Text style={styles.worldName}>{world}</Text>
        <Text style={styles.count}>
          {count} {countLabel}
        </Text>
      </View>
      {right ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  worldName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  count: { color: colors.textMuted, fontSize: 11 },
});
