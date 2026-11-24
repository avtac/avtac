import Handlebars from "handlebars"
import { type ReactNode } from "react";
import { renderToString } from 'react-dom/server';
import { baseFuelUnit, baseLengthUnit, baseWeightUnit, DiagramModes, type aircraftT, type fuelUnitsT, type lengthUnitsT, type loadingT, type setupT, type weightUnitsT } from "../../../Types";
import { calculateBalanceForLanding, calculateBalanceForOperationConfig, calculateBalanceForTakeoff, calculateBalanceForZeroFuel, calculateEmptyBalanceForConfig, calculateMAC, roundNumber, validateAircraft, withinRegion } from '../../../utility';
import { convertFuelUnits, convertLengthUnit, convertWeightUnit, UnitContext, unitPrecision } from '../../../UnitsContext';
import Graph, { type graphOptionsT } from '../../../Graph';
import Diagram from '../../../Diagram';
import dayjs from 'dayjs';
import type { templateT } from './apiStructs'

interface globalsT {
  user: Record<string, string>;
  units: setupT;
  graph: (options: graphOptionsT) => ReactNode;
  diagram: string;

  seatNames: string[];
  cargoAreaNames: string[];
  equipmentNames: string[];

  mac: number;
  leadingMAC: number;
  aircraftType: string,
  aircraftTailNumber: string;
  aircraftConfig: string;

  emptyWeight: number;
  emptyArm: number;
  configWeight: number;
  configArm: number;
  opsWeight: number;
  opsArm: number;
  takeoffWeight: number;
  takeoffArm: number;
  landingWeight: number;
  landingArm: number;
  zeroFuelWeight: number;
  zeroFuelArm: number;

  numCrew: number;
  crewWeight: number;
  crewArm: number;
  crewCargoWeight: number,
  crewCargoArm: number;

  numPassengers: number;
  passengerWeight: number;
  passengerArm: number;

  cargoWeight: number;
  cargoArm: number;

  equipmentWeight: number,
  equipmentArm: number;

  totalFuel: number;
  totalFuelWeight: number;
  totalFuelArm: number;
  fuelBurn: number;
  fuelBurnWeight: number;
  landingFuel: number;
  landingFuelWeight: number,
  landingFuelArm: number;

  getMac: (arm: number) => number;
  getSeatSouls: (id: string) => number;
  getSeatWeight: (id: string) => number;
  getSeatArm: (id: string) => number;
  getSeatPassengers: (id: string) => number;
  getSeatPassengerWeight: (id: string) => number;
  getCargoWeight: (id: string) => number;
  getCargoArm: (id: string) => number;
  getEquipmentCount: (id: string) => number;
  getEquipmentWeight: (id: string) => number;
  getEquipmentArm: (id: string) => number;
  getLimit: (id: string) => number;
  withinRegion: (id: string, weight: number, arm: number) => boolean;
  convertWeight: (weight: number, fromUnit: weightUnitsT) => number;
  convertLength: (length: number, fromUnit: lengthUnitsT) => number;
  convertFuel: (length: number, fromUnit: fuelUnitsT) => number;
}

