import { ThemedText } from "@/components/themed-text";
import { GATT } from "@/constants/gatt-chars";
import { useBluetoothConnection } from "@/contexts/ble-manager-context";
import ByteIf from "@/lib/ByteIf";
import { DrippetHead, WaterNode } from "@/lib/drippet-node";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import base64 from "react-native-base64";

import { getTimeZone } from "react-native-localize";

export default function Device() {
  const {
    bleManager,
    useBle: { connectedDevices },
  } = useBluetoothConnection();

  const { device: deviceId } = useLocalSearchParams<{ device: string }>();
  const drippet = useRef<DrippetHead | undefined>(null);
  useEffect(() => {
    console.log(connectedDevices);
    if (connectedDevices?.[deviceId]) {
      console.log("DOING");
      drippet.current = new DrippetHead(connectedDevices[deviceId], bleManager);
      initDrippet();
    } else {
      console.log("WONT WORK");
    }
    async function initDrippet() {
      if (drippet.current) {
        await drippet.current.init();
        setWaterNodes(drippet.current.waterNodes);
        const data = await drippet.current.getSysConfig();
        console.log("data is", data);
        const now = new Date();
        const time = { day: now.getDay(), hour: now.getHours(), minute: now.getMinutes() };
        //FIX: Set time and phase as one endpoint rather than separate
        await drippet.current.setTime(time.hour, time.minute);
        await drippet.current.setPhase(time.day);
        if (data) {
          console.log(ByteIf.printSystemTime(data));
        }
        console.log(time);
      } else {
        console.log("NO DRIPPET CURR");
      }
    }
  }, [connectedDevices]);

  const [waterNodes, setWaterNodes] = useState<WaterNode[]>([]);
  const device = connectedDevices[deviceId];

  useEffect(() => {
    console.log(`has ${waterNodes.length} water nodes`);
  }, [waterNodes]);

  return <ThemedText>Hi there</ThemedText>;
}
