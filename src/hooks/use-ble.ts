/* eslint-disable no-bitwise */
import { useBluetoothConnection } from "@/contexts/ble-manager-context";
import { ConnectionState } from "@/enums/connection-state";
import { ScanState } from "@/enums/scan-state";
import NotifyUi from "@/util/notify-ui";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [scanErrors, setScanErrors] = useState<BleError[]>([]);

  //NOTE: Id is UUID on mac
  const [connectedDevices, setConnectedDevices] = useState<Record<string, Device>>({});
  const [scanningStatus, setScanningStatus] = useState<ScanState>(ScanState.IDLE);
  const [connectionSemaphoreTaken, setConnectionSemaphoreTaken] = useState<boolean>(true);
  const connectionQueue = useRef(new Map<string, Device>());

  async function stopDeviceScan() {
    await bleManager.stopDeviceScan();
    console.log("Done Scanning");
    setScanningStatus(ScanState.IDLE);
  }
  async function startScanning() {
    await waitUntilBluetoothReady();
    console.log("Now Scanning");
    setScanningStatus(ScanState.SCANNING);
    setTimeout(async () => {
      await stopDeviceScan();
      await processQueue();
    }, 5000);
    //FIX: Use a reference to store ids to prevent race conditions on connect

    bleManager.startDeviceScan(
      null,
      // servicesArr,
      { allowDuplicates: false },
      async (err: BleError | null, device: Device | null) => {
        console.log("Discovered Device. Name: " + device?.name);
        if (device && device?.name === "Drippet" && !connectionQueue.current.has(device.id)) {
          const alreadyConnected = await bleManager.isDeviceConnected(device.id);
          if (alreadyConnected) {
            return;
          }
          connectionQueue.current.set(device.id, device);
        } else if (err) {
          console.error("stop scanning due to err");
          setScanErrors((prev) => [...prev, err]);
          await bleManager.stopDeviceScan();
          setScanningStatus(ScanState.IDLE);
        }
      },
    );
  }

  async function processQueue() {
    connectionQueue.current.forEach(async (device, id) => {
      console.log("conn queue running");
      console.log("should work");
      const isAlreadyConnected = await bleManager.isDeviceConnected(id);
      if (!isAlreadyConnected) {
        await connectDevice(device);
      }

      connectionQueue.current.delete(id);
    });
  }

  //useEffect(() => {
  //  async function processConnectionQueue() {
  //    console.log("conn queue running");
  //    if (connectedDevices.length) {
  //      return;
  //    }
  //    if (connectionQueue.length) {
  //      console.log("should work");
  //      const nextDevice = connectionQueue[0];
  //      const isAlreadyConnected = await bleManager.isDeviceConnected(nextDevice.id);
  //      if (!isAlreadyConnected) {
  //        await connectDevice(nextDevice);
  //      }
  //      setConnectionQueue((prev) => prev.filter((dev) => dev.id !== nextDevice.id));
  //    }
  //  }
  //  processConnectionQueue();
  //}, [connectionQueue]);
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
      console.log("1: entering connectDevice", device.id);

      console.log("2: stopping scan");
      await stopDeviceScan();
      console.log("3: scan stopped");

      console.log("4: calling device.connect()", device.id);
      const connected = await device.connect();
      console.log("5: CONNECTED", connected.id);

      setConnectedDevices((prev) => ({
        ...prev,
        [connected.id]: connected,
      }));
      //  NotifyUi.alertInfo("Connected With New Device");
      // const sub = connected.onDisconnected(async (err, disconnected) => {
      //   setConnectedDevices((prev) => {
      //     const tmp = { ...prev };
      //     delete tmp?.[disconnected.id];
      //     return tmp;
      //   });
      //   NotifyUi.alertInfo("Connected Device Disconnected");
      //   sub.remove();

      //   if (err) {
      //     NotifyUi.alertErr((err?.reason ?? "no reason") + (err?.stack ?? "no stack"));
      //   } else {
      //     await connectDevice(disconnected);
      //   }
      // });
    } catch (e) {
      console.error(e);
    }
  }

  return {
    scanningStatus,
    stopDeviceScan,
    scanErrors,
    startScanning,
    connectedDevices,
  };
}

export default useBLE;
