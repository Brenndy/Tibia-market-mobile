import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { formatGold } from '../api/tibiaMarket';
import { ItemImage } from './ItemImage';
import { useTranslation } from '../context/LanguageContext';

interface WatchAlertModalProps {
  visible: boolean;
  itemName: string;
  wikiName: string;
  world: string;
  currentBuy: number | null;
  currentSell: number | null;
  initialBuyAlert: number | null;
  initialSellAlert: number | null;
  onSave: (buyAlert: number | null, sellAlert: number | null) => void;
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
  onSave,
  onRemove,
  onClose,
  isEditing,
}: WatchAlertModalProps) {
  const [buyAlert, setBuyAlert] = useState(initialBuyAlert?.toString() ?? '');
  const [sellAlert, setSellAlert] = useState(initialSellAlert?.toString() ?? '');
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      setBuyAlert(initialBuyAlert?.toString() ?? '');
      setSellAlert(initialSellAlert?.toString() ?? '');
    }
  }, [visible, initialBuyAlert, initialSellAlert]);

  const handleSave = () => {
    const buy = buyAlert.trim() ? Number(buyAlert.replace(/[^0-9.]/g, '')) : null;
    const sell = sellAlert.trim() ? Number(sellAlert.replace(/[^0-9.]/g, '')) : null;
    onSave(buy, sell);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerItem}>
              <View style={styles.headerImg}>
                <ItemImage wikiName={wikiName} size={36} />
              </View>
              <View>
                <Text style={styles.headerName} numberOfLines={1}>{itemName}</Text>
                <View style={styles.headerMeta}>
                  <View style={styles.worldBadge}>
                    <MaterialCommunityIcons name="earth" size={10} color={colors.gold} />
                    <Text style={styles.worldBadgeText}>{world}</Text>
                  </View>
                  <Text style={styles.headerSub}>
                    {t('buy_prefix')} <Text style={{ color: colors.buy }}>{formatGold(currentBuy)}</Text>
                    {'  '}
                    {t('sell_prefix')} <Text style={{ color: colors.sell }}>{formatGold(currentSell)}</Text>
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Buy alert */}
            <View style={styles.alertBlock}>
              <LinearGradient
                colors={[colors.buyDim, 'transparent']}
                style={styles.alertGrad}
              >
                <View style={styles.alertHeader}>
                  <MaterialCommunityIcons name="bell-ring" size={16} color={colors.buy} />
                  <Text style={[styles.alertTitle, { color: colors.buy }]}>{t('buy_alert')}</Text>
                </View>
                <Text style={styles.alertDesc}>
                  {t('buy_alert_desc')}{' '}
                  <Text style={{ color: colors.buy, fontWeight: '700' }}>{t('below_value')}</Text>
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={buyAlert}
                    onChangeText={setBuyAlert}
                    placeholder={currentBuy ? formatGold(currentBuy) : 'np. 50000'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                  <Text style={styles.inputUnit}>gp</Text>
                </View>
                {currentBuy != null && buyAlert.trim() && Number(buyAlert) > 0 && (
                  <Text style={styles.alertHint}>
                    {currentBuy <= Number(buyAlert)
                      ? t('alert_active')
                      : `${t('price_must_drop')} ${formatGold(currentBuy - Number(buyAlert))} gp`}
                  </Text>
                )}
              </LinearGradient>
            </View>

            {/* Sell alert */}
            <View style={styles.alertBlock}>
              <LinearGradient
                colors={[colors.sellDim, 'transparent']}
                style={styles.alertGrad}
              >
                <View style={styles.alertHeader}>
                  <MaterialCommunityIcons name="bell-ring" size={16} color={colors.sell} />
                  <Text style={[styles.alertTitle, { color: colors.sell }]}>{t('sell_alert')}</Text>
                </View>
                <Text style={styles.alertDesc}>
                  {t('sell_alert_desc')}{' '}
                  <Text style={{ color: colors.sell, fontWeight: '700' }}>{t('above_value')}</Text>
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={sellAlert}
                    onChangeText={setSellAlert}
                    placeholder={currentSell ? formatGold(currentSell) : 'np. 55000'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                  <Text style={styles.inputUnit}>gp</Text>
                </View>
                {currentSell != null && sellAlert.trim() && Number(sellAlert) > 0 && (
                  <Text style={styles.alertHint}>
                    {currentSell >= Number(sellAlert)
                      ? t('alert_active')
                      : `${t('price_must_rise')} ${formatGold(Number(sellAlert) - currentSell)} gp`}
                  </Text>
                )}
              </LinearGradient>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            {isEditing && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => { onRemove(); onClose(); }}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.sell} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <MaterialCommunityIcons name="bell-check" size={18} color={colors.background} />
              <Text style={styles.saveText}>{isEditing ? t('save') : t('watch')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
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
    gap: 12,
  },
  alertBlock: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
  saveText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
});
