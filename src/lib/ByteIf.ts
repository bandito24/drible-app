import { NodeCycleIndex } from "@/constants/drippet";
import { GATT } from "@/constants/gatt-chars";
import { BleManager } from "react-native-ble-plx";
import MakeNotification from "./MakeNotification";

export type IncomingBytes = Uint8Array<ArrayBuffer>;
export default class BleIf {
  public static b64toBytes(base64Str: string): IncomingBytes {
    return Uint8Array.from(atob(base64Str), (c) => c.charCodeAt(0));
  }
  public static bytesToB64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  public static async writeBle(
    characteristic: (typeof GATT)[keyof typeof GATT],
    bleManager: BleManager,
    deviceId: string,
    data: Uint8Array,
  ) {
    try {
      await bleManager.writeCharacteristicWithResponseForDevice(
        deviceId,
        GATT.SERVICE,
        characteristic,
        this.bytesToB64(data),
      );
    } catch (e) {
      MakeNotification.alertFailed("Writing Data to Drippet Failed");
      console.error(e);
    }
  }

  public static async readBle(
    characteristic: (typeof GATT)[keyof typeof GATT],
    bleManager: BleManager,
    deviceId: string,
  ) {
    try {
      const data = await bleManager.readCharacteristicForDevice(
        deviceId,
        GATT.SERVICE,
        characteristic,
      );
      if (!data.value) {
        throw new Error("Did not receive value in gatt char read request");
      }
      return BleIf.b64toBytes(data.value);
    } catch (e) {
      MakeNotification.alertFailed("Reading Data from Drippet Failed");
      console.error(e);
    }
  }

  public static printSystemTime(bytes: IncomingBytes) {
    const sysTime = to12Hour(bytes[0], bytes[1]);
    const day = NodeCycleIndex[bytes[2]];
    const nextPhaseSet = bytes[3];
    const phaseTime = to12Hour(bytes[4], bytes[5]);

    return `Current System Time is ${sysTime} and the day is ${day}. The next watering period is ${nextPhaseSet ? phaseTime : "not set"}.`;
  }
}

function to12Hour(hour: number, minute: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const paddedMinute = minute.toString().padStart(2, "0");
  return `${hour12}:${paddedMinute} ${period}`;
}
