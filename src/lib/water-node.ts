const NodeCycleIndex = [
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
function createNodeCycle(): NodeCycle {
  return {
    Sunday: false,
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
  } as const;
}
export class WaterNode {
  private cycle: NodeCycle = createNodeCycle();
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
