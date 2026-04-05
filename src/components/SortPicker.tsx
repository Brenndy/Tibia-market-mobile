import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { SortField } from '../api/tibiaMarket';
import { useTranslation } from '../context/LanguageContext';
import { TranslationKey } from '../i18n';

const SORT_OPTION_KEYS: { key: TranslationKey; value: SortField }[] = [
  { key: 'sort_month_sold', value: 'month_sold' },
  { key: 'sort_margin', value: 'margin' },
  { key: 'sort_buy_offer', value: 'buy_offer' },
  { key: 'sort_sell_offer', value: 'sell_offer' },
  { key: 'sort_month_avg_buy', value: 'month_average_buy' },
  { key: 'sort_month_avg_sell', value: 'month_average_sell' },
  { key: 'sort_month_bought', value: 'month_bought' },
  { key: 'sort_day_sold', value: 'day_sold' },
  { key: 'sort_name', value: 'name' },
];

interface SortPickerProps {
  sortField: SortField;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: SortField, order: 'asc' | 'desc') => void;
}

export function SortPicker({ sortField, sortOrder, onSortChange }: SortPickerProps) {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const SORT_OPTIONS = SORT_OPTION_KEYS.map((o) => ({ ...o, label: t(o.key) }));
  const current = SORT_OPTIONS.find((o) => o.value === sortField);

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={() => setVisible(true)}>
        <MaterialCommunityIcons name="sort" size={15} color={colors.gold} />
        <Text style={styles.buttonText} numberOfLines={1}>
          {current?.label ?? t('sort_by')}
        </Text>
        <MaterialCommunityIcons
          name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
          size={14}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.backdrop}
          onPress={() => setVisible(false)}
          activeOpacity={1}
        >
          <SafeAreaView style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{t('sort_by')}</Text>
            <ScrollView>
              {SORT_OPTIONS.map((opt) => {
                const isActive = opt.value === sortField;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.option, isActive && styles.optionActive]}
                    onPress={() => {
                      if (isActive) {
                        onSortChange(opt.value, sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        onSortChange(opt.value, 'desc');
                      }
                      setVisible(false);
                    }}
                  >
                    <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                      {opt.label}
                    </Text>
                    {isActive && (
                      <MaterialCommunityIcons
                        name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={colors.gold}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 6,
    flex: 1,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 13,
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionActive: {
    backgroundColor: colors.surfaceElevated,
  },
  optionText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  optionTextActive: {
    color: colors.gold,
    fontWeight: '600',
  },
});
