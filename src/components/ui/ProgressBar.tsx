import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/src/theme/colors';

interface ProgressBarProps {
  progress: number; // 0..1
  color: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  color,
  trackColor = colors.surfaceElevated,
  height = 4,
  style,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.track, { backgroundColor: trackColor, height }, style]}>
      <View
        style={[
          styles.fill,
          { width: `${Math.round(pct * 100)}%`, backgroundColor: color, height },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flex: 1, borderRadius: 2, overflow: 'hidden' },
  fill: { borderRadius: 2 },
});
