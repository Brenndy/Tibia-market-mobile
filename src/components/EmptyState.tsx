import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GoldButton } from '@/src/components/ui/GoldButton';
import { colors } from '@/src/theme/colors';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  cta?: { label: string; onPress: () => void; icon?: IconName };
}

export function EmptyState({ icon, title, description, cta }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={72} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {cta ? (
        <GoldButton label={cta.label} onPress={cta.onPress} icon={cta.icon} style={styles.cta} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  cta: { marginTop: 8 },
});
