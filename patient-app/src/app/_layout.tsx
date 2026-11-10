
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  Stack,
  useRouter,
  useSegments,
} from "expo-router";

import {
  ActivityIndicator,
  View,
  useColorScheme,
} from "react-native";

import { useEffect } from "react";

import { AuthProvider, useAuth } from "@/context/AuthContext";

function AuthNavigation() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const currentRoute = segments[0] as string | undefined;

  const inAuthScreen =
    currentRoute === "login" || currentRoute === "register";

  useEffect(() => {
    if (isLoading || !currentRoute) return;

    if (!user && !inAuthScreen) {
      router.replace("/login" as any);
    } else if (user && inAuthScreen) {
      router.replace("/(tabs)" as any);
    }
  }, [user, isLoading, currentRoute, inAuthScreen, router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F8FAFC",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="explore" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <AuthProvider>
        <AuthNavigation />
      </AuthProvider>
    </ThemeProvider>
  );
}
