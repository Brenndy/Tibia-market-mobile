import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ItemImage } from '@/src/components/ItemImage';
import { colors } from '@/src/theme/colors';

interface ItemImageBoxProps {
  wikiName: string | undefined;
  size?: number;
  boxSize?: number;
  style?: ViewStyle;
}

export function ItemImageBox({ wikiName, size = 36, boxSize, style }: ItemImageBoxProps) {
  const outer = boxSize ?? size + 4;
  return (
    <View style={[styles.box, { width: outer, height: outer }, style]}>
      <ItemImage wikiName={wikiName ?? ''} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
