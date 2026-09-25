import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import Toast from "react-native-toast-message";
import { BluetoothConnectionProvider } from "@/contexts/ble-manager-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function StackLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />

      <BluetoothConnectionProvider>
        <Stack
          // See React Navigation documentation for more information on available screenOptions: https://reactnavigation.org/docs/headers/#sharing-common-options-across-screens
          screenOptions={{
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen name="index" options={{ title: "Drippet System" }} />
          <Stack.Screen name="[device]" options={{ title: "Homie" }} />
        </Stack>

        <Toast topOffset={insets.top + 8} />
      </BluetoothConnectionProvider>
    </ThemeProvider>
  );
}
