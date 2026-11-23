import Handlebars from "handlebars"
import { type ReactNode } from "react";
import { renderToString } from 'react-dom/server';
import { baseFuelUnit, baseLengthUnit, baseWeightUnit, DiagramModes, type aircraftT, type fuelUnitsT, type lengthUnitsT, type loadingT, type setupT, type weightUnitsT } from "../../../Types";
import { calculateBalanceForLanding, calculateBalanceForOperationConfig, calculateBalanceForTakeoff, calculateBalanceForZeroFuel, calculateEmptyBalanceForConfig, calculateMAC, roundNumber, validateAircraft, withinRegion } from '../../../utility';
import { convertFuelUnits, convertLengthUnit, convertWeightUnit, unitPrecision } from '../../../UnitsContext';
import Graph, { type graphOptionsT } from '../../../Graph';
import Diagram from '../../../Diagram';
import dayjs from 'dayjs';
import type { templateT } from './apiStructs'

interface globalsT {
  user: Record<string, string>;
  units: setupT;
  graph: (options: graphOptionsT) => ReactNode;
  diagram: string;

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
  getSeatPassengers: (id: string) => number;
  getSeatWeight: (id: string) => number;
  getSeatArm: (id: string) => number;
  getCargoWeight: (id: string) => number;
  getCargoArm: (id: string) => number,
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

  const graph = (options: graphOptionsT) => (<Graph aircraft={aircraft} loading={loading} selectedOpsConfig={selectedOpsConfig} selectedConfig={aircraft.operationConfigs[opsConfigIndex].config} _options={options} />);
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
  emptyWeight = roundNumber(convertWeightUnit(emptyWeight, baseWeightUnit, units.weightUnits), unitPrecision);
  emptyArm = roundNumber(convertLengthUnit(emptyArm, baseLengthUnit, units.lengthUnits), unitPrecision);
  let [configWeight, configArm] = calculateEmptyBalanceForConfig(aircraft, aircraft.operationConfigs[opsConfigIndex].config)
  configWeight = roundNumber(convertWeightUnit(configWeight, baseWeightUnit, units.weightUnits), unitPrecision);
  configArm = roundNumber(convertLengthUnit(configArm, baseLengthUnit, units.lengthUnits), unitPrecision);
  let [opsWeight, opsArm] = calculateBalanceForOperationConfig(aircraft, selectedOpsConfig);
  opsWeight = roundNumber(convertWeightUnit(opsWeight, baseWeightUnit, units.weightUnits), unitPrecision);
  opsArm = roundNumber(convertLengthUnit(opsArm, baseLengthUnit, units.lengthUnits), unitPrecision);
  let [zeroFuelWeight, zeroFuelArm] = calculateBalanceForZeroFuel(aircraft, selectedOpsConfig, loading);
  zeroFuelWeight = roundNumber(convertWeightUnit(zeroFuelWeight, baseWeightUnit, units.weightUnits), unitPrecision);
  zeroFuelArm = roundNumber(convertLengthUnit(zeroFuelArm, baseLengthUnit, units.lengthUnits), unitPrecision);
  let [landingWeight, landingArm] = calculateBalanceForLanding(aircraft, selectedOpsConfig, loading);
  landingWeight = roundNumber(convertWeightUnit(landingWeight, baseWeightUnit, units.weightUnits), unitPrecision);
  landingArm = roundNumber(convertLengthUnit(landingArm, baseLengthUnit, units.lengthUnits), unitPrecision);
  let [takeoffWeight, takeoffArm] = calculateBalanceForTakeoff(aircraft, selectedOpsConfig, loading);
  takeoffWeight = roundNumber(convertWeightUnit(takeoffWeight, baseWeightUnit, units.weightUnits), unitPrecision);
  takeoffArm = roundNumber(convertLengthUnit(takeoffArm, baseLengthUnit, units.lengthUnits), unitPrecision);

  const numCrew = aircraft.operationConfigs[opsConfigIndex].seats.reduce((sum, p) => sum + Math.ceil(p.weight / 200), 0);

