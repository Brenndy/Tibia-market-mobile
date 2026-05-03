import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation, type Language } from '../context/LanguageContext';
import { colors } from '../theme/colors';

const ORDER: Language[] = ['en', 'pl', 'pt-BR'];
const LABEL: Record<Language, string> = {
  en: 'EN',
  pl: 'PL',
  'pt-BR': 'BR',
};

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

  const cycle = () => {
    const idx = ORDER.indexOf(language);
    setLanguage(ORDER[(idx + 1) % ORDER.length]);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={cycle} activeOpacity={0.7}>
      {ORDER.map((lang, i) => (
        <React.Fragment key={lang}>
          {i > 0 && <Text style={styles.sep}>|</Text>}
          <Text style={[styles.option, language === lang && styles.active]}>{LABEL[lang]}</Text>
        </React.Fragment>
      ))}
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
