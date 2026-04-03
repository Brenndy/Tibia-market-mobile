import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from 'react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { WorldProvider } from '@/src/context/WorldContext';
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <WorldProvider>
          <StatusBar style="light" backgroundColor={colors.background} />
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
                title: 'Szczegóły przedmiotu',
                headerBackTitle: 'Market',
              }}
            />
            <Stack.Screen
              name="world-select"
              options={{
                title: 'Wybierz świat',
                presentation: 'modal',
              }}
            />
          </Stack>
        </WorldProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
