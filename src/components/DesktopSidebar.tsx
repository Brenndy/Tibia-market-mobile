import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { colors } from '../theme/colors';
import { useTranslation } from '../context/LanguageContext';
import { useWatchlist, isAlertTriggered } from '../context/WatchlistContext';
import { useWorld } from '../context/WorldContext';
import { useMarketBoard } from '../hooks/useMarket';
import { WorldBadge } from './WorldBadge';
import { LanguageToggle } from './LanguageToggle';
import { storage } from '../utils/storage';

const COLLAPSED_KEY = 'tibia_sidebar_collapsed_v1';
const WIDTH_EXPANDED = 220;
const WIDTH_COLLAPSED = 64;

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
  const { t, language, setLanguage } = useTranslation();
  const { watchlist } = useWatchlist();
  const { selectedWorld } = useWorld();
  const { data } = useMarketBoard(selectedWorld);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let mounted = true;
    storage.getItem(COLLAPSED_KEY).then((v) => {
      if (mounted && v === '1') setCollapsed(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      storage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

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
      match: (p) => p === '/' || p === '/index',
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
  ];

  const cycleLanguage = () => setLanguage(language === 'pl' ? 'en' : 'pl');

  return (
    <View style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
      <View style={[styles.brandRow, collapsed && styles.brandRowCollapsed]}>
        <TouchableOpacity
          onPress={() => router.navigate('/')}
          style={[styles.brand, collapsed && styles.brandCollapsed]}
        >
          <Image source={require('../../assets/favicon.png')} style={styles.brandLogo} />
          {!collapsed && <Text style={styles.brandText}>TibiaTrader</Text>}
        </TouchableOpacity>
        {!collapsed && (
          <TouchableOpacity
            testID="sidebar-toggle"
            onPress={toggle}
            style={styles.toggleBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={t('sidebar_collapse')}
          >
            <MaterialCommunityIcons name="chevron-double-left" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {collapsed && (
        <TouchableOpacity
          testID="sidebar-toggle"
          onPress={toggle}
          style={[styles.navItem, styles.navItemCollapsed]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={t('sidebar_expand')}
        >
          <MaterialCommunityIcons name="chevron-double-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      <View style={styles.nav}>
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => router.navigate(item.href as any)}
              style={[
                styles.navItem,
                collapsed && styles.navItemCollapsed,
                active && styles.navItemActive,
              ]}
              activeOpacity={0.7}
              accessibilityLabel={item.label}
            >
              <View style={styles.navIconWrap}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={active ? colors.gold : colors.textSecondary}
                />
                {collapsed && item.badgeCount != null && item.badgeCount > 0 && (
                  <View style={[styles.badgeDot, item.badgeHot && styles.badgeDotHot]} />
                )}
              </View>
              {!collapsed && (
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
              )}
              {!collapsed && item.badgeCount != null && item.badgeCount > 0 && (
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

      <View style={[styles.footer, collapsed && styles.footerCollapsed]}>
        {collapsed ? (
          <>
            <TouchableOpacity
              onPress={() => router.push('/world-select')}
              style={styles.footerIconBtn}
              accessibilityLabel={selectedWorld}
            >
              <MaterialCommunityIcons name="earth" size={18} color={colors.gold} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={cycleLanguage}
              style={styles.footerIconBtn}
              accessibilityLabel="Language"
            >
              <Text style={styles.langBadge}>{language.toUpperCase()}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <WorldBadge />
            <LanguageToggle />
          </>
        )}
      </View>
    </View>
  );
}

export const SIDEBAR_WIDTH = WIDTH_EXPANDED;

const styles = StyleSheet.create({
  sidebar: {
    width: WIDTH_EXPANDED,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: 20,
    paddingHorizontal: 14,
    gap: 20,
  },
  sidebarCollapsed: {
    width: WIDTH_COLLAPSED,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRowCollapsed: {
    justifyContent: 'center',
    width: '100%',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  brandCollapsed: {
    paddingHorizontal: 0,
  },
  brandLogo: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  brandText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  toggleBtn: {
    padding: 6,
    borderRadius: 8,
  },
  nav: {
    gap: 2,
    flex: 1,
    width: '100%',
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
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    gap: 0,
  },
  navItemActive: {
    backgroundColor: colors.goldDim,
    borderColor: colors.gold + '40',
  },
  navIconWrap: {
    position: 'relative',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  badgeDotHot: {
    backgroundColor: colors.gold,
    borderColor: colors.surface,
  },
  footer: {
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  footerCollapsed: {
    alignItems: 'center',
    width: '100%',
  },
  footerIconBtn: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  langBadge: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
