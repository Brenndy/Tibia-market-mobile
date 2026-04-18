import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface TabSwitcherItem<V extends string> {
  value: V;
  label: string;
  icon?: IconName;
  badge?: string | number | null;
}

interface TabSwitcherProps<V extends string> {
  items: readonly TabSwitcherItem<V>[];
  active: V;
  onChange: (value: V) => void;
}

export function TabSwitcher<V extends string>({ items, active, onChange }: TabSwitcherProps<V>) {
  return (
    <View style={styles.row}>
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <TouchableOpacity
            key={item.value}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(item.value)}
            activeOpacity={0.8}
          >
            {item.icon ? (
              <MaterialCommunityIcons
                name={item.icon}
                size={14}
                color={isActive ? colors.gold : colors.textMuted}
              />
            ) : null}
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
              {item.badge != null && item.badge !== '' ? ` (${item.badge})` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.gold },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  labelActive: { color: colors.gold },
});
