import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorld } from '@/src/context/WorldContext';
import { useTranslation } from '@/src/context/LanguageContext';
import type { TranslationKey } from '@/src/i18n';
import { useWorlds } from '@/src/hooks/useMarket';
import { SearchBar } from '@/src/components/SearchBar';
import { LoadingState } from '@/src/components/LoadingState';
import { colors } from '@/src/theme/colors';
import { World } from '@/src/api/tibiaMarket';
import { timeAgo } from '@/src/utils/timeAgo';

// Polish plural rules: 1 = one, 2-4 (excluding 12-14) = few, rest = many
// English: 1 = one, rest = many (few === many)
function pluralWorlds(count: number): TranslationKey {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) return 'worlds_count_one';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'worlds_count_few';
  return 'worlds_count_many';
}

const PVP_COLORS: Record<string, string> = {
  'Open PvP': colors.badgeOpen,
  'Retro Open PvP': colors.badgeOpen,
  'Optional PvP': colors.badgeOptional,
  'Hardcore PvP': colors.badgePvp,
  'Retro Hardcore PvP': colors.badgePvp,
};

const PVP_LABELS: Record<string, string> = {
  'Open PvP': 'Open',
  'Retro Open PvP': 'Retro Open',
  'Optional PvP': 'Optional',
  'Hardcore PvP': 'Hardcore',
  'Retro Hardcore PvP': 'Retro HC',
};

function WorldRow({
  world,
  isSelected,
  isFavorite,
  onPress,
  onToggleFavorite,
}: {
  world: World;
  isSelected: boolean;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const pvpColor = PVP_COLORS[world.pvp_type] ?? colors.textMuted;
  const pvpLabel = PVP_LABELS[world.pvp_type] ?? world.pvp_type;
  const relTime = timeAgo(world.last_update);

  return (
    <TouchableOpacity
      style={[styles.row, isSelected && styles.rowSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        testID={`world-star-${world.name}`}
        onPress={(e) => {
          e.stopPropagation?.();
          onToggleFavorite();
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.starBtn}
      >
        <MaterialCommunityIcons
          name={isFavorite ? 'star' : 'star-outline'}
          size={20}
          color={isFavorite ? colors.gold : colors.textMuted}
        />
      </TouchableOpacity>
      <View style={styles.rowLeft}>
        <Text style={[styles.worldName, isSelected && styles.worldNameSelected]}>{world.name}</Text>
        {relTime ? <Text style={styles.updateTime}>{relTime}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        {world.battleye && <MaterialCommunityIcons name="eye" size={16} color={colors.buy} />}
        {pvpLabel ? <Text style={[styles.pvpLabel, { color: pvpColor }]}>{pvpLabel}</Text> : null}
        {isSelected && <MaterialCommunityIcons name="check-circle" size={18} color={colors.gold} />}
      </View>
    </TouchableOpacity>
  );
}

export default function WorldSelectScreen() {
  const router = useRouter();
  const { selectedWorld, setSelectedWorld, isFavoriteWorld, toggleFavoriteWorld } = useWorld();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data: worlds, isLoading } = useWorlds();

  // Sort: favorite worlds first (alphabetically), then the rest (alphabetically).
  const filtered = worlds
    ?.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const favA = isFavoriteWorld(a.name);
      const favB = isFavoriteWorld(b.name);
      if (favA !== favB) return favA ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const handleSelect = (world: World) => {
    setSelectedWorld(world.name);
    router.back();
  };

  if (isLoading) {
    return <LoadingState message={t('loading_worlds')} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={t('search_world')} />
      </View>

      {filtered && (
        <Text style={styles.count} testID="worlds-count">
          {filtered.length} {t(pluralWorlds(filtered.length))}
        </Text>
      )}

      <FlatList
        data={filtered ?? []}
        keyExtractor={(w) => w.name}
        renderItem={({ item }) => (
          <WorldRow
            world={item}
            isSelected={item.name === selectedWorld}
            isFavorite={isFavoriteWorld(item.name)}
            onPress={() => handleSelect(item)}
            onToggleFavorite={() => toggleFavoriteWorld(item.name)}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        extraData={selectedWorld + '|' + (worlds ?? []).length}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => router.push('/privacy')}
            accessibilityRole="link"
          >
            <MaterialCommunityIcons name="shield-lock-outline" size={14} color={colors.textMuted} />
            <Text style={styles.footerLinkText}>{t('privacy_link')}</Text>
          </TouchableOpacity>
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
  searchWrap: {
    padding: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  count: {
    color: colors.textMuted,
    fontSize: 11,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list: {
    paddingBottom: 20,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  footerLinkText: {
    color: colors.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    gap: 10,
  },
  starBtn: {
    padding: 2,
  },
  rowSelected: {
    backgroundColor: colors.surfaceElevated,
  },
  rowLeft: {
    flex: 1,
  },
  worldName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  worldNameSelected: {
    color: colors.gold,
  },
  updateTime: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pvpLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
  },
});
