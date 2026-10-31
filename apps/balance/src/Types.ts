// Types to be extended
export interface aircraftProps {
  aircraft: aircraftT;
  setAircraft: (arg0: aircraftT) => void;
}

export interface configProps {
  config: configT;
  setConfig: (arg0: configT) => void;
}

export interface loadingProps {
  loading: loadingT;
  setLoading: (arg0: loadingT) => void;
}

export interface nameProps {
  name?: string;
}

export interface momentObjectT {
  arm: number;
  weight: number;
}

const DiagramModes = {
  All: 0, // Show all seat/cargo positions
  Config: 1, // Show seat/cargo positions in config
  Ops: 2, // Show seat/cargo and ops loading in config
  Loading: 3, // Show seat/cargo, ops, loading
} as const;

type DiagramModes = (typeof DiagramModes)[keyof typeof DiagramModes]
export { DiagramModes }

// Loading data

export interface passengerT {
  location: string; // ID of seat
  count: number;
  avgWeight: number;
}

export interface cargoT {
  location: string; // ID of cargo
  weight: number;
}

export interface fuelLoadT {
  tank: string; // ID of tank
  loadedFuel: number;
  tripFuel: number;
}

export interface loadingT {
  fuel: fuelLoadT[];
  passengers: passengerT[];
  cargo: cargoT[];
}

// Data structure interfaces

export interface maxMomentObjectT {
  arm: number;
  maxWeight: number;
}

export interface operationConfigT {
  id: string;
  name: string;
  config: string;
  seats: { id: string; weight: number }[];
  cargoAreas: { id: string; weight: number }[];
}

export interface aircraftConfigT {
  id: string;
  name: string;
  seats: string[];
  cargoAreas: string[];
  equipment: { id: string; count: number }[],
  fuelTanks: string[];
}

export interface equipmentT extends momentObjectT {
  id: string;
  name: string;
  area: string;
}

export interface weightLimitT {
  id: string;
  name: string;
  color?: string;
  lineStyle?: string;
  weight?: number;
}

export interface regionPointT extends momentObjectT {
  id: string;
}

export interface regionT {
  id: string;
  name: string;
  color?: string;
  lineStyle?: string;
  data: regionPointT[];
}

export interface aircraftLimitsT {
  regions: regionT[];
  limits: weightLimitT[];
}

export interface seatT extends maxMomentObjectT {
  id: string;
  name: string;
  lateralDist: number;
  seatCount: number;
}

export interface cargoAreaT extends maxMomentObjectT {
  id: string;
  name: string;
}

export interface fuelTankT extends maxMomentObjectT {
  id: string;
  name: string;
  unusable: number;
  removable: boolean;
  priority?: number;
}

export interface aircraftPropertiesT {
  tailNumber: string;
  type: string;
  emptyWeight: number;
  emptyArm: number
  leadingEdgeMAC: number;
  mac: number;
}

export interface aircraftT {
  id: string;
  properties: aircraftPropertiesT;
  limits: aircraftLimitsT;
  seats: seatT[];
  cargoAreas: cargoAreaT[];
  fuelTanks: fuelTankT[];
  equipment: equipmentT[];
  aircraftConfigs: aircraftConfigT[];
  operationConfigs: operationConfigT[];
}

export const weightUnits = ['lbs', 'kg', 'oz', 'g'] as const;
export const lengthUnits = ["in", "ft", "m", "cm", "mm"] as const;
export const volumeUnits = ['gal', 'liters', 'ml'] as const;
export const fuelUnits = [...volumeUnits, ...weightUnits] as const;

export type weightUnitsT = typeof weightUnits[number];
export type lengthUnitsT = typeof lengthUnits[number];
export type volumeUnitsT = typeof volumeUnits[number];
export type fuelUnitsT = (volumeUnitsT | weightUnitsT);

// These are what determine the units used when saving to the actual config file
// If these are changed the conversion factors must also be changed
export const baseWeightUnit: weightUnitsT = "lbs";
export const baseLengthUnit: lengthUnitsT = "in";
export const baseVolumeUnit: volumeUnitsT = "gal";
export const baseFuelUnit: fuelUnitsT = "lbs";

export interface setupT {
  weightUnits: typeof weightUnits[number];
  lengthUnits: typeof lengthUnits[number];
  fuelUnits: typeof fuelUnits[number];
  useMAC: boolean;
  fuelDensity: number;
}

export interface configT {
  id: string;
  name: string;
  aircraft: aircraftT[];
  setup: setupT;
}
