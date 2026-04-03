import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { colors } from '../theme/colors';

interface GoldTextProps extends TextProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 12,
  md: 14,
  lg: 18,
  xl: 24,
};

export function GoldText({ children, size = 'md', style, ...props }: GoldTextProps) {
  return (
    <Text style={[styles.base, { fontSize: sizes[size] }, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.gold,
    fontWeight: '700',
  },
});
