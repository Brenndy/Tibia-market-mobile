import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  WatchAlert,
  isAlertTriggered,
  getBuyCondition,
  getSellCondition,
} from '@/src/context/WatchlistContext';
import { useTranslation } from '@/src/context/LanguageContext';
import { alertProgress } from '@/src/utils/alertProgress';
import { formatGold } from '@/src/api/tibiaMarket';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { colors } from '@/src/theme/colors';

interface AlertThresholdFooterProps {
  alert: WatchAlert;
  currentBuy: number | null;
  currentSell: number | null;
}

function ThresholdChip({
  side,
  cond,
  threshold,
  triggered,
}: {
  side: 'buy' | 'sell';
  cond: 'above' | 'below';
  threshold: number;
  triggered: boolean;
}) {
  const { t } = useTranslation();
  const tone = side === 'buy' ? colors.buy : colors.sell;
  const color = triggered ? tone : colors.textMuted;
  return (
    <View style={styles.chip}>
      <MaterialCommunityIcons
        name={triggered ? 'bell-ring' : 'bell-outline'}
        size={11}
        color={color}
      />
      <Text style={[styles.chipLabel, { color }]}>{t(side)}</Text>
      <Text style={[styles.chipValue, { color }]}>
        {cond === 'below' ? '≤' : '≥'} {formatGold(threshold)}
      </Text>
    </View>
  );
}

export function AlertThresholdFooter({
  alert,
  currentBuy,
  currentSell,
}: AlertThresholdFooterProps) {
  const triggered = isAlertTriggered(alert, currentBuy, currentSell);
  const progress = alertProgress(currentBuy, currentSell, alert);
  const hasBuy = alert.buyAlert != null;
  const hasSell = alert.sellAlert != null;

  if (!hasBuy && !hasSell) return null;

  return (
    <View style={styles.footer}>
      <View style={styles.chipRow}>
        {hasBuy && (
          <ThresholdChip
            side="buy"
            cond={getBuyCondition(alert)}
            threshold={alert.buyAlert as number}
            triggered={triggered.buy}
          />
        )}
        {hasSell && (
          <ThresholdChip
            side="sell"
            cond={getSellCondition(alert)}
            threshold={alert.sellAlert as number}
            triggered={triggered.sell}
          />
        )}
      </View>
      <View style={styles.barRow}>
        {hasBuy && (
          <ProgressBar progress={progress.buy} color={triggered.buy ? colors.gold : colors.buy} />
        )}
        {hasSell && (
          <ProgressBar
            progress={progress.sell}
            color={triggered.sell ? colors.gold : colors.sell}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 6,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chipValue: { fontSize: 11, fontWeight: '700' },
  barRow: { flexDirection: 'row', gap: 6 },
});
