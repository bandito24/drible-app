import { GATT } from "@/constants/gatt-chars";
import { BleManager, Device } from "react-native-ble-plx";
import BleIf from "./ByteIf";
import { DrippetCmd, NodeCycle, NodeCycleIndex } from "@/constants/drippet";

export class DrippetHead {
  private device: Device;
  private bleManager: BleManager;
  public waterNodes: WaterNode[] = [];
  public constructor(device: Device, bleManager: BleManager) {
    if (!device) {
      throw new Error("Device not provided for DrippetHead constructor");
    }
    this.device = device;
    this.bleManager = bleManager;
  }
  public get nodeCount() {
    return this.waterNodes.length;
  }
  public async init() {
    await Promise.all([this.buildWaterNodes()]);
  }
  private async buildWaterNodes() {
    const dataIn = await this.getDurations();
    if (!dataIn || dataIn.length % 3 != 0) {
      throw new Error(
        "Invalid data length for node durations. Should be 3--length is: " +
        (dataIn?.length ?? " missing"),
      );
    }
    for (let i = 0; i < dataIn.length; i += 3) {
      this.waterNodes.push(new WaterNode(dataIn.slice(i, i + 3)));
    }
  }
  public getDurations() {
    return DrippetHead.getDrippetDurations(this.bleManager, this.device.id);
  }
  public async getNodeStates() {
    return await BleIf.readBle(GATT.NODE_STAT_CHAR, this.bleManager, this.device.id);
  }

  public async getSysConfig() {
    return await BleIf.readBle(GATT.SYS_CONF_CHAR, this.bleManager, this.device.id);
  }
  public static async getDrippetDurations(bleManager: BleManager, deviceId: string) {
    return await BleIf.readBle(GATT.DURATIONS_CHAR, bleManager, deviceId);
  }

  // Events are notify-only, so they can't be read. Writes are queued on the
  // Drippet, and the result for each one arrives here as [cmd, status, nodeIndex].
  public onEvent(callback: (event: Uint8Array) => void) {
    return this.bleManager.monitorCharacteristicForDevice(
      this.device.id,
      GATT.SERVICE,
      GATT.RESPONSE_CHAR,
      (err, characteristic) => {
        if (err) {
          console.error(err);
          return;
        }
        if (characteristic?.value) {
          callback(BleIf.b64toBytes(characteristic.value));
        }
      },
    );
  }

  public async setTime(hour: number, minute: number) {
    assertTime(hour, minute);
    await this.writeConfig(Uint8Array.of(DrippetCmd.WRITE_CONF_TIME, hour, minute));
  }
  public async setPhase(phase: number) {
    assertByte(phase, 0, NodeCycleIndex.length - 1, "phase");
    await this.writeConfig(Uint8Array.of(DrippetCmd.WRITE_CONF_PHASE, phase));
  }
  public async setPhaseTime(hour: number, minute: number) {
    assertTime(hour, minute);
    await this.writeConfig(Uint8Array.of(DrippetCmd.WRITE_CONF_TIME_PHASE, hour, minute));
  }
  public async initPairing() {
    await this.writeConfig(Uint8Array.of(DrippetCmd.INIT_PAIRING));
  }

  public async setNodeDuration(nodeIndex: number, minutes: number) {
    assertByte(nodeIndex, 0, 255, "nodeIndex");
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 0xffff) {
      throw new RangeError(`duration must be an integer from 0 to 65535, got ${minutes}`);
    }
    const bytes = Uint8Array.of(DrippetCmd.WRITE_NODE_DURATION, nodeIndex, 0, 0);
    new DataView(bytes.buffer).setUint16(2, minutes, true);
    await this.writeDurations(bytes);
  }
  public async setNodeCycle(nodeIndex: number, cycle: NodeCycle) {
    assertByte(nodeIndex, 0, 255, "nodeIndex");
    await this.writeDurations(
      Uint8Array.of(DrippetCmd.WRITE_NODE_CYCLE, nodeIndex, WaterNode.cycleToBitmask(cycle)),
    );
  }

  private writeConfig(bytes: Uint8Array) {
    return BleIf.writeBle(GATT.SYS_CONF_CHAR, this.bleManager, this.device.id, bytes);
  }
  private writeDurations(bytes: Uint8Array) {
    return BleIf.writeBle(GATT.DURATIONS_CHAR, this.bleManager, this.device.id, bytes);
  }
}

function assertByte(value: number, min: number, max: number, name: string) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer from ${min} to ${max}, got ${value}`);
  }
}
function assertTime(hour: number, minute: number) {
  assertByte(hour, 0, 23, "hour");
  assertByte(minute, 0, 59, "minute");
}

export class WaterNode {
  private _cycle: NodeCycle = {
    Sunday: false,
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
  };
  private _duration: number;

  public constructor(dataIn: Uint8Array<ArrayBuffer>) {
    this._duration = dataIn[0] | (dataIn[1] << 8);
    this.bitmaskToCycle(dataIn[2]);
  }
  private bitmaskToCycle(bitmask: number) {
    for (let i = 0; i < Object.keys(NodeCycleIndex).length; i++) {
      if (bitmask & (1 << i)) {
        this._cycle[NodeCycleIndex[i]] = true;
      }
    }
  }
  // Inverse of bitmaskToCycle: bit i is set when NodeCycleIndex[i] is on
  public static cycleToBitmask(cycle: NodeCycle) {
    let bitmask = 0;
    NodeCycleIndex.forEach((day, i) => {
      if (cycle[day]) {
        bitmask |= 1 << i;
      }
    });
    return bitmask;
  }
  get duration() {
    return this._duration;
  }
  get cycle() {
    return this._cycle;
  }
  public toString() {
    return {
      duration: this.duration,
      cycle: this.cycle,
    };
  }
}
