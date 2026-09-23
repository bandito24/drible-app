import * as Device from "expo-device";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
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
import { useEffect, useState } from "react";
import { ScannedDeviceCard } from "@/components/discovery-components";

export default function HomeScreen() {
  const theme = useTheme();
  const [performedInitalScan, setPerformedInitialScan] = useState<boolean>(false);
  const { startScanning, connectedDevices, scanningStatus, stopDeviceScan } = useBLE();

  const devices = Object.values(connectedDevices);

  useEffect(() => {
    if (!devices.length) {
      startScanning();
    }
  }, []);
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          {scanningStatus === ScanState.SCANNING ? (
            <ThemedView>
              <ActivityIndicator size="large" color="#00ff00" />
              <ThemedText>Scanning For Devices</ThemedText>
            </ThemedView>
          ) : null}
          {devices.length ? (
            devices.map((device) => <ScannedDeviceCard key={device.id} device={device} />)
          ) : scanningStatus === ScanState.IDLE ? (
            <ThemedText>No Discoverable Drippets...</ThemedText>
          ) : null}
          <ThemedView
            style={{
              position: "absolute",
              display: "flex",
              bottom: 0,
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            {scanningStatus === ScanState.IDLE ? (
              <TouchableOpacity style={styles.button} onPress={startScanning}>
                <ThemedText>Scan For New Devices</ThemedText>
                <Lucide name="bluetooth-searching" size={30} color={theme.accent} />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity onPress={stopDeviceScan} style={styles.button}>
                  <ThemedText>Stop Scanning</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </ThemedView>
        </ThemedView>
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
