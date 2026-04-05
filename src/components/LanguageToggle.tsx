import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation, Language } from '../context/LanguageContext';
import { colors } from '../theme/colors';

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

  const toggle = () => setLanguage(language === 'pl' ? 'en' : 'pl');

  return (
    <TouchableOpacity style={styles.container} onPress={toggle} activeOpacity={0.7}>
      <Text style={[styles.option, language === 'pl' && styles.active]}>PL</Text>
      <Text style={styles.sep}>|</Text>
      <Text style={[styles.option, language === 'en' && styles.active]}>EN</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  option: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  active: {
    color: colors.gold,
  },
  sep: {
    color: colors.border,
    fontSize: 11,
  },
});