  const crewWeight = roundNumber(convertWeightUnit(aircraft.operationConfigs[opsConfigIndex].seats.reduce((sum, p) => sum + p.weight, 0), baseWeightUnit, units.weightUnits), unitPrecision);
  const crewArm = crewWeight === 0 ? 0 : roundNumber(convertLengthUnit(aircraft.operationConfigs[opsConfigIndex].seats.reduce((sum, p) => { const s = aircraft.seats.find(s => s.id === p.id); if (!s) return sum; return sum + (p.weight * s.arm) }, 0) / crewWeight, baseLengthUnit, units.lengthUnits), unitPrecision);

  const crewCargoWeight = roundNumber(convertWeightUnit(aircraft.operationConfigs[opsConfigIndex].cargoAreas.reduce((sum, c) => sum + c.weight, 0), baseWeightUnit, units.weightUnits), unitPrecision);
  const crewCargoArm = crewCargoWeight === 0 ? 0 : roundNumber(convertLengthUnit(aircraft.operationConfigs[opsConfigIndex].cargoAreas.reduce((sum, c) => { const C = aircraft.cargoAreas.find(v => v.id === c.id); if (!C) return sum; return sum + (c.weight * C.arm) }, 0) / crewCargoWeight, baseLengthUnit, baseLengthUnit), unitPrecision);

  const numPassengers = loading.passengers.reduce((sum, p) => sum + p.count, 0);

  const passengerWeight = roundNumber(convertWeightUnit(loading.passengers.reduce((sum, s) => sum + s.avgWeight * s.count, 0), baseWeightUnit, units.weightUnits), unitPrecision);
  const passengerArm = passengerWeight === 0 ? 0 : roundNumber(convertLengthUnit(loading.passengers.reduce((sum, s) => { const S = aircraft.seats.find(v => v.id === s.location); if (!S) return sum; return sum + (s.avgWeight * s.count * S.arm) }, 0) / passengerWeight, baseLengthUnit, units.lengthUnits), unitPrecision);

  const cargoWeight = roundNumber(convertWeightUnit(loading.cargo.reduce((sum, c) => sum + c.weight, 0), baseWeightUnit, units.weightUnits), unitPrecision);
  const cargoArm = cargoWeight === 0 ? 0 : roundNumber(convertLengthUnit(loading.cargo.reduce((sum, c) => { const area = aircraft.cargoAreas.find(C => C.id === c.location); if (!area) return sum; return sum + (c.weight * area?.arm) }, 0) / cargoWeight, baseLengthUnit, units.lengthUnits), unitPrecision);

  const equipmentWeight = roundNumber(convertWeightUnit(aircraft.aircraftConfigs[configIndex].equipment.reduce((sum, e) => { const equip = aircraft.equipment.find(E => E.id === e.id); if (!equip) return sum; return sum + e.count * equip.weight }, 0), baseWeightUnit, units.weightUnits), unitPrecision);
  const equipmentArm = equipmentWeight === 0 ? 0 : roundNumber(convertLengthUnit(aircraft.aircraftConfigs[configIndex].equipment.reduce((sum, e) => { const equip = aircraft.equipment.find(E => E.id === e.id); if (!equip) return sum; return sum + e.count * equip.weight * equip.arm }, 0) / equipmentWeight, baseLengthUnit, units.lengthUnits), unitPrecision);

