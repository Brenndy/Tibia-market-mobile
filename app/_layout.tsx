import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from 'react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import RouteSEO from '@/src/components/SEOHead';
import SEOContent from '@/src/components/SEOContent';
import { WorldProvider } from '@/src/context/WorldContext';
import { WatchlistProvider } from '@/src/context/WatchlistContext';
import { LanguageProvider, useTranslation } from '@/src/context/LanguageContext';
import { ToastProvider } from '@/src/context/ToastContext';
import { colors } from '@/src/theme/colors';

// Normalize dynamic routes so Vercel Speed Insights aggregates per route
// template (e.g. /item/rope + /item/lobster → /item/[name]) instead of
// recording each URL separately.
function normalizeRoute(pathname: string | null): string | null {
  if (!pathname) return null;
  if (pathname.startsWith('/item/')) return '/item/[name]';
  return pathname;
}

function WebAnalytics() {
  const pathname = usePathname();
  const route = normalizeRoute(pathname);
  return (
    <>
      <Analytics />
      <SpeedInsights route={route} />
    </>
  );
}

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
      <Stack.Screen name="privacy" options={{ title: t('privacy_title') }} />
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
      {Platform.OS === 'web' && <RouteSEO />}
      {Platform.OS === 'web' && <SEOContent />}
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <WorldProvider>
            <WatchlistProvider>
              <ToastProvider>
                <StatusBar style="light" backgroundColor={colors.background} />
                {Platform.OS === 'web' && <WebAnalytics />}
                <AppNavigator />
              </ToastProvider>
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
