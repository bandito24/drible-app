import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useBluetoothConnection } from "@/contexts/ble-manager-context";
import useBLE from "@/hooks/use-ble";
import { useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { AppStyles } from "@/lib/styles";
import { Device } from "react-native-ble-plx";

export default function DiscoverScreen() {
  const { stopDeviceScan, startScanning, scannedDevices, scanErrors } = useBLE();
  useEffect(() => {
    console.log("Scan Error:", scanErrors);
  }, [scanErrors]);

  useEffect(() => {
    startScanning();
    return () => {
      stopDeviceScan();
    };
  }, []);
  const devices = Object.values(scannedDevices);
  console.log(devices.length);
  return (
    <ThemedView>
      {devices.length ? (
        devices.map((device) => <ScannedDeviceCard device={device} />)
      ) : (
        <ThemedText>No Devices Yet Fucko...</ThemedText>
      )}
    </ThemedView>
  );
}
function ScannedDeviceCard({ device }: { device: Device }) {
  const theme = useTheme();
  const rssiIndication = getRssiStatus(device.rssi);
  const styles = useStyleSheet();
  return (
    <TouchableOpacity style={styles.card}>
      <ThemedText style={styles.cardText}>{device?.name ?? "Unknown Name"}</ThemedText>
      <View style={{ justifyContent: "center" }}>
        <View
          style={{
            backgroundColor: rssiIndication.color,
            minWidth: 0,
            borderRadius: 20,
            justifyContent: "center",
            width: "auto",
            alignSelf: "center",
          }}
        >
          <ThemedText style={{ fontSize: AppStyles.fontSize.sm, fontWeight: 400, padding: 5 }}>
            {rssiIndication.description}: {device.rssi}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function useStyleSheet() {
  const theme = useTheme();

  const styles = StyleSheet.create({
    card: {
      alignItems: "center",
      borderRadius: 10,
      padding: 10,
      width: 350,
      borderColor: theme.accent,
      borderWidth: 2,
      margin: 5,
    },
    cardText: {
      fontSize: AppStyles.fontSize.xl,
      fontWeight: "bold",
      color: theme.accent,
      marginBottom: 10,
    },
  });
  return styles;
}
const RSSI_STATUS = {
  excellent: {
    color: "#16A34A",
    description: "Excellent",
  },
  good: {
    color: "#65A30D",
    description: "Good",
  },
  fair: {
    color: "#EAB308",
    description: "Fair",
  },
  weak: {
    color: "#F97316",
    description: "Weak",
  },
  veryWeak: {
    color: "#EF4444",
    description: "Very weak",
  },
  unusable: {
    color: "#991B1B",
    description: "Likely unusable",
  },
} as const;

function getRssiStatus(rssi: number | null) {
  if (rssi === null) {
    return RSSI_STATUS.unusable;
  }

  if (rssi >= -50) {
    return RSSI_STATUS.excellent;
  } else if (rssi >= -60) {
    return RSSI_STATUS.good;
  } else if (rssi >= -67) {
    return RSSI_STATUS.fair;
  } else if (rssi >= -70) {
    return RSSI_STATUS.weak;
  } else if (rssi >= -80) {
    return RSSI_STATUS.veryWeak;
  } else {
    return RSSI_STATUS.unusable;
  }
}
