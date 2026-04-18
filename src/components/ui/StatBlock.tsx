import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/src/theme/colors';

interface StatBlockProps {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  valueColor?: string;
  align?: 'center' | 'flex-start';
  style?: ViewStyle;
}

export function StatBlock({
  label,
  value,
  subtext,
  valueColor = colors.textPrimary,
  align = 'center',
  style,
}: StatBlockProps) {
  return (
    <View style={[styles.block, { alignItems: align }, style]}>
      <Text style={styles.label}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      ) : (
        value
      )}
      {subtext ? (
        typeof subtext === 'string' ? (
          <Text style={styles.subtext}>{subtext}</Text>
        ) : (
          subtext
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { flex: 1, paddingVertical: 10, gap: 3 },
  label: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  value: { fontSize: 15, fontWeight: '700' },
  subtext: { color: colors.textMuted, fontSize: 10 },
});
