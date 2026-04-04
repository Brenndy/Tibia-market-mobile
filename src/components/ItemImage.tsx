import React, { useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getItemImageUrl } from '../api/tibiaMarket';
import { colors } from '../theme/colors';

interface ItemImageProps {
  wikiName: string;
  size?: number;
}

export function ItemImage({ wikiName, size = 40 }: ItemImageProps) {
  const [errored, setErrored] = useState(false);
  const uri = getItemImageUrl(wikiName);

  if (!wikiName || errored) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 8 }]}>
        <MaterialCommunityIcons name="sword" size={size * 0.55} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Image
        source={{ uri }}
        style={{ width: size, height: size }}
        resizeMode="contain"
        onError={() => setErrored(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
