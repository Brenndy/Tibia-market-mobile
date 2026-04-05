import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorld } from '@/src/context/WorldContext';
import { useTranslation } from '@/src/context/LanguageContext';
import { useWorlds } from '@/src/hooks/useMarket';
import { SearchBar } from '@/src/components/SearchBar';
import { LoadingState } from '@/src/components/LoadingState';
import { colors } from '@/src/theme/colors';
import { World } from '@/src/api/tibiaMarket';

const PVP_COLORS: Record<string, string> = {
  'Open PvP': colors.badgeOpen,
  'Retro Open PvP': colors.badgeOpen,
  'Optional PvP': colors.badgeOptional,
  'Hardcore PvP': colors.badgePvp,
  'Retro Hardcore PvP': colors.badgePvp,
};

const LOCATION_ICONS: Record<string, string> = {
  'North America': '🌎',
  'South America': '🌎',
  Europe: '🌍',
  Oceania: '🌏',
};

function WorldRow({
  world,
  isSelected,
  onPress,
}: {
  world: World;
  isSelected: boolean;
  onPress: () => void;
}) {
  const pvpColor = PVP_COLORS[world.pvp_type] ?? colors.textMuted;
  const locationIcon = LOCATION_ICONS[world.location] ?? '🌐';

  return (
    <TouchableOpacity
      style={[styles.row, isSelected && styles.rowSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.locationIcon}>{locationIcon}</Text>
        <View>
          <Text style={[styles.worldName, isSelected && styles.worldNameSelected]}>
            {world.name}
          </Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { borderColor: pvpColor }]}>
              <Text style={[styles.badgeText, { color: pvpColor }]}>{world.pvp_type}</Text>
            </View>
            {world.battleye && (
              <View style={[styles.badge, { borderColor: colors.badgeOptional }]}>
                <Text style={[styles.badgeText, { color: colors.badgeOptional }]}>BattlEye</Text>
              </View>
            )}
            {world.premium_only && (
              <View style={[styles.badge, { borderColor: colors.badgePremium }]}>
                <Text style={[styles.badgeText, { color: colors.badgePremium }]}>Premium</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.rowRight}>
        <View style={styles.onlineRow}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>{world.players_online}</Text>
        </View>
        {isSelected && (
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.gold} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function WorldSelectScreen() {
  const router = useRouter();
  const { selectedWorld, setSelectedWorld } = useWorld();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data: worlds, isLoading } = useWorlds();

  const filtered = worlds?.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

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
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('search_world')}
        />
      </View>

      {filtered && (
        <Text style={styles.count}>{filtered.length} {t('select_world_title').toLowerCase()}</Text>
      )}

      <FlatList
        data={filtered ?? []}
        keyExtractor={(w) => w.name}
        renderItem={({ item }) => (
          <WorldRow
            world={item}
            isSelected={item.name === selectedWorld}
            onPress={() => handleSelect(item)}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  rowSelected: {
    backgroundColor: colors.surfaceElevated,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locationIcon: {
    fontSize: 22,
  },
  worldName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  worldNameSelected: {
    color: colors.gold,
  },
  badges: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.buy,
  },
  onlineText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
  },
});
