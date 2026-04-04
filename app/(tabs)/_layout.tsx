import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { useWatchlist, isAlertTriggered } from '@/src/context/WatchlistContext';
import { useMarketBoard } from '@/src/hooks/useMarket';
import { useWorld } from '@/src/context/WorldContext';

function WatchBellIcon({ color, size }: { color: string; size: number }) {
  const { watchlist } = useWatchlist();
  const { selectedWorld } = useWorld();
  const { data } = useMarketBoard(selectedWorld, { rows: 2000 });

  const triggered = watchlist.some((a) => {
    const item = data?.items.find((i) => i.name === a.itemName);
    const t = isAlertTriggered(a, item?.buy_offer ?? null, item?.sell_offer ?? null);
    return t.buy || t.sell;
  });

  return (
    <View>
      <MaterialCommunityIcons name="bell" size={size} color={color} />
      {triggered && (
        <View style={{
          position: 'absolute',
          top: -2,
          right: -4,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.gold,
          borderWidth: 1,
          borderColor: colors.tabBar,
        }} />
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.gold,
        headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Market',
          tabBarLabel: 'Market',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="store" size={size} color={color} />
          ),
          headerTitle: 'Tibia Market',
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Alerty',
          tabBarLabel: 'Alerty',
          tabBarIcon: ({ color, size }) => <WatchBellIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statystyki',
          tabBarLabel: 'Statystyki',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Ulubione',
          tabBarLabel: 'Ulubione',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
