/* eslint-disable no-bitwise */
import { useBluetoothConnection } from "@/contexts/ble-manager-context";
import { ConnectionState } from "@/enums/connection-state";
import { ScanState } from "@/enums/scan-state";
import NotifyUi from "@/util/notify-ui";
import { useEffect, useMemo, useState } from "react";

import base64 from "react-native-base64";
import { BleError, BleManager, Characteristic, Device, State } from "react-native-ble-plx";

const SERVICES = {
  DurationsChar: "00000025-1212-efde-1523-785feabcd123",
  NodeStatChar: "01000025-1212-efde-1523-785feabcd123",
  SysConfChar: "02000025-1212-efde-1523-785feabcd123",
  ResponseChar: "03000025-1212-efde-1523-785feabcd123",
};
const servicesArr = Object.values(SERVICES);

function useBLE() {
  const { bleManager } = useBluetoothConnection();
  const [scannedDevices, setScannedDevices] = useState<Record<number, Device>>({});
  const [scanErrors, setScanErrors] = useState<BleError[]>([]);

  const [connectedDevices, setConnectedDevices] = useState<Record<number, Device>>({});
  const [scanningStatus, setScanningStatus] = useState<ScanState>(ScanState.IDLE);

  async function stopDeviceScan() {
    await bleManager.stopDeviceScan();
    setScanningStatus(ScanState.IDLE);
  }
  async function startScanning() {
    await waitUntilBluetoothReady();
    console.log("Now Scanning");
    setScanningStatus(ScanState.SCANNING);
    await bleManager.startDeviceScan(
      null,
      // servicesArr,
      { allowDuplicates: false },
      async (err: BleError | null, device: Device | null) => {
        if (device && device?.name === "Drippet" && !(device.id in connectedDevices)) {
          //TODO: Probably should use ServiceUUID but not currently broadcasting it
          const connected = await bleManager.connectToDevice(device.id);
          if (connected) {
            setConnectedDevices((prev) => {
              return { ...prev, [device.id]: device };
            });
          }
        } else if (err) {
          console.error("stop scanning due to err");
          setScanErrors((prev) => [...prev, err]);
          await bleManager.stopDeviceScan();
          setScanningStatus(ScanState.IDLE);
        }
      },
    );
  }
  function waitUntilBluetoothReady() {
    return new Promise<void>((resolve, reject) => {
      const subscription = bleManager.onStateChange((state) => {
        console.log("Bluetooth state:", state);

        switch (state) {
          case State.PoweredOn:
            subscription.remove();
            resolve();
            break;

          case State.PoweredOff:
          case State.Unauthorized:
          case State.Unsupported:
            subscription.remove();
            reject(new Error(`Bluetooth unavailable: ${state}`));
            break;

          case State.Unknown:
          case State.Resetting:
            // Keep waiting
            break;
        }
      }, true); // <-- important
    });
  }
  async function connectDevice(device: Device) {
    try {
      await bleManager.stopDeviceScan();
      setScanningStatus(ScanState.IDLE);
      const connectedDevice = await bleManager.connectToDevice(device.id);
      setConnectedDevice(connectedDevice);
    } catch (e) {
      console.error(e);
    }
  }
  useEffect(() => {
    if (!connectedDevice) return;
    const subscription = connectedDevice.onDisconnected((err: BleError | null, device: Device) => {
      setConnectedDevice(null);
      if (err) {
        NotifyUi.alertErr("Device Unexpectedly Disconnected:" + err.reason);
        return;
      }
      NotifyUi.alertInfo("Device Disconnected");
    });
    return () => {
      subscription.remove();
    };
  });

  return {
    scanningStatus,
    stopDeviceScan,
    scannedDevices,
    scanErrors,
    startScanning,
    connectedDevice,
  };
}

export default useBLE;
