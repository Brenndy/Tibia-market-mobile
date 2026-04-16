import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { useWatchlist, isAlertTriggered } from '@/src/context/WatchlistContext';
import { useMarketBoard } from '@/src/hooks/useMarket';
import { useWorld } from '@/src/context/WorldContext';
import { useTranslation } from '@/src/context/LanguageContext';
import { WorldBadge } from '@/src/components/WorldBadge';
import { LanguageToggle } from '@/src/components/LanguageToggle';

function WatchBellIcon({ color, size }: { color: string; size: number }) {
  const { watchlist } = useWatchlist();
  const { selectedWorld } = useWorld();
  const { data } = useMarketBoard(selectedWorld);

  const triggered = watchlist.some((a) => {
    const item = data?.items.find((i) => i.name === a.itemName);
    const t = isAlertTriggered(a, item?.buy_offer ?? null, item?.sell_offer ?? null);
    return t.buy || t.sell;
  });

  return (
    <View>
      <MaterialCommunityIcons name="bell" size={size} color={color} />
      {triggered && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.gold,
            borderWidth: 1,
            borderColor: colors.tabBar,
          }}
        />
      )}
    </View>
  );
}

function HeaderRightDefault() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 12 }}>
      <WorldBadge />
    </View>
  );
}

function HeaderLeftDefault() {
  return (
    <View style={{ marginLeft: 12 }}>
      <LanguageToggle />
    </View>
  );
}

function ClickableTitle({ title }: { title: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.navigate('/')}
      activeOpacity={0.6}
      style={{ paddingLeft: 10 }}
    >
      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 17 }}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarShowLabel: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.gold,
        headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
        headerShadowVisible: false,
        headerRight: () => <HeaderRightDefault />,
        headerLeft: () => <HeaderLeftDefault />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'TibiaTrader',
          tabBarLabel: t('tab_market'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="store" size={size} color={color} />
          ),
          headerTitle: () => <ClickableTitle title="TibiaTrader" />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: t('tab_alerts'),
          tabBarLabel: t('tab_alerts'),
          tabBarIcon: ({ color, size }) => <WatchBellIcon color={color} size={size} />,
          headerTitle: () => <ClickableTitle title={t('tab_alerts')} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: t('tab_statistics'),
          tabBarLabel: t('tab_statistics'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" size={size} color={color} />
          ),
          headerTitle: () => <ClickableTitle title={t('tab_statistics')} />,
        }}
      />
    </Tabs>
  );
}
