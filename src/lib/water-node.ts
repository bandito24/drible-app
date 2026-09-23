import { GATT } from "@/constants/gatt-chars";
import { BleManager, Device } from "react-native-ble-plx";
import BleIf from "./ByteIf";

export const NodeCycleIndex = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

type Days = (typeof NodeCycleIndex)[number];
type NodeCycle = {
  [K in Days]: boolean;
};
export class DrippetHead {
  private device: Device;
  private waterNodes: WaterNode[] = [];
  public constructor(device: Device, durationsCharResult: Uint8Array<ArrayBuffer>) {
    this.device = device;
    this.waterNodes = this.buildWaterNodes(durationsCharResult);
  }
  public get nodeCount() {
    return this.waterNodes.length;
  }
  private buildWaterNodes(dataIn: Uint8Array<ArrayBuffer>) {
    const nodes: WaterNode[] = [];
    if (dataIn.length % 3 != 0) {
      throw new Error(
        "Invalid data length for node durations. Should be 3--length is: " + dataIn.length,
      );
    }
    for (let i = 0; i < dataIn.length; i += 3) {
      nodes.push(new WaterNode(dataIn.slice(i, i + 2)));
    }
    return nodes;
  }
  public getDurations(bleManager: BleManager) {
    return DrippetHead.getDrippetDurations(bleManager, this.device.id);
  }
  public async getNodeStates(bleManager: BleManager) {
    return await BleIf.readBle(GATT.NODE_STAT_CHAR, bleManager, this.device.id);
  }
  public static async getDrippetDurations(bleManager: BleManager, deviceId: string) {
    return await BleIf.readBle(GATT.DURATIONS_CHAR, bleManager, deviceId);
  }
}
const NODE_STATUS: Record<number, string> = {
  0: "Initializing",
  1: "Ready",
  2: "In queue",
  3: "Command sent",
  4: "Watering",
  5: "Error",
  6: "Invalid time",
  7: "Node doesn't exist",
} as const;

export class WaterNode {
  private cycle: NodeCycle = {
    Sunday: false,
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
  };
  private duration: number;

  public constructor(dataIn: Uint8Array<ArrayBuffer>) {
    this.duration = dataIn[0] | (dataIn[1] << 8);
    this.bitmaskToCycle(dataIn[2]);
  }
  private bitmaskToCycle(bitmask: number) {
    for (let i = 0; i < Object.keys(NodeCycleIndex).length; i++) {
      if (bitmask & (1 << i)) {
        this.cycle[NodeCycleIndex[i]] = true;
      }
    }
  }
  public toString() {
    return {
      duration: this.duration,
      cycle: this.cycle,
    };
  }
}
