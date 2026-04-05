import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWorld } from '@/src/context/WorldContext';
import { useTranslation } from '@/src/context/LanguageContext';
import { useMarketBoard } from '@/src/hooks/useMarket';
import { MarketItemCard } from '@/src/components/MarketItemCard';
import { LoadingState } from '@/src/components/LoadingState';
import { colors } from '@/src/theme/colors';

export default function FavoritesScreen() {
  const { selectedWorld, favorites } = useWorld();
  const { t } = useTranslation();
  const router = useRouter();

  const { data, isLoading } = useMarketBoard(selectedWorld);

  const favoriteItems = data?.items.filter((item) =>
    favorites.includes(item.name)
  ) ?? [];

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="star-outline" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>{t('no_favorites_title')}</Text>
        <Text style={styles.emptySubtitle}>{t('no_favorites_desc')}</Text>
        <TouchableOpacity
          style={styles.goButton}
          onPress={() => router.push('/')}
        >
          <MaterialCommunityIcons name="store" size={16} color={colors.gold} />
          <Text style={styles.goButtonText}>{t('go_to_market')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingState message={t('loading_favorites')} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {favoriteItems.length} {t('tab_favorites').toLowerCase()}
        </Text>
        <Text style={styles.headerWorld}>
          <MaterialCommunityIcons name="earth" size={12} color={colors.textMuted} />{' '}
          {selectedWorld}
        </Text>
      </View>

      <FlatList
        data={favoriteItems}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <MarketItemCard item={item} world={selectedWorld} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          favorites.length > 0 && favoriteItems.length === 0 ? (
            <View style={styles.notFound}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={40}
                color={colors.textMuted}
              />
              <Text style={styles.notFoundText}>{t('favorites_not_found')}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  headerWorld: {
    color: colors.textMuted,
    fontSize: 12,
  },
  list: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  goButtonText: {
    color: colors.gold,
    fontWeight: '600',
    fontSize: 14,
  },
  notFound: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
    paddingHorizontal: 24,
  },
  notFoundText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
