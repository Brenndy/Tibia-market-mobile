import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useCategories } from '../hooks/useMarket';
import { useTranslation } from '../context/LanguageContext';
import { Vocation } from '../api/tibiaMarket';

export interface FilterState {
  categories: string[];
  minBuyPrice: string;
  maxBuyPrice: string;
  minSellPrice: string;
  maxSellPrice: string;
  minVolume: string;
  minMargin: string;
  yasirOnly: boolean;
  vocations: Vocation[];
}

export const DEFAULT_FILTERS: FilterState = {
  categories: [],
  minBuyPrice: '',
  maxBuyPrice: '',
  minSellPrice: '',
  maxSellPrice: '',
  minVolume: '',
  minMargin: '',
  yasirOnly: false,
  vocations: [],
};

export function countActiveFilters(f: FilterState): number {
  let n = 0;
  if (f.categories.length > 0) n++;
  if (f.minBuyPrice || f.maxBuyPrice) n++;
  if (f.minSellPrice || f.maxSellPrice) n++;
  if (f.minVolume) n++;
  if (f.minMargin) n++;
  if (f.yasirOnly) n++;
  if (f.vocations.length > 0) n++;
  return n;
}

interface FilterPanelProps {
  visible: boolean;
  filters: FilterState;
  onApply: (f: FilterState) => void;
  onClose: () => void;
}

function NumInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={inputStyles.wrap}>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        style={inputStyles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        returnKeyType="done"
      />
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrap: { flex: 1 },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
    height: 42,
  },
});

export function FilterPanel({ visible, filters, onApply, onClose }: FilterPanelProps) {
  const [local, setLocal] = useState<FilterState>(filters);
  const { data: allCategories } = useCategories();
  const { t } = useTranslation();

  const reset = useCallback(() => setLocal(DEFAULT_FILTERS), []);

  const handleOpen = useCallback(() => {
    setLocal(filters);
  }, [filters]);

  const toggleCategory = (cat: string) => {
    setLocal((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={handleOpen}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('advanced_filters')}</Text>
            <TouchableOpacity onPress={reset} style={styles.resetBtn}>
              <Text style={styles.resetText}>{t('reset')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Quick toggles */}
            <Text style={styles.sectionLabel}>{t('quick_filters')}</Text>
            <View style={styles.categoryGrid}>
              <TouchableOpacity
                style={[styles.catChip, local.yasirOnly && styles.catChipActive]}
                onPress={() => setLocal((p) => ({ ...p, yasirOnly: !p.yasirOnly }))}
              >
                <Text style={[styles.catChipText, local.yasirOnly && styles.catChipTextActive]}>
                  🏺 {t('filter_yasir')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Vocation filter */}
            <Text style={styles.sectionLabel}>{t('vocation_filter')}</Text>
            <View style={styles.categoryGrid}>
              {(['knight', 'paladin', 'sorcerer', 'druid'] as Vocation[]).map((voc) => {
                const active = local.vocations.includes(voc);
                const icons: Record<Vocation, string> = {
                  knight: '🗡', paladin: '🏹', sorcerer: '🔮', druid: '🌿',
                };
                return (
                  <TouchableOpacity
                    key={voc}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => setLocal((p) => ({
                      ...p,
                      vocations: active
                        ? p.vocations.filter((v) => v !== voc)
                        : [...p.vocations, voc],
                    }))}
                  >
                    <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                      {icons[voc]} {t((`voc_${voc}`) as 'voc_knight')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Categories */}
            <Text style={styles.sectionLabel}>{t('category')}</Text>
            <View style={styles.categoryGrid}>
              {(allCategories ?? []).map((cat) => {
                const active = local.categories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => toggleCategory(cat)}
                  >
                    <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Buy price range */}
            <Text style={styles.sectionLabel}>{t('buy_price_range')}</Text>
            <View style={styles.row}>
              <NumInput
                label={t('min_label')}
                value={local.minBuyPrice}
                onChange={(v) => setLocal((p) => ({ ...p, minBuyPrice: v }))}
                placeholder="0"
              />
              <View style={styles.rangeSep}><Text style={styles.rangeSepText}>–</Text></View>
              <NumInput
                label={t('max_label')}
                value={local.maxBuyPrice}
                onChange={(v) => setLocal((p) => ({ ...p, maxBuyPrice: v }))}
                placeholder="∞"
              />
            </View>

            {/* Sell price range */}
            <Text style={styles.sectionLabel}>{t('sell_price_range')}</Text>
            <View style={styles.row}>
              <NumInput
                label={t('min_label')}
                value={local.minSellPrice}
                onChange={(v) => setLocal((p) => ({ ...p, minSellPrice: v }))}
                placeholder="0"
              />
              <View style={styles.rangeSep}><Text style={styles.rangeSepText}>–</Text></View>
              <NumInput
                label={t('max_label')}
                value={local.maxSellPrice}
                onChange={(v) => setLocal((p) => ({ ...p, maxSellPrice: v }))}
                placeholder="∞"
              />
            </View>

            {/* Volume */}
            <Text style={styles.sectionLabel}>{t('min_volume_monthly')}</Text>
            <View style={styles.row}>
              <NumInput
                label={t('min_volume_label')}
                value={local.minVolume}
                onChange={(v) => setLocal((p) => ({ ...p, minVolume: v }))}
                placeholder={t('placeholder_volume')}
              />
            </View>

            {/* Margin */}
            <Text style={styles.sectionLabel}>{t('min_margin_gp')}</Text>
            <View style={styles.row}>
              <NumInput
                label={t('min_margin_label')}
                value={local.minMargin}
                onChange={(v) => setLocal((p) => ({ ...p, minMargin: v }))}
                placeholder={t('placeholder_margin')}
              />
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Apply */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                onApply(local);
                onClose();
              }}
            >
              <MaterialCommunityIcons name="check" size={18} color={colors.background} />
              <Text style={styles.applyText}>{t('apply_filters')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  resetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  resetText: {
    color: colors.sell,
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.card,
  },
  catChipActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldDim,
  },
  catChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  catChipTextActive: {
    color: colors.goldLight,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  rangeSep: {
    paddingBottom: 11,
  },
  rangeSepText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.gold,
    gap: 8,
  },
  applyText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
});
