import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { formatGold, toTitleCase } from '../api/tibiaMarket';
import { ItemImage } from './ItemImage';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import {
  AlertCondition,
  DEFAULT_BUY_CONDITION,
  DEFAULT_SELL_CONDITION,
} from '../context/WatchlistContext';

interface WatchAlertModalProps {
  visible: boolean;
  itemName: string;
  wikiName: string;
  world: string;
  currentBuy: number | null;
  currentSell: number | null;
  initialBuyAlert: number | null;
  initialSellAlert: number | null;
  initialBuyAlertCondition?: AlertCondition;
  initialSellAlertCondition?: AlertCondition;
  onSave: (
    buyAlert: number | null,
    sellAlert: number | null,
    buyAlertCondition: AlertCondition,
    sellAlertCondition: AlertCondition,
  ) => void;
  onRemove: () => void;
  onClose: () => void;
  isEditing: boolean;
}

export function WatchAlertModal({
  visible,
  itemName,
  wikiName,
  world,
  currentBuy,
  currentSell,
  initialBuyAlert,
  initialSellAlert,
  initialBuyAlertCondition,
  initialSellAlertCondition,
  onSave,
  onRemove,
  onClose,
  isEditing,
}: WatchAlertModalProps) {
  const [buyAlert, setBuyAlert] = useState(initialBuyAlert?.toString() ?? '');
  const [sellAlert, setSellAlert] = useState(initialSellAlert?.toString() ?? '');
  const [buyCond, setBuyCond] = useState<AlertCondition>(
    initialBuyAlertCondition ?? DEFAULT_BUY_CONDITION,
  );
  const [sellCond, setSellCond] = useState<AlertCondition>(
    initialSellAlertCondition ?? DEFAULT_SELL_CONDITION,
  );
  const { t } = useTranslation();
  const { showToast } = useToast();

  useEffect(() => {
    if (visible) {
      setBuyAlert(initialBuyAlert?.toString() ?? '');
      setSellAlert(initialSellAlert?.toString() ?? '');
      setBuyCond(initialBuyAlertCondition ?? DEFAULT_BUY_CONDITION);
      setSellCond(initialSellAlertCondition ?? DEFAULT_SELL_CONDITION);
    }
  }, [
    visible,
    initialBuyAlert,
    initialSellAlert,
    initialBuyAlertCondition,
    initialSellAlertCondition,
  ]);

  const parseGold = (raw: string): number | null => {
    const s = raw.trim().toLowerCase();
    if (!s) return null;
    const kk = s.match(/^([0-9.]+)kk$/);
    if (kk) return Math.round(parseFloat(kk[1]) * 1_000_000);
    const k = s.match(/^([0-9.]+)k$/);
    if (k) return Math.round(parseFloat(k[1]) * 1_000);
    const plain = parseFloat(s.replace(/[^0-9.]/g, ''));
    return isNaN(plain) ? null : Math.round(plain);
  };

  const parsedBuy = parseGold(buyAlert);
  const parsedSell = parseGold(sellAlert);
  const canSave = (parsedBuy != null && parsedBuy > 0) || (parsedSell != null && parsedSell > 0);

  const opSymbol = (cond: AlertCondition) => (cond === 'below' ? '≤' : '≥');

  const handleSave = () => {
    if (!canSave) return;
    onSave(parsedBuy, parsedSell, buyCond, sellCond);
    const parts: string[] = [];
    if (parsedBuy != null && parsedBuy > 0)
      parts.push(`${t('buy')} ${opSymbol(buyCond)} ${formatGold(parsedBuy)}`);
    if (parsedSell != null && parsedSell > 0)
      parts.push(`${t('sell')} ${opSymbol(sellCond)} ${formatGold(parsedSell)}`);
    showToast(`${t('toast_alert_saved')}: ${parts.join(' · ')}`, 'success');
    onClose();
  };

  const handleRemove = () => {
    onRemove();
    showToast(t('toast_alert_removed'), 'info');
    onClose();
  };

  // Chip suggestions flip with direction: below → discounts, above → markups.
  const buySuggestions: { label: string; value: number }[] = [];
  if (currentBuy != null && currentBuy > 0) {
    if (buyCond === 'below') {
      buySuggestions.push({ label: '−5%', value: Math.round(currentBuy * 0.95) });
      buySuggestions.push({ label: '−10%', value: Math.round(currentBuy * 0.9) });
      buySuggestions.push({ label: '−15%', value: Math.round(currentBuy * 0.85) });
    } else {
      buySuggestions.push({ label: '+5%', value: Math.round(currentBuy * 1.05) });
      buySuggestions.push({ label: '+10%', value: Math.round(currentBuy * 1.1) });
      buySuggestions.push({ label: '+15%', value: Math.round(currentBuy * 1.15) });
    }
  }
  const sellSuggestions: { label: string; value: number }[] = [];
  if (currentSell != null && currentSell > 0) {
    if (sellCond === 'above') {
      sellSuggestions.push({ label: '+5%', value: Math.round(currentSell * 1.05) });
      sellSuggestions.push({ label: '+10%', value: Math.round(currentSell * 1.1) });
      sellSuggestions.push({ label: '+15%', value: Math.round(currentSell * 1.15) });
    } else {
      sellSuggestions.push({ label: '−5%', value: Math.round(currentSell * 0.95) });
      sellSuggestions.push({ label: '−10%', value: Math.round(currentSell * 0.9) });
      sellSuggestions.push({ label: '−15%', value: Math.round(currentSell * 0.85) });
    }
  }

  const buyHint = (() => {
    if (currentBuy == null || !buyAlert.trim() || !(parsedBuy != null && parsedBuy > 0))
      return null;
    const triggered = buyCond === 'below' ? currentBuy <= parsedBuy : currentBuy >= parsedBuy;
    if (triggered) return t('alert_active');
    return buyCond === 'below'
      ? `${t('price_must_drop')} ${formatGold(currentBuy - parsedBuy)} gp`
      : `${t('price_must_rise')} ${formatGold(parsedBuy - currentBuy)} gp`;
  })();

  const sellHint = (() => {
    if (currentSell == null || !sellAlert.trim() || !(parsedSell != null && parsedSell > 0))
      return null;
    const triggered = sellCond === 'above' ? currentSell >= parsedSell : currentSell <= parsedSell;
    if (triggered) return t('alert_active');
    return sellCond === 'above'
      ? `${t('price_must_rise')} ${formatGold(parsedSell - currentSell)} gp`
      : `${t('price_must_drop')} ${formatGold(currentSell - parsedSell)} gp`;
  })();

  const DirectionToggle = ({
    value,
    onChange,
    tint,
    tintBorder,
    tintDim,
    sideTestId,
  }: {
    value: AlertCondition;
    onChange: (v: AlertCondition) => void;
    tint: string;
    tintBorder: string;
    tintDim: string;
    sideTestId: 'buy' | 'sell';
  }) => (
    <View style={styles.segRow}>
      {(['below', 'above'] as const).map((dir) => {
        const active = value === dir;
        return (
          <TouchableOpacity
            key={dir}
            onPress={() => onChange(dir)}
            style={[styles.segBtn, active && { backgroundColor: tintDim, borderColor: tintBorder }]}
            testID={`${sideTestId}-dir-${dir}`}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.segText, active && { color: tint, fontWeight: '700' }]}>
              {t(dir === 'below' ? 'alert_direction_below' : 'alert_direction_above')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerItem}>
              <View style={styles.headerImg}>
                <ItemImage wikiName={wikiName} size={36} />
              </View>
              <View>
                <Text style={styles.headerName} numberOfLines={1}>
                  {toTitleCase(itemName)}
                </Text>
                <View style={styles.headerMeta}>
                  <View style={styles.worldBadge}>
                    <MaterialCommunityIcons name="earth" size={10} color={colors.gold} />
                    <Text style={styles.worldBadgeText}>{world}</Text>
                  </View>
                  <Text style={styles.headerSub}>
                    {t('buy_prefix')}{' '}
                    <Text style={{ color: colors.buy }}>{formatGold(currentBuy)}</Text>
                    {'  '}
                    {t('sell_prefix')}{' '}
                    <Text style={{ color: colors.sell }}>{formatGold(currentSell)}</Text>
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Buy alert */}
            <View style={styles.alertBlock}>
              <LinearGradient colors={[colors.buyDim, 'transparent']} style={styles.alertGrad}>
                <View style={styles.alertHeader}>
                  <MaterialCommunityIcons name="bell-ring" size={16} color={colors.buy} />
                  <Text style={[styles.alertTitle, { color: colors.buy }]}>{t('buy_alert')}</Text>
                </View>
                <DirectionToggle
                  value={buyCond}
                  onChange={setBuyCond}
                  tint={colors.buy}
                  tintBorder={colors.buyBorder}
                  tintDim={colors.buyDim}
                  sideTestId="buy"
                />
                <Text style={styles.alertDesc}>
                  {t(buyCond === 'below' ? 'buy_alert_desc_below' : 'buy_alert_desc_above')}{' '}
                  <Text style={{ color: colors.buy, fontWeight: '700' }}>
                    {t(buyCond === 'below' ? 'below_value' : 'above_value')}
                  </Text>
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={buyAlert}
                    onChangeText={setBuyAlert}
                    placeholder={currentBuy ? formatGold(currentBuy) : 'e.g. 100k'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    returnKeyType="done"
                    testID="buy-alert-input"
                  />
                  <Text style={styles.inputUnit}>gp</Text>
                </View>
                {buySuggestions.length > 0 && (
                  <View style={styles.suggestRow}>
                    <Text style={styles.suggestLabel}>{t('suggest_label')}</Text>
                    {buySuggestions.map((s) => (
                      <TouchableOpacity
                        key={s.label}
                        style={[styles.chip, styles.chipBuy]}
                        onPress={() => setBuyAlert(String(s.value))}
                        testID={`buy-chip-${s.label}`}
                      >
                        <Text style={[styles.chipText, { color: colors.buy }]}>
                          {s.label} <Text style={styles.chipValue}>({formatGold(s.value)})</Text>
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {buyHint && <Text style={styles.alertHint}>{buyHint}</Text>}
              </LinearGradient>
            </View>

            {/* Sell alert */}
            <View style={styles.alertBlock}>
              <LinearGradient colors={[colors.sellDim, 'transparent']} style={styles.alertGrad}>
                <View style={styles.alertHeader}>
                  <MaterialCommunityIcons name="bell-ring" size={16} color={colors.sell} />
                  <Text style={[styles.alertTitle, { color: colors.sell }]}>{t('sell_alert')}</Text>
                </View>
                <DirectionToggle
                  value={sellCond}
                  onChange={setSellCond}
                  tint={colors.sell}
                  tintBorder={colors.sellBorder}
                  tintDim={colors.sellDim}
                  sideTestId="sell"
                />
                <Text style={styles.alertDesc}>
                  {t(sellCond === 'below' ? 'sell_alert_desc_below' : 'sell_alert_desc_above')}{' '}
                  <Text style={{ color: colors.sell, fontWeight: '700' }}>
                    {t(sellCond === 'below' ? 'below_value' : 'above_value')}
                  </Text>
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={sellAlert}
                    onChangeText={setSellAlert}
                    placeholder={currentSell ? formatGold(currentSell) : 'e.g. 110k'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    returnKeyType="done"
                    testID="sell-alert-input"
                  />
                  <Text style={styles.inputUnit}>gp</Text>
                </View>
                {sellSuggestions.length > 0 && (
                  <View style={styles.suggestRow}>
                    <Text style={styles.suggestLabel}>{t('suggest_label')}</Text>
                    {sellSuggestions.map((s) => (
                      <TouchableOpacity
                        key={s.label}
                        style={[styles.chip, styles.chipSell]}
                        onPress={() => setSellAlert(String(s.value))}
                        testID={`sell-chip-${s.label}`}
                      >
                        <Text style={[styles.chipText, { color: colors.sell }]}>
                          {s.label} <Text style={styles.chipValue}>({formatGold(s.value)})</Text>
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {sellHint && <Text style={styles.alertHint}>{sellHint}</Text>}
              </LinearGradient>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {isEditing && (
              <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.sell} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
              accessibilityState={{ disabled: !canSave }}
              testID="watch-save-btn"
            >
              <MaterialCommunityIcons name="bell-check" size={18} color={colors.background} />
              <Text style={styles.saveText}>{isEditing ? t('save') : t('watch')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: colors.cardBorder,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
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
  headerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerImg: {
    width: 44,
    height: 44,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  headerMeta: {
    gap: 4,
  },
  worldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: colors.gold + '40',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  worldBadgeText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
  },
  headerSub: {
    color: colors.textMuted,
    fontSize: 12,
  },
  body: {
    padding: 16,
  },
  alertBlock: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 12,
  },
  alertGrad: {
    padding: 16,
    gap: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  alertDesc: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  segRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.inputBg,
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  segText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    height: 50,
  },
  inputUnit: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 24,
  },
  alertHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  suggestLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginRight: 2,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipBuy: {
    borderColor: colors.buyBorder,
    backgroundColor: colors.buyDim,
  },
  chipSell: {
    borderColor: colors.sellBorder,
    backgroundColor: colors.sellDim,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipValue: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    alignItems: 'center',
  },
  removeBtn: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sellBorder,
    backgroundColor: colors.sellDim,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.gold,
    gap: 8,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
});
