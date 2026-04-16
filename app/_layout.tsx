import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from 'react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { WorldProvider } from '@/src/context/WorldContext';
import { WatchlistProvider } from '@/src/context/WatchlistContext';
import { LanguageProvider, useTranslation } from '@/src/context/LanguageContext';
import { colors } from '@/src/theme/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60_000,
      cacheTime: 5 * 60_000,
    },
  },
});

function AppNavigator() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.gold,
        headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="item/[name]"
        options={{
          title: t('item_detail_title'),
          headerBackTitle: t('back_market'),
        }}
      />
      <Stack.Screen
        name="world-select"
        options={{
          title: t('select_world_title'),
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    import('@/src/services/notifications').then(
      ({ requestNotificationPermissions, registerBackgroundPriceCheck }) => {
        requestNotificationPermissions().then((granted) => {
          if (granted) registerBackgroundPriceCheck();
        });
      },
    );
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <WorldProvider>
            <WatchlistProvider>
              <StatusBar style="light" backgroundColor={colors.background} />
              {Platform.OS === 'web' && (
                <>
                  <Analytics />
                  <SpeedInsights />
                </>
              )}
              <AppNavigator />
            </WatchlistProvider>
          </WorldProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
