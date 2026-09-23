import { ThemedText } from "@/components/themed-text";
import { GATT } from "@/constants/gatt-chars";
import { useBluetoothConnection } from "@/contexts/ble-manager-context";
import useBLE from "@/hooks/use-ble";
import ByteIf from "@/lib/ByteIf";
import { WaterNode } from "@/lib/water-node";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import base64 from "react-native-base64";

export default function Device() {
  const { bleManager } = useBluetoothConnection();
  const [waterNodes, setWaterNodes] = useState<WaterNode[]>([]);
  const { connectedDevices } = useBLE();
  const { device: deviceId } = useLocalSearchParams<{ device: string }>();
  const device = connectedDevices[deviceId];
  const fetchData = useCallback(async () => {
    const config = await bleManager.readCharacteristicForDevice(
      deviceId,
      GATT.SERVICE,
      GATT.DURATIONS_CHAR,
    );
    if (!config.value) {
      throw new Error("Unreadable characteristic read");
    }
    const test = ByteIf.b64toBytes(config.value);
    const waterNode = new WaterNode(test);
    setWaterNodes((prev) => [...prev, waterNode]);

    console.log(test);
    console.log(waterNode.toString());
  }, []);
  useEffect(() => {
    fetchData();
  }, [deviceId]);
  useEffect(() => {
    waterNodes.forEach((val) => {
      console.log(val.toString());
    });
  }, [waterNodes]);

  return <ThemedText>Hi there, {deviceId}</ThemedText>;
}