  const totalFuel = roundNumber(convertFuelUnits(loading.fuel.reduce((sum, f) => sum + f.loadedFuel, 0), baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision);
  const totalFuelWeight = roundNumber(convertFuelUnits(totalFuel, units.fuelUnits, units.weightUnits, units.fuelDensity), unitPrecision);
  const totalFuelArm = totalFuelWeight === 0 ? 0 : roundNumber(convertFuelUnits(loading.fuel.reduce((sum, f) => { const t = aircraft.fuelTanks.find(v => v.id === f.tank); if (!t) return sum; return sum + (t.arm * f.loadedFuel) }, 0), units.fuelUnits, units.weightUnits, units.fuelDensity) / totalFuelWeight, unitPrecision);
  const fuelBurn = roundNumber(convertFuelUnits(loading.fuel.reduce((sum, f) => sum + f.tripFuel, 0), baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision);
  const fuelBurnWeight = roundNumber(convertFuelUnits(fuelBurn, units.fuelUnits, units.weightUnits, units.fuelDensity), unitPrecision);
  const landingFuel = totalFuel - fuelBurn;
  const landingFuelWeight = roundNumber(convertFuelUnits(landingFuel, units.fuelUnits, units.weightUnits, units.fuelDensity), unitPrecision);
  const landingFuelArm = landingFuelWeight === 0 ? 0 : roundNumber(convertFuelUnits(loading.fuel.reduce((sum, f) => { const t = aircraft.fuelTanks.find(v => v.id === f.tank); if (!t) return sum; return sum + (t.arm * f.loadedFuel) }, 0), units.fuelUnits, units.weightUnits, units.fuelDensity) / landingFuelWeight, unitPrecision);

  const getMac = (arm: number) => roundNumber(calculateMAC(convertLengthUnit(arm, units.lengthUnits, baseLengthUnit), aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, true), unitPrecision);

  const getSeatPassengers = (seatName: string) => {
    const seat = aircraft.seats.find(s => s.name === seatName)
    if (!seat) return -1;
    const pax = loading.passengers.find(p => p.location === seat.id)
    return (pax ? pax.count : 0);
  }

  const getSeatWeight = (seatName: string) => {
    const seat = aircraft.seats.find(s => s.name === seatName)
    if (!seat) return -1;
    const pax = loading.passengers.find(p => p.location === seat.id)
    return (pax ? pax.avgWeight * pax.count : 0);
  }

  const getSeatArm = (seatName: string) => {
    const seat = aircraft.seats.find(s => s.name === seatName)
    if (!seat) return -1;
    return seat.arm;
  }

  const getCargoWeight = (cargoAreaName: string) => {
    const cargoArea = aircraft.cargoAreas.find(c => c.name === cargoAreaName)
    if (!cargoArea) return -1;
    const cargo = loading.cargo.find(c => c.location === cargoArea.id)
    const opsCargo = aircraft.operationConfigs[opsConfigIndex].cargoAreas.find(p => p.id === cargoArea.id);
    return (cargo ? cargo.weight : 0) + (opsCargo ? opsCargo.weight : 0);
  }

  const getCargoArm = (cargoAreaName: string) => {
    const cargoArea = aircraft.cargoAreas.find(c => c.name === cargoAreaName)
    if (!cargoArea) return -1;
    return cargoArea.arm;
  }

  const getLimit = (limitName: string) => {
    const limit = aircraft.limits.limits.find(l => l.name === limitName);
    return limit && limit.weight ? convertWeightUnit(limit.weight, baseWeightUnit, units.weightUnits) : 0;
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
    getSeatPassengers: getSeatPassengers,
    getSeatWeight: getSeatWeight,
    getSeatArm: getSeatArm,
    getCargoWeight: getCargoWeight,
    getCargoArm: getCargoArm,
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
  Handlebars.registerHelper("getSeatPassengers", (name: string) => globalData.getSeatPassengers(name));
  Handlebars.registerHelper("getSeatWeight", (name: string) => globalData.getSeatWeight(name));
  Handlebars.registerHelper("getSeatArm", (name: string) => globalData.getSeatArm(name));
  Handlebars.registerHelper("getCargoWeight", (name: string) => globalData.getCargoWeight(name));
  Handlebars.registerHelper("getCargoArm", (name: string) => globalData.getCargoArm(name));
  Handlebars.registerHelper("getLimit", (name: string) => globalData.getLimit(name));
  Handlebars.registerHelper("withinRegionL", (name: string, weight: number, arm: number) => globalData.withinRegion(name, weight, arm));
  Handlebars.registerHelper("convertWeight", (weight: number, unit: weightUnitsT) => globalData.convertWeight(weight, unit));
  Handlebars.registerHelper("convertLength", (length: number, unit: lengthUnitsT) => globalData.convertLength(length, unit));
  Handlebars.registerHelper("convertFuel", (fuel: number, unit: fuelUnitsT) => globalData.convertFuel(fuel, unit));
  return T(globalData);
}
