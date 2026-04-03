import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

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
