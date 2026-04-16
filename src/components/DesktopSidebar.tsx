import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { colors } from '../theme/colors';
import { useTranslation } from '../context/LanguageContext';
import { useWatchlist, isAlertTriggered } from '../context/WatchlistContext';
import { useWorld } from '../context/WorldContext';
import { useMarketBoard } from '../hooks/useMarket';
import { WorldBadge } from './WorldBadge';
import { LanguageToggle } from './LanguageToggle';

interface SidebarItem {
  key: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  badgeCount?: number;
  badgeHot?: boolean;
}

export function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { t } = useTranslation();
  const { watchlist } = useWatchlist();
  const { selectedWorld } = useWorld();
  const { data } = useMarketBoard(selectedWorld);

  const triggeredCount = watchlist.filter((a) => {
    const item = data?.items.find((i) => i.name === a.itemName && a.world === selectedWorld);
    const tr = isAlertTriggered(a, item?.buy_offer ?? null, item?.sell_offer ?? null);
    return tr.buy || tr.sell;
  }).length;

  const items: SidebarItem[] = [
    {
      key: 'market',
      icon: 'store',
      label: t('tab_market'),
      href: '/',
      match: (p) => p === '/' || p === '/index' || p.startsWith('/item/'),
    },
    {
      key: 'alerts',
      icon: 'bell',
      label: t('tab_alerts'),
      href: '/watchlist',
      match: (p) => p.startsWith('/watchlist'),
      badgeCount: watchlist.length,
      badgeHot: triggeredCount > 0,
    },
    {
      key: 'stats',
      icon: 'chart-line',
      label: t('tab_statistics'),
      href: '/statistics',
      match: (p) => p.startsWith('/statistics'),
    },
    {
      key: 'world',
      icon: 'earth',
      label: t('select_world_title'),
      href: '/world-select',
      match: (p) => p.startsWith('/world-select'),
    },
  ];

  return (
    <View style={styles.sidebar}>
      <TouchableOpacity onPress={() => router.navigate('/')} style={styles.brand}>
        <MaterialCommunityIcons name="diamond-stone" size={22} color={colors.gold} />
        <Text style={styles.brandText}>TibiaTrader</Text>
      </TouchableOpacity>

      <View style={styles.nav}>
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => router.navigate(item.href as any)}
              style={[styles.navItem, active && styles.navItemActive]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={active ? colors.gold : colors.textSecondary}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
              {item.badgeCount != null && item.badgeCount > 0 && (
                <View style={[styles.badge, item.badgeHot && styles.badgeHot]}>
                  <Text style={[styles.badgeText, item.badgeHot && styles.badgeTextHot]}>
                    {item.badgeCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <WorldBadge />
        <LanguageToggle />
      </View>
    </View>
  );
}

export const SIDEBAR_WIDTH = 220;

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: 20,
    paddingHorizontal: 14,
    gap: 20,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  brandText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  nav: {
    gap: 2,
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: colors.goldDim,
    borderColor: colors.gold + '40',
  },
  navLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  navLabelActive: {
    color: colors.gold,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeHot: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextHot: {
    color: colors.background,
  },
  footer: {
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
