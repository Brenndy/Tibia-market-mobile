import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { useWorld } from '../context/WorldContext';

export function WorldBadge() {
  const { selectedWorld } = useWorld();
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/world-select')}
    >
      <MaterialCommunityIcons name="earth" size={14} color={colors.gold} />
      <Text style={styles.text}>{selectedWorld}</Text>
      <MaterialCommunityIcons name="chevron-down" size={14} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
