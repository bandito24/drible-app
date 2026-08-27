import { createContext, ReactElement, ReactNode, useContext, useMemo } from "react";
import { BleManager, LogLevel } from "react-native-ble-plx";

type BluetoothConnectionContextProps = {
  bleManager: BleManager;
};

const BluetoothConnectionContext = createContext<BluetoothConnectionContextProps | null>(null);

export function BluetoothConnectionProvider({ children }: { children: ReactNode }) {
  const bleManager = useMemo(() => new BleManager(), []);

  return (
    <BluetoothConnectionContext.Provider value={{ bleManager }}>
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
