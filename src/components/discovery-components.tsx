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
import {
  Signal,
  SignalHigh,
  SignalHighIcon,
  WifiZero,
  SignalLow,
  SignalMedium,
  SignalZero,
} from "lucide-react-native";

import { Lucide } from "@react-native-vector-icons/lucide";

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
            transform: [{ translateY: -5 }],
            alignItems: "center",
            justifyContent: "center",
            visibility: rssi ? "visible" : "hidden",
          }}
        >
          {rssiIndication.icon}
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
      justifyContent: "space-between",
      flexDirection: "row",
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
    },
  });
  return styles;
}
//const RSSI_STATUS = {
//  excellent: {
//    color: "#16A34A",
//    icon: <Signal />,
//    description: "Excellent",
//  },
//  good: {
//    color: "#65A30D",
//    icon: <SignalHigh />,
//    description: "Good",
//  },
//  fair: {
//    color: "#EAB308",
//    icon: <SignalMedium />,
//    description: "Fair",
//  },
//  weak: {
//    color: "#F97316",
//    icon: <SignalLow />,
//    description: "Weak",
//  },
//  veryWeak: {
//    color: "#EF4444",
//    icon: <SignalZero />,
//    description: "Very weak",
//  },
//  unusable: {
//    color: "#991B1B",
//    icon: <SignalZero />,
//    description: "Likely unusable",
//  },
//} as const;

const iconSize = 40;
const RSSI_STATUS = {
  excellent: {
    icon: <Lucide name="wifi" size={iconSize} color="#16A34A" />,
    description: "Excellent",
  },
  good: {
    icon: <Lucide name="wifi-high" size={iconSize} color="#65A30D" />,
    description: "Good",
  },
  fair: {
    icon: <Lucide name="wifi-high" size={iconSize} color="#EAB308" />,
    description: "Fair",
  },
  weak: {
    icon: <Lucide name="wifi-low" size={iconSize} color="#F97316" />,
    description: "Weak",
  },
  veryWeak: {
    icon: <Lucide name="wifi-zero" size={iconSize} color="#EF4444" />,
    description: "Very weak",
  },
  unusable: {
    icon: <Lucide name="wifi-off" size={iconSize} color="#991B1B" />,
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
