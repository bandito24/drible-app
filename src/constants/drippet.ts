export const NodeCycleIndex = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type Days = (typeof NodeCycleIndex)[number];
export type NodeCycle = {
  [K in Days]: boolean;
};

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

// First byte of every write payload. Mirrors BLE::Cmds in drippet_head/main/core/include/ble_types.hpp
export const DrippetCmd = {
  WRITE_CONF_TIME: 0,
  WRITE_NODE_DURATION: 1,
  WRITE_NODE_CYCLE: 2,
  WRITE_CONF_PHASE: 3,
  WRITE_CONF_TIME_PHASE: 4,
  INIT_PAIRING: 5,
} as const;