export function generateScopeData(aircraft: aircraftT, loading: loadingT, selectedOpsConfig: string, units: setupT, userData: Record<string, string>): (globalsT | undefined) {
  if (validateAircraft(aircraft)) return undefined;
  const opsConfigIndex = aircraft.operationConfigs.findIndex(c => c.id === selectedOpsConfig);
  if (opsConfigIndex < 0) return undefined;
  const configIndex = aircraft.aircraftConfigs.findIndex(c => c.id === aircraft.operationConfigs[opsConfigIndex].config);

  // Helper functions to reduce clutter below
  const cW = (weight: number) => roundNumber(convertWeightUnit(weight, baseWeightUnit, units.weightUnits), unitPrecision);
  const cL = (length: number) => roundNumber(convertLengthUnit(length, baseLengthUnit, units.lengthUnits), unitPrecision);
  const cF = (fuel: number) => roundNumber(convertFuelUnits(fuel, baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision);
  const cF2W = (fuel: number) => roundNumber(convertFuelUnits(fuel, units.fuelUnits, units.weightUnits, units.fuelDensity), unitPrecision);

  const graph = (options: graphOptionsT) => (<UnitContext value={units}><Graph aircraft={aircraft} loading={loading} selectedOpsConfig={selectedOpsConfig} selectedConfig={aircraft.operationConfigs[opsConfigIndex].config} _options={options} /></UnitContext>);

  const diagram = (
    <Diagram
      aircraft={aircraft}
      loading={loading}
      setLoading={(_) => { }}
      selectedOpsConfig={selectedOpsConfig}
      selectedConfig={aircraft.operationConfigs[opsConfigIndex].config}
      diagramMode={DiagramModes.Ops} />);


  const mac = convertLengthUnit(aircraft.properties.mac, baseLengthUnit, units.lengthUnits);
  const leadingEdgeMAC = convertLengthUnit(aircraft.properties.leadingEdgeMAC, baseLengthUnit, units.lengthUnits);
  const aircraftType = aircraft.properties.type;
  const aircraftTailNumber = aircraft.properties.tailNumber;
  const aircraftConfig = aircraft.operationConfigs[opsConfigIndex].name;

  let [emptyWeight, emptyArm] = calculateEmptyBalanceForConfig(aircraft, aircraft.operationConfigs[opsConfigIndex].config);
  emptyWeight = cW(emptyWeight);
  emptyArm = cL(emptyArm);
  let [configWeight, configArm] = calculateEmptyBalanceForConfig(aircraft, aircraft.operationConfigs[opsConfigIndex].config)
  configWeight = cW(configWeight);
  configArm = cL(configArm);
  let [opsWeight, opsArm] = calculateBalanceForOperationConfig(aircraft, selectedOpsConfig);
  opsWeight = cW(opsWeight);
  opsArm = cL(opsArm);
  let [zeroFuelWeight, zeroFuelArm] = calculateBalanceForZeroFuel(aircraft, selectedOpsConfig, loading);
  zeroFuelWeight = cW(zeroFuelWeight);
  zeroFuelArm = cL(zeroFuelArm);
  let [landingWeight, landingArm] = calculateBalanceForLanding(aircraft, selectedOpsConfig, loading);
  landingWeight = cW(landingWeight);
  landingArm = cL(landingArm);
  let [takeoffWeight, takeoffArm] = calculateBalanceForTakeoff(aircraft, selectedOpsConfig, loading);
  takeoffWeight = cW(takeoffWeight);
  takeoffArm = cL(takeoffArm);

  const seatNames = aircraft.seats.sort((a, b) => a.arm - b.arm).map(s => s.name);
  const cargoAreaNames = aircraft.cargoAreas.sort((a, b) => a.arm - b.arm).map(c => c.name);
  const equipmentNames = aircraft.equipment.sort((a, b) => a.arm - b.arm).map(c => c.name);

  // TODO: Convert crew to count
  const numCrew = aircraft.operationConfigs[opsConfigIndex].seats.reduce((sum, p) => sum + Math.ceil(p.weight / 200), 0);

  const crewWeight = cW(aircraft.operationConfigs[opsConfigIndex].seats.reduce((sum, p) => sum + p.weight, 0));
  const crewArm = crewWeight === 0 ? 0 : roundNumber(convertLengthUnit(aircraft.operationConfigs[opsConfigIndex].seats.reduce((sum, p) => {
    const s = aircraft.seats.find(s => s.id === p.id);
    if (!s) return sum;
    return sum + (p.weight * s.arm)
  }, 0), baseLengthUnit, units.lengthUnits) / crewWeight, unitPrecision);

  const crewCargoWeight = cW(aircraft.operationConfigs[opsConfigIndex].cargoAreas.reduce((sum, c) => sum + c.weight, 0));
  const crewCargoArm = crewCargoWeight === 0 ? 0 : roundNumber(convertLengthUnit(aircraft.operationConfigs[opsConfigIndex].cargoAreas.reduce((sum, c) => {
    const C = aircraft.cargoAreas.find(v => v.id === c.id);
    if (!C) return sum;
    return sum + (c.weight * C.arm)
  }, 0), baseLengthUnit, units.lengthUnits) / crewCargoWeight, unitPrecision);

  const numPassengers = loading.passengers.reduce((sum, p) => sum + p.count, 0);

  const passengerWeight = cW(loading.passengers.reduce((sum, s) => sum + s.avgWeight * s.count, 0));
  const passengerArm = passengerWeight === 0 ? 0 : roundNumber(convertLengthUnit(loading.passengers.reduce((sum, s) => {
    const S = aircraft.seats.find(v => v.id === s.location);
    if (!S) return sum;
    return sum + (s.avgWeight * s.count * S.arm)
  }, 0), baseLengthUnit, units.lengthUnits) / passengerWeight, unitPrecision);

  const cargoWeight = cW(loading.cargo.reduce((sum, c) => sum + c.weight, 0));
  const cargoArm = cargoWeight === 0 ? 0 : roundNumber(convertLengthUnit(loading.cargo.reduce((sum, c) => {
    const area = aircraft.cargoAreas.find(C => C.id === c.location);
    if (!area) return sum;
    return sum + (c.weight * area?.arm)
  }, 0), baseLengthUnit, units.lengthUnits) / cargoWeight, unitPrecision);

  const equipmentWeight = cW(aircraft.aircraftConfigs[configIndex].equipment.reduce((sum, e) => {
    const equip = aircraft.equipment.find(E => E.id === e.id);
    if (!equip) return sum;
    return sum + e.count * equip.weight
  }, 0));
  const equipmentArm = equipmentWeight === 0 ? 0 : roundNumber(convertLengthUnit(aircraft.aircraftConfigs[configIndex].equipment.reduce((sum, e) => {
    const equip = aircraft.equipment.find(E => E.id === e.id);
    if (!equip) return sum;
    return sum + e.count * equip.weight * equip.arm;
  }, 0), baseLengthUnit, units.lengthUnits) / equipmentWeight, unitPrecision);

  const totalFuel = cF(loading.fuel.reduce((sum, f) => sum + f.loadedFuel, 0));
  const totalFuelWeight = cF2W(totalFuel);
  const totalFuelArm = totalFuelWeight === 0 ? 0 : roundNumber(convertFuelUnits(loading.fuel.reduce((sum, f) => {
    const t = aircraft.fuelTanks.find(v => v.id === f.tank);
    if (!t) return sum;
    return sum + (t.arm * f.loadedFuel)
  }, 0), units.fuelUnits, units.weightUnits, units.fuelDensity) / totalFuelWeight, unitPrecision);

  const fuelBurn = cF(loading.fuel.reduce((sum, f) => sum + f.tripFuel, 0));
  const fuelBurnWeight = cF2W(fuelBurn);

  const landingFuel = totalFuel - fuelBurn;
  const landingFuelWeight = cF2W(landingFuel);
  const landingFuelArm = landingFuelWeight === 0 ? 0 : roundNumber(convertFuelUnits(loading.fuel.reduce((sum, f) => {
    const t = aircraft.fuelTanks.find(v => v.id === f.tank);
    if (!t) return sum;
    return sum + (t.arm * f.loadedFuel)
  }, 0), units.fuelUnits, units.weightUnits, units.fuelDensity) / landingFuelWeight, unitPrecision);

  const getMac = (arm: number) => roundNumber(calculateMAC(convertLengthUnit(arm, units.lengthUnits, baseLengthUnit), aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, true), unitPrecision);

  const getSeatSouls = (seatName: string) => {
    const seat = aircraft.seats.find(s => s.name === seatName)
    if (!seat) return -1;
    const pax = loading.passengers.find(p => p.location === seat.id)
    const opsSeat = aircraft.operationConfigs[opsConfigIndex].seats.find(p => p.id === seat.id);
    return (pax ? pax.count : 0) + (opsSeat ? Math.ceil(opsSeat.weight / seat.maxWeight) : 0);
  }

  const getSeatWeight = (seatName: string) => {
    const seat = aircraft.seats.find(s => s.name === seatName)
    if (!seat) return -1;
    const pax = loading.passengers.find(p => p.location === seat.id)
    const opsSeat = aircraft.operationConfigs[opsConfigIndex].seats.find(p => p.id === seat.id);
    return cW(pax ? pax.avgWeight * pax.count : 0) + cW(opsSeat?.weight ?? 0);
  }

  const getSeatArm = (seatName: string) => {
    const seat = aircraft.seats.find(s => s.name === seatName)
    if (!seat) return -1;
    return cL(seat.arm);
  }

  const getSeatPassengers = (seatName: string) => {
    const seat = aircraft.seats.find(s => s.name === seatName)
    if (!seat) return -1;
    const pax = loading.passengers.find(p => p.location === seat.id)
    return pax ? pax.count : 0;
  }

  const getSeatPassengerWeight = (seatName: string) => {
    const seat = aircraft.seats.find(s => s.name === seatName)
    if (!seat) return -1;
    const pax = loading.passengers.find(p => p.location === seat.id)
    return cW(pax ? pax.avgWeight * pax.count : 0);
  }

  const getCargoWeight = (cargoAreaName: string) => {
    const cargoArea = aircraft.cargoAreas.find(c => c.name === cargoAreaName)
    if (!cargoArea) return -1;
    const cargo = loading.cargo.find(c => c.location === cargoArea.id)
    const opsCargo = aircraft.operationConfigs[opsConfigIndex].cargoAreas.find(p => p.id === cargoArea.id);
    return cW(cargo ? cargo.weight : 0) + cW(opsCargo?.weight ?? 0);
  }

  const getCargoArm = (cargoAreaName: string) => {
    const cargoArea = aircraft.cargoAreas.find(c => c.name === cargoAreaName)
    if (!cargoArea) return -1;
    return cL(cargoArea.arm);
  }

  const getEquipmentCount = (equipmentName: string) => {
    const equipment = aircraft.equipment.find(e => e.name === equipmentName)
    if (!equipment) return -1;
    const equip = aircraft.aircraftConfigs[configIndex].equipment.find(p => p.id === equipment.id);
    if (!equip) return 0;
    return cL(equip.count);
  }

  const getEquipmentWeight = (equipmentName: string) => {
    const equipment = aircraft.equipment.find(e => e.name === equipmentName)
    if (!equipment) return -1;
    const equip = aircraft.aircraftConfigs[configIndex].equipment.find(p => p.id === equipment.id);
    return cW(equip ? equipment.weight * equip.count : 0);
  }

  const getEquipmentArm = (equipmentName: string) => {
    const equipment = aircraft.equipment.find(e => e.name === equipmentName)
    if (!equipment) return -1;
    return cL(equipment.arm);
  }

  const getLimit = (limitName: string) => {
    const limit = aircraft.limits.limits.find(l => l.name === limitName);
    return cW(limit?.weight ?? 0);
  }

  // Expects units to be units.weightUnits and units.lengthUnits
  const withinRegionL = (regionName: string, weight: number, arm: number) => {
    const region = aircraft.limits.regions.find((r) => r.name === regionName);
    if (!region) return false;
    return withinRegion(region, convertWeightUnit(weight, units.weightUnits, baseWeightUnit), convertLengthUnit(arm, units.lengthUnits, baseLengthUnit));
  }

  const convertWeight = (weight: number, fromUnit: weightUnitsT) => convertWeightUnit(weight, fromUnit, units.weightUnits);
  const convertLength = (length: number, fromUnit: lengthUnitsT) => convertLengthUnit(length, fromUnit, units.lengthUnits);
  const convertFuel = (fuel: number, fromUnit: fuelUnitsT) => convertFuelUnits(fuel, fromUnit, units.fuelUnits, units.fuelDensity);

  const globalData: globalsT = {
    user: userData,
    units: units,
    graph: graph,
    diagram: renderToString(diagram),

    seatNames: seatNames,
    cargoAreaNames: cargoAreaNames,
    equipmentNames: equipmentNames,

    mac: mac,
    leadingMAC: leadingEdgeMAC,
    aircraftType: aircraftType,
    aircraftTailNumber: aircraftTailNumber,
    aircraftConfig: aircraftConfig,

    emptyWeight: emptyWeight,
    emptyArm: emptyArm,
    configWeight: configWeight,
    configArm: configArm,
    opsWeight: opsWeight,
    opsArm: opsArm,
    takeoffWeight: takeoffWeight,
    takeoffArm: takeoffArm,
    landingWeight: landingWeight,
    landingArm: landingArm,
    zeroFuelWeight: zeroFuelWeight,
    zeroFuelArm: zeroFuelArm,

    numCrew: numCrew,
    crewWeight: crewWeight,
    crewArm: crewArm,
    crewCargoWeight: crewCargoWeight,
    crewCargoArm: crewCargoArm,

    numPassengers: numPassengers,
    passengerWeight: passengerWeight,
    passengerArm: passengerArm,

    cargoWeight: cargoWeight,
    cargoArm: cargoArm,

    equipmentWeight: equipmentWeight,
    equipmentArm: equipmentArm,

    totalFuel: totalFuel,
    totalFuelWeight: totalFuelWeight,
    totalFuelArm: totalFuelArm,
    fuelBurn: fuelBurn,
    fuelBurnWeight: fuelBurnWeight,
    landingFuel: landingFuel,
    landingFuelWeight: landingFuelWeight,
    landingFuelArm: landingFuelArm,

    getMac: getMac,
    getSeatSouls: getSeatSouls,
    getSeatWeight: getSeatWeight,
    getSeatArm: getSeatArm,
    getSeatPassengers: getSeatPassengers,
    getSeatPassengerWeight: getSeatPassengerWeight,
    getCargoWeight: getCargoWeight,
    getCargoArm: getCargoArm,
    getEquipmentCount: getEquipmentCount,
    getEquipmentWeight: getEquipmentWeight,
    getEquipmentArm: getEquipmentArm,
    getLimit: getLimit,
    withinRegion: withinRegionL,
    convertWeight: convertWeight,
    convertLength: convertLength,
    convertFuel: convertFuel
  }

  return globalData;
}

Handlebars.registerHelper("math", (a: number, opr: string, b: number): number => {
  var values: Record<string, number> = {
    "+": a + b,
    "-": a - b,
    "*": a * b,
    "/": b !== 0 ? a / b : 0
  }
  return values[opr] ?? 0;
});
Handlebars.registerHelper("let", function(name: string, value: any, options: any) {
  options.data.root[name] = value;
  return options.fn(options.data.root);
});
Handlebars.registerHelper("object", function({ hash }) {
  return hash;
});
Handlebars.registerHelper("min", (a: number, b: number) => a < b ? a : b);
Handlebars.registerHelper("max", (a: number, b: number) => a > b ? a : b);
Handlebars.registerHelper("equal", (a: number, b: number) => a === b);
Handlebars.registerHelper("lessThan", (a: number, b: number) => a < b);
Handlebars.registerHelper("greaterThan", (a: number, b: number) => a > b);
Handlebars.registerHelper("lessThanEqual", (a: number, b: number) => a <= b);
Handlebars.registerHelper("greaterThanEqual", (a: number, b: number) => a >= b);
Handlebars.registerHelper("date", (format: string) => dayjs().format(format));
Handlebars.registerHelper("round", (n: number, precision: number) => roundNumber(n, precision));

export function generateTemplate(globalData: globalsT, template: templateT): string {
  const T = Handlebars.compile(template.body);

  Handlebars.registerHelper("graph", (options: graphOptionsT) => renderToString(globalData.graph(options)));
  Handlebars.registerHelper("getMac", (arm: number) => globalData.getMac(arm));
  Handlebars.registerHelper("getSeatSouls", (name: string) => globalData.getSeatSouls(name));
  Handlebars.registerHelper("getSeatWeight", (name: string) => globalData.getSeatWeight(name));
  Handlebars.registerHelper("getSeatArm", (name: string) => globalData.getSeatArm(name));
  Handlebars.registerHelper("getSeatPassengers", (name: string) => globalData.getSeatPassengers(name));
  Handlebars.registerHelper("getSeatPassengerWeight", (name: string) => globalData.getSeatPassengerWeight(name));
  Handlebars.registerHelper("getCargoWeight", (name: string) => globalData.getCargoWeight(name));
  Handlebars.registerHelper("getCargoArm", (name: string) => globalData.getCargoArm(name));
  Handlebars.registerHelper("getEquipmentCount", (name: string) => globalData.getEquipmentCount(name));
  Handlebars.registerHelper("getEquipmentWeight", (name: string) => globalData.getEquipmentWeight(name));
  Handlebars.registerHelper("getEquipmentArm", (name: string) => globalData.getEquipmentArm(name));
  Handlebars.registerHelper("getLimit", (name: string) => globalData.getLimit(name));
  Handlebars.registerHelper("withinRegionL", (name: string, weight: number, arm: number) => globalData.withinRegion(name, weight, arm));
  Handlebars.registerHelper("convertWeight", (weight: number, unit: weightUnitsT) => globalData.convertWeight(weight, unit));
  Handlebars.registerHelper("convertLength", (length: number, unit: lengthUnitsT) => globalData.convertLength(length, unit));
  Handlebars.registerHelper("convertFuel", (fuel: number, unit: fuelUnitsT) => globalData.convertFuel(fuel, unit));
  return T(globalData);
}
