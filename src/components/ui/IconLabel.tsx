import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface IconLabelProps {
  icon: IconName;
  label: string;
  iconColor?: string;
  iconSize?: number;
  textStyle?: TextStyle;
  gap?: number;
}

export function IconLabel({
  icon,
  label,
  iconColor = colors.textSecondary,
  iconSize = 14,
  textStyle,
  gap = 6,
}: IconLabelProps) {
  return (
    <View style={[styles.row, { gap }]}>
      <MaterialCommunityIcons name={icon} size={iconSize} color={iconColor} />
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
});
