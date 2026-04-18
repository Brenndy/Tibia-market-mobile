import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface GoldButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  style?: ViewStyle;
  testID?: string;
}

export function GoldButton({ label, onPress, icon, style, testID }: GoldButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      testID={testID}
      style={[styles.btn, style]}
      activeOpacity={0.85}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={16} color={colors.background} /> : null}
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  label: { color: colors.background, fontWeight: '700', fontSize: 15 },
});
