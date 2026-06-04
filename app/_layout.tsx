import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { useChatStore } from '../stores/chatStore';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Sora_400Regular,
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { ConfirmModal } from '../components/ui/ConfirmModal';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours (for offline capability)
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days cache
      retry: 1, // Only retry once to avoid infinite hanging when offline
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { user, setUser, clearUser } = useAuthStore();
  const setUserId = useChatStore((s) => s.setUserId);

  const [fontsLoaded, fontError] = useFonts({
    'Sora-Regular': Sora_400Regular,
    'Sora-SemiBold': Sora_600SemiBold,
    'Sora-Bold': Sora_700Bold,
    'DM-Sans': DMSans_400Regular,
    'DM-Sans-Medium': DMSans_500Medium,
    'DM-Sans-Bold': DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ 
          id: session.user.id, 
          email: session.user.email, 
          is_pro: false,
          username: session.user.user_metadata?.username,
          has_onboarded: session.user.user_metadata?.has_onboarded
        });
        setUserId(session.user.id);
      } else {
        clearUser();
        setUserId(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ 
          id: session.user.id, 
          email: session.user.email, 
          is_pro: false,
          username: session.user.user_metadata?.username,
          has_onboarded: session.user.user_metadata?.has_onboarded
        });
        setUserId(session.user.id);
      } else {
        clearUser();
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    const inAuthGroup = segments[0] === '(auth)';
    const firstSegment = segments[0];
    const secondSegment = (segments as string[])[1];
    
    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)');
      }
    } else {
      if (!user.username && secondSegment !== 'choose-username') {
        router.replace('/(auth)/choose-username');
      } else if (!user.has_onboarded && secondSegment !== 'preferences' && secondSegment !== 'choose-username') {
        router.replace('/(auth)/preferences');
      } else if (inAuthGroup) {
        if (secondSegment !== 'choose-username' && secondSegment !== 'preferences') {
          router.replace('/(tabs)/feed');
        }
      }
    }
  }, [user, segments, fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="recipe/create" options={{ headerShown: false }} />
            <Stack.Screen name="recipe/edit/[id]" options={{ headerShown: false }} />
          </Stack>
          <ConfirmModal />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
