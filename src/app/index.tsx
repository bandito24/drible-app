import * as Device from "expo-device";
import { Platform, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedIcon } from "@/components/animated-icon";
import { HintRow } from "@/components/hint-row";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WebBadge } from "@/components/web-badge";
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Link } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import useBLE from "@/hooks/use-ble";
import { ScanState } from "@/enums/scan-state";

export default function HomeScreen() {
  const theme = useTheme();
  const { startScanning, scanningStatus, stopDeviceScan } = useBLE();
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <ThemedText>No Devices Discovered Yet...</ThemedText>
          {scanningStatus === ScanState.IDLE ? (
            <TouchableOpacity style={styles.button} onPress={startScanning}>
              <ThemedText>Scan For New Devices</ThemedText>
              <Lucide name="bluetooth-searching" size={30} color={theme.accent} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={stopDeviceScan} style={styles.button}>
                Stop Scanning
              </TouchableOpacity>
            </>
          )}
        </ThemedView>

        {Platform.OS === "web" && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    flexDirection: "row",
  },
  button: {
    alignItems: "center",
    display: "flex",
    flexWrap: "nowrap",
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 0,
    width: 180,
    borderColor: "red",
    padding: 10,
    marginTop: 15,
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: "center",
  },
  code: {
    textTransform: "uppercase",
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: "stretch",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});
