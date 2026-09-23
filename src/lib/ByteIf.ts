import { GATT } from "@/constants/gatt-chars";
import { BleManager } from "react-native-ble-plx";
import { NodeCycleIndex } from "./water-node";

export type IncomingBytes = Uint8Array<ArrayBuffer>;
export default class BleIf {
  public static b64toBytes(base64Str: string): IncomingBytes {
    return Uint8Array.from(atob(base64Str), (c) => c.charCodeAt(0));
  }

  public static async readBle(
    characteristic: (typeof GATT)[keyof typeof GATT],
    bleManager: BleManager,
    deviceId: string,
  ) {
    const config = await bleManager.readCharacteristicForDevice(
      deviceId,
      GATT.SERVICE,
      characteristic,
    );
    if (!config.value) {
      throw new Error("Did not receive value in gatt char read request");
    }
    return BleIf.b64toBytes(config.value);
  }

  printSystemTime(bytes: IncomingBytes) {
    const sysTime = to12Hour(bytes[0], bytes[1]);
    const day = NodeCycleIndex[bytes[2]];
    const phaseTime = to12Hour(bytes[4], bytes[5]);
  }
}

function to12Hour(hour: number, minute: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const paddedMinute = minute.toString().padStart(2, "0");
  return `${hour12}:${paddedMinute} ${period}`;
}
