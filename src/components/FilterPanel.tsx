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
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="tune-vertical-variant" size={20} color={colors.gold} />
              <Text style={styles.title}>{t('advanced_filters')}</Text>
            </View>
            <TouchableOpacity onPress={reset} style={styles.resetBtn}>
              <MaterialCommunityIcons name="restore" size={13} color={colors.sell} />
              <Text style={styles.resetText}>{t('reset')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Yasir — highlighted toggle card */}
            <TouchableOpacity
              style={[styles.yasirCard, local.yasirOnly && styles.yasirCardActive]}
              onPress={() => setLocal((p) => ({ ...p, yasirOnly: !p.yasirOnly }))}
              activeOpacity={0.8}
            >
              <View style={styles.yasirIcon}>
                <MaterialCommunityIcons name="storefront-outline" size={20} color={local.yasirOnly ? colors.gold : colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.yasirTitle, local.yasirOnly && { color: colors.gold }]}>
                  {t('filter_yasir')}
                </Text>
                <Text style={styles.yasirSub}>{t('quick_filters')}</Text>
              </View>
              <View style={[styles.toggle, local.yasirOnly && styles.toggleOn]}>
                <View style={[styles.toggleKnob, local.yasirOnly && styles.toggleKnobOn]} />
              </View>
            </TouchableOpacity>

            {/* Vocation filter */}
            <View style={styles.sectionHead}>
              <MaterialCommunityIcons name="shield-sword" size={14} color={colors.gold} />
              <Text style={styles.sectionLabel}>{t('vocation_filter')}</Text>
            </View>
            <View style={styles.vocationGrid}>
              {(['knight', 'paladin', 'sorcerer', 'druid'] as Vocation[]).map((voc) => {
                const active = local.vocations.includes(voc);
                const icons: Record<Vocation, keyof typeof MaterialCommunityIcons.glyphMap> = {
                  knight: 'sword-cross',
                  paladin: 'bow-arrow',
                  sorcerer: 'auto-fix',
                  druid: 'leaf',
                };
                return (
                  <TouchableOpacity
                    key={voc}
                    style={[styles.vocChip, active && styles.vocChipActive]}
                    onPress={() => setLocal((p) => ({
                      ...p,
                      vocations: active
                        ? p.vocations.filter((v) => v !== voc)
                        : [...p.vocations, voc],
                    }))}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={icons[voc]}
                      size={18}
                      color={active ? colors.gold : colors.textSecondary}
                    />
                    <Text style={[styles.vocChipText, active && styles.vocChipTextActive]}>
                      {t((`voc_${voc}`) as 'voc_knight')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Categories */}
            <View style={styles.sectionHead}>
              <MaterialCommunityIcons name="tag-multiple-outline" size={14} color={colors.gold} />
              <Text style={styles.sectionLabel}>{t('category')}</Text>
              {local.categories.length > 0 && (
                <Text style={styles.sectionCount}>{local.categories.length}</Text>
              )}
            </View>
            <View style={styles.categoryGrid}>
              {(allCategories ?? []).map((cat) => {
                const active = local.categories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => toggleCategory(cat)}
                    activeOpacity={0.8}
                  >
                    {active && (
                      <MaterialCommunityIcons name="check" size={12} color={colors.gold} />
                    )}
                    <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Price row — buy + sell side by side */}
            <View style={styles.sectionHead}>
              <MaterialCommunityIcons name="cash-multiple" size={14} color={colors.gold} />
              <Text style={styles.sectionLabel}>{t('buy_price_range')}</Text>
            </View>
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

            <View style={styles.sectionHead}>
              <MaterialCommunityIcons name="cash-plus" size={14} color={colors.gold} />
              <Text style={styles.sectionLabel}>{t('sell_price_range')}</Text>
            </View>
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

            {/* Volume + Margin side by side on wide, stacked on narrow */}
            <View style={styles.twoCol}>
              <View style={styles.colHalf}>
                <View style={styles.sectionHead}>
                  <MaterialCommunityIcons name="chart-bar" size={14} color={colors.gold} />
                  <Text style={styles.sectionLabel}>{t('min_volume_monthly')}</Text>
                </View>
                <NumInput
                  label={t('min_volume_label')}
                  value={local.minVolume}
                  onChange={(v) => setLocal((p) => ({ ...p, minVolume: v }))}
                  placeholder={t('placeholder_volume')}
                />
              </View>
              <View style={styles.colHalf}>
                <View style={styles.sectionHead}>
                  <MaterialCommunityIcons name="trending-up" size={14} color={colors.gold} />
                  <Text style={styles.sectionLabel}>{t('min_margin_gp')}</Text>
                </View>
                <NumInput
                  label={t('min_margin_label')}
                  value={local.minMargin}
                  onChange={(v) => setLocal((p) => ({ ...p, minMargin: v }))}
                  placeholder={t('placeholder_margin')}
                />
              </View>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  handle: {
    width: 44,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.sellDim,
    borderWidth: 1,
    borderColor: colors.sellBorder,
  },
  resetText: {
    color: colors.sell,
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 18,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionCount: {
    marginLeft: 'auto',
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: colors.goldDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    textAlign: 'center',
  },
  yasirCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 2,
  },
  yasirCardActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldDim,
  },
  yasirIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yasirTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  yasirSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceElevated,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.gold,
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textMuted,
    alignSelf: 'flex-start',
  },
  toggleKnobOn: {
    backgroundColor: colors.background,
    alignSelf: 'flex-end',
  },
  vocationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexGrow: 1,
    minWidth: 120,
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  vocChipActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldDim,
  },
  vocChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  vocChipTextActive: {
    color: colors.gold,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  catChipActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldDim,
  },
  catChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: colors.gold,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colHalf: {
    flex: 1,
    minWidth: 140,
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
