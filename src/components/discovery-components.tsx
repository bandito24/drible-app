import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useBluetoothConnection } from "@/contexts/ble-manager-context";
import useBLE from "@/hooks/use-ble";
import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { AppStyles } from "@/lib/styles";
import { Device } from "react-native-ble-plx";
import { GATT } from "@/constants/gatt-chars";
import { Link } from "expo-router";

export default function DiscoverScreen() {
  const { stopDeviceScan, startScanning, scanErrors, connectedDevices } = useBLE();
  useEffect(() => {
    console.log("Scan Error:", scanErrors);
  }, [scanErrors]);

  useEffect(() => {
    startScanning();
    return () => {
      stopDeviceScan();
    };
  }, []);
  const devices = Object.values(connectedDevices);
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
export function ScannedDeviceCard({ device }: { device: Device }) {
  const theme = useTheme();
  const [rssi, setRssi] = useState<null | number>(null);
  useEffect(() => {
    async function readRssi() {
      //  const services = await device.readCharacteristicForService(GATT.SERVICE, GATT.SYS_CONF_CHAR);

      //  console.log(services.value);
      const readDevice = await device.readRSSI();
      setRssi(readDevice.rssi);
    }
    const interval = setInterval(() => {
      readRssi();
    }, 5000);

    readRssi();
    return () => {
      clearInterval(interval);
    };
  }, []);
  const rssiIndication = getRssiStatus(rssi);
  const styles = useStyleSheet();
  return (
    <Link href={{ pathname: "/[device]", params: { device: device.id } }} asChild>
      <TouchableOpacity style={styles.card}>
        <ThemedText style={styles.cardText}>{device?.name ?? "Unknown Name"}</ThemedText>

        <View
          style={{
            alignContent: "center",
            justifyContent: "center",
            visibility: rssi ? "visible" : "hidden",
          }}
        >
          <View
            style={{
              backgroundColor: rssiIndication.color,
              width: 200,
              borderRadius: 20,
              alignContent: "center",
              alignItems: "center",
            }}
          >
            <ThemedText
              style={{
                fontSize: AppStyles.fontSize.sm,
                fontWeight: 400,
                padding: 5,
              }}
            >
              {rssiIndication.description}: {rssi}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
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
