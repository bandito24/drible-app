import { createContext, ReactElement, ReactNode, useContext, useEffect, useMemo } from "react";

import { ScanState } from "@/enums/scan-state";
import MakeNotification from "@/lib/MakeNotification";
import { useRef, useState } from "react";

import { BleError, BleManager, Characteristic, Device, State } from "react-native-ble-plx";

const SERVICES = {
  DurationsChar: "00000025-1212-efde-1523-785feabcd123",
  NodeStatChar: "01000025-1212-efde-1523-785feabcd123",
  SysConfChar: "02000025-1212-efde-1523-785feabcd123",
  ResponseChar: "03000025-1212-efde-1523-785feabcd123",
};
const servicesArr = Object.values(SERVICES);

function useBLE({ bleManager }: { bleManager: BleManager }) {
  const [scanErrors, setScanErrors] = useState<BleError[]>([]);

  //NOTE: Id is UUID on mac
  const [connectedDevices, setConnectedDevices] = useState<Record<string, Device>>({});
  const [scanningStatus, setScanningStatus] = useState<ScanState>(ScanState.IDLE);
  const connectionQueue = useRef(new Map<string, Device>());
  const timeoutRef = useRef<undefined | ReturnType<typeof setTimeout>>(undefined);

  async function stopDeviceScan() {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = undefined;
    await bleManager.stopDeviceScan();
    console.log("Done Scanning");
    setScanningStatus(ScanState.IDLE);
  }
  async function startScanning() {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = undefined;
    try {
      await waitUntilBluetoothReady();
    } catch {
      MakeNotification.alertFailed("Please Turn Bluetooth On");
      return;
    }
    console.log("Now Scanning");
    setScanningStatus(ScanState.SCANNING);
    timeoutRef.current = setTimeout(async () => {
      await stopDeviceScan();
      await processQueue();
    }, 5000);

    bleManager.startDeviceScan(
      null,
      // servicesArr,
      { allowDuplicates: false },
      async (err: BleError | null, device: Device | null) => {
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
    for (const [id, device] of connectionQueue.current) {
      const isAlreadyConnected = await bleManager.isDeviceConnected(id);
      if (!isAlreadyConnected) {
        await connectDevice(device);
      }
      connectionQueue.current.delete(id);
    }
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
      const connected = await device.connect();
      await device.discoverAllServicesAndCharacteristics();
      console.log("CONNECTED", connected.id);

      setConnectedDevices((prev) => ({
        ...prev,
        [connected.id]: connected,
      }));
      MakeNotification.alertSuccess("Successfully added device");
      const sub = device.onDisconnected((err: BleError | null, device: Device) => {
        sub.remove();
        console.log(device);
        console.log(err);
        MakeNotification.alertFailed("Drippet Device Has Lost Connection");
        setConnectedDevices((prev) => {
          const { [device.id]: _, ...updated } = prev;
          return updated;
        });
      });
      console.log("should work");
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

type BluetoothConnectionContextProps = {
  bleManager: BleManager;
  useBle: ReturnType<typeof useBLE>;
};

const BluetoothConnectionContext = createContext<BluetoothConnectionContextProps | null>(null);

export function BluetoothConnectionProvider({ children }: { children: ReactNode }) {
  const bleManager = useMemo(() => new BleManager(), []);
  const ble = useBLE({ bleManager });

  return (
    <BluetoothConnectionContext.Provider value={{ bleManager, useBle: ble }}>
      {children}
    </BluetoothConnectionContext.Provider>
  );
}

export const useBluetoothConnection = () => {
  const context = useContext(BluetoothConnectionContext);

  if (!context) {
    throw new Error("useBluetoothConnection must be used with BluetoothConnectionProvider");
  }

  return context;
};
