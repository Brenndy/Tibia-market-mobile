import { useQuery } from 'react-query';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useTranslation } from '../context/LanguageContext';

const REPO = 'Brenndy/Tibia-market-mobile';
const REPO_URL = `https://github.com/${REPO}`;
const API_URL = `https://api.github.com/repos/${REPO}`;

async function fetchStars(): Promise<number> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const json = (await res.json()) as { stargazers_count?: number };
  return json.stargazers_count ?? 0;
}

function formatStars(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k.toFixed(k < 10 ? 1 : 0)}k`;
}

export function GitHubStars({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery('github_stars', fetchStars, {
    staleTime: 60 * 60_000,
    cacheTime: 24 * 60 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const onPress = () => {
    Linking.openURL(REPO_URL);
  };

  const showCount = !isLoading && data != null;
  const countLabel = showCount ? formatStars(data!) : null;

  if (collapsed) {
    return (
      <TouchableOpacity
        testID="gh-stars"
        accessibilityRole="link"
        accessibilityLabel={t('github_stars_label')}
        onPress={onPress}
        style={styles.collapsed}
      >
        <MaterialCommunityIcons name="github" size={18} color={colors.gold} />
        {countLabel && <Text style={styles.collapsedCount}>{countLabel}</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      testID="gh-stars"
      accessibilityRole="link"
      accessibilityLabel={t('github_stars_label')}
      onPress={onPress}
      style={styles.row}
      activeOpacity={0.75}
    >
      <MaterialCommunityIcons name="github" size={16} color={colors.textSecondary} />
      <Text style={styles.label}>{t('github_star_cta')}</Text>
      <View style={styles.starPill}>
        <MaterialCommunityIcons name="star" size={11} color={colors.gold} />
        <Text style={styles.starCount}>{countLabel ?? '—'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceElevated,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  starPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: colors.cardBorderGold,
  },
  starCount: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  collapsed: {
    width: 40,
    height: 36,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 1,
  },
  collapsedCount: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 10,
  },
});
