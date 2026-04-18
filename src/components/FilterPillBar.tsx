import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface FilterPill<V extends string | null> {
  value: V;
  label: string;
  icon?: IconName;
  count?: number | null;
}

interface FilterPillBarProps<V extends string | null> {
  items: FilterPill<V>[];
  active: V;
  onChange: (value: V) => void;
}

export function FilterPillBar<V extends string | null>({
  items,
  active,
  onChange,
}: FilterPillBarProps<V>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bar}
      style={styles.scroll}
    >
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <TouchableOpacity
            key={String(item.value ?? '__null__')}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onChange(item.value)}
            activeOpacity={0.8}
          >
            {item.icon ? (
              <MaterialCommunityIcons
                name={item.icon}
                size={11}
                color={isActive ? colors.gold : colors.textMuted}
              />
            ) : null}
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
              {item.count != null ? ` (${item.count})` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 0 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  pillActive: { borderColor: colors.gold, backgroundColor: colors.goldDim },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  labelActive: { color: colors.gold },
});
