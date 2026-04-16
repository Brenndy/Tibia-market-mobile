import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useTranslation } from '../context/LanguageContext';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="wifi-off" size={40} color={colors.sell} />
      </View>
      <Text style={styles.message}>{message ?? t('item_not_found')}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
          <MaterialCommunityIcons name="refresh" size={16} color={colors.background} />
          <Text style={styles.buttonText}>{t('load_more')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
    gap: 16,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.sellDim,
    borderWidth: 1,
    borderColor: colors.sellBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
});
