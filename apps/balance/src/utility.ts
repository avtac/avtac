import { fuelUnits, lengthUnits, weightUnits, type aircraftLimitsT, type aircraftPropertiesT, type aircraftT, type cargoAreaT, type configT, type fuelLoadT, type fuelTankT, type loadingT, type maxMomentObjectT, type momentObjectT, type regionT, type seatT, type setupT, type weightLimitT, type equipmentT, type aircraftConfigT } from './Types';

export const activeConfigBuilder = "activeConfigBuilder"
export const savedBuilderConfigs = "savedBuilderConfigs"
export const activeConfigData = "activeConfig"
export const uploadedConfigs = "savedConfigs"

export function getSortedByArm<T extends (maxMomentObjectT | momentObjectT)>(data: T[]) {
  const tmp: T[] = JSON.parse(JSON.stringify(data));
  return tmp.sort((a, b) => {
    return a.arm - b.arm;
  }).filter((s: T) => s != undefined);
}

export function getSortedByArmClosest<T extends (maxMomentObjectT | momentObjectT)>(data: T[], target: number) {
  const tmp: T[] = JSON.parse(JSON.stringify(data));
  return tmp.sort((a, b) => Math.abs(a.arm - target) - Math.abs(b.arm - target))
    .filter(s => s != undefined);
}

export function calculateMAC(arm: number, mac: (number | undefined), leadingMac: (number | undefined), useMAC: boolean = false): number {
  if (!useMAC || leadingMac == undefined || mac == undefined || mac == 0) return arm;
  return (arm - leadingMac) / mac * 100;
}

function linesIntersect(p11: momentObjectT, p12: momentObjectT, p21: momentObjectT, p22: momentObjectT): number {
  const a1 = p12.weight - p11.weight;
  const b1 = p11.arm - p12.arm;
  const c1 = (p12.arm * p11.weight) - (p11.arm * p12.weight);

  let d1 = (a1 * p21.arm) + (b1 * p21.weight) + c1;
  let d2 = (a1 * p22.arm) + (b1 * p22.weight) + c1;

  if (d1 > 0 && d2 > 0) return 0;
  if (d1 < 0 && d2 < 0) return 0;

  const a2 = p22.weight - p21.weight;
  const b2 = p21.arm - p22.arm;
  const c2 = (p22.arm * p21.weight) - (p21.arm * p22.weight);

  d1 = (a2 * p11.arm) + (b2 * p11.weight) + c2;
  d2 = (a2 * p12.arm) + (b2 * p12.weight) + c2;

  if (d1 > 0 && d2 > 0) return 0;
  if (d1 < 0 && d2 < 0) return 0;

  if ((a1 * b2) - (a2 * b1) === 0) return 2;

  return 1;
}

export const withinRegion = (region: regionT, weight: number, arm: number) => {
  // Quick bounding box check
  const minWeight = region.data.reduce((min, p) => p.weight < min ? p.weight : min, region.data[0].weight);
  const maxWeight = region.data.reduce((max, p) => p.weight > max ? p.weight : max, region.data[0].weight);
  const minArm = region.data.reduce((min, p) => p.arm < min ? p.arm : min, region.data[0].arm);
  const maxArm = region.data.reduce((max, p) => p.arm > max ? p.arm : max, region.data[0].arm);
  if (weight < minWeight || weight > maxWeight || arm < minArm || arm > maxArm) return false;

  let intersections = 0;
  for (let p = 0; p < region.data.length - 1; p++) {
    intersections += linesIntersect({ arm: minArm - 1, weight: weight }, { arm: arm, weight: weight }, region.data[p], region.data[p + 1]);
  }

  return (intersections & 1) === 1;
}

export function calculateEmptyBalanceForConfig(config: aircraftT, selectedConfig: string): [number, number] {
  let weight = config.properties.emptyWeight;
  let moment = config.properties.emptyWeight * config.properties.emptyArm;

  const selectedConfigIndex = config.aircraftConfigs.findIndex(v => v.id === selectedConfig);

  // Fuel
  config.fuelTanks.map(
    (fuelTank) => {
      const usedTank = !fuelTank.removable || config.aircraftConfigs[selectedConfigIndex].fuelTanks.includes(fuelTank.id);
      if (!usedTank) return;
      weight += Math.max(Number(fuelTank.unusable), 0);
      moment += Math.max(Number(fuelTank.unusable), 0) * fuelTank.arm;
    });

  // Equipment
  if (selectedConfigIndex < 0) return [weight, moment / weight];
  config.aircraftConfigs[selectedConfigIndex].equipment.map(
    (equipment) => {
      const equipIndex = config.equipment.findIndex(e => e.id === equipment.id);
      if (equipIndex < 0) return;
      weight += Math.max(Number(equipment.count), 0) * Math.max(Number(config.equipment[equipIndex].weight), 0);
      moment += Math.max(Number(equipment.count), 0) * Math.max(Number(config.equipment[equipIndex].weight), 0) * config.equipment[equipIndex].arm;
    });
  return [weight, moment / weight]
}

export function calculateMaxBalanceForConfig(config: aircraftT, selectedConfig: string): [number, number] {
  let weight = config.properties.emptyWeight;
  let moment = config.properties.emptyWeight * config.properties.emptyArm;

  const selectedConfigIndex = config.aircraftConfigs.findIndex(v => v.id === selectedConfig);
  if (selectedConfigIndex < 0) return [weight, moment / weight];

  // Seats
  config.aircraftConfigs[selectedConfigIndex].seats.map(
    (seat) => {
      const seatIndex = config.seats.findIndex(s => s.id === seat);
      if (seatIndex < 0) return;
      const seatData = config.seats[seatIndex];
      weight += Math.max(Number(seatData.maxWeight), 0) * Math.max(Number(seatData.seatCount), 0);
      moment += Math.max(Number(seatData.maxWeight), 0) * Math.max(Number(seatData.seatCount), 0) * seatData.arm;
    });

  // Cargo
  config.aircraftConfigs[selectedConfigIndex].cargoAreas.map(
    (cargoArea) => {
      const cargoAreaIndex = config.cargoAreas.findIndex(c => c.id === cargoArea);
      if (cargoAreaIndex < 0) return;
      const cargoAreaData = config.cargoAreas[cargoAreaIndex];
      weight += Math.max(Number(cargoAreaData.maxWeight), 0);
      moment += Math.max(Number(cargoAreaData.maxWeight), 0) * cargoAreaData.arm;
    });

  // Fuel
  config.fuelTanks.map(
    (fuelTank) => {
      const usedTank = !fuelTank.removable || config.aircraftConfigs[selectedConfigIndex].fuelTanks.includes(fuelTank.id);
      if (!usedTank) return;
      weight += Math.max(Number(fuelTank.maxWeight), 0);
      moment += Math.max(Number(fuelTank.maxWeight), 0) * fuelTank.arm;
    });

  // Equipment
  config.aircraftConfigs[selectedConfigIndex].equipment.map(
    (equipment) => {
      const equipIndex = config.equipment.findIndex(e => e.id === equipment.id);
      if (equipIndex < 0) return;
      const equipmentData = config.equipment[equipIndex];
      weight += Math.max(Number(equipment.count), 0) * Math.max(Number(equipmentData.weight), 0);
      moment += Math.max(Number(equipment.count), 0) * Math.max(Number(equipmentData.weight), 0) * equipmentData.arm;
    });
  return [weight, moment / weight]
}

export function calculateBalanceForOperationConfig(config: aircraftT, selectedOpsConfig: string): [number, number] {
  const selectedOpsConfigIndex = config.operationConfigs.findIndex(v => v.id === selectedOpsConfig);
  if (selectedOpsConfigIndex < 0) return [0, 0];

  let [weight, arm] = calculateEmptyBalanceForConfig(config, config.operationConfigs[selectedOpsConfigIndex].config);
  let moment = weight * arm;

  // Seats
  config.operationConfigs[selectedOpsConfigIndex].seats.map(
    (seat) => {
      const seatIndex = config.seats.findIndex(s => s.id === seat.id);
      if (seatIndex < 0) return;
      const seatData = config.seats[seatIndex];
      weight += Math.max(Number(seat.weight), 0);
      moment += Math.max(Number(seat.weight), 0) * seatData.arm;
    });

  // Cargo
  config.operationConfigs[selectedOpsConfigIndex].cargoAreas.map(
    (cargoArea) => {
      const cargoAreaIndex = config.cargoAreas.findIndex(c => c.id === cargoArea.id);
      if (cargoAreaIndex < 0) return;
      const cargoAreaData = config.cargoAreas[cargoAreaIndex];
      weight += Math.max(Number(cargoArea.weight), 0);
      moment += Math.max(Number(cargoArea.weight), 0) * cargoAreaData.arm;
    });

  return [weight, moment / weight]
}

export function calculateBalanceForZeroFuel(aircraft: aircraftT, selectedOpsConfig: string, loading: loadingT): [number, number] {
  let [weight, arm] = calculateBalanceForOperationConfig(aircraft, selectedOpsConfig);
  let moment = arm * weight;

  // Passengers
  loading.passengers.forEach(
    (seat) => {
      const seatIndex = aircraft.seats.findIndex(s => s.id === seat.location);
      if (seatIndex < 0) return;
      const seatData = aircraft.seats[seatIndex];
      weight += Math.max(Number(seat.count), 0) * Math.max(Number(seat.avgWeight), 0);
      moment += Math.max(Number(seat.count), 0) * Math.max(Number(seat.avgWeight), 0) * seatData.arm;
    }
  )

  // Cargo
  loading.cargo.forEach(
    (cargo) => {
      const cargoIndex = aircraft.cargoAreas.findIndex(c => c.id === cargo.location);
      if (cargoIndex < 0) return;
      const cargoData = aircraft.cargoAreas[cargoIndex];
      weight += Math.max(Number(cargo.weight), 0);
      moment += Math.max(Number(cargo.weight), 0) * cargoData.arm;
    }
  )

  // Unusable Fuel
  loading.fuel.forEach(
    (fuel) => {
      const fuelIndex = aircraft.fuelTanks.findIndex(f => f.id === fuel.tank);
      if (fuelIndex < 0) return;
      const fuelData = aircraft.fuelTanks[fuelIndex];
      weight += fuelData.unusable;
      moment += fuelData.unusable * fuelData.arm;
    }
  )

  return [weight, moment / weight];
}

export function calculateBalanceForLanding(aircraft: aircraftT, selectedOpsConfig: string, loading: loadingT): [number, number] {
  let [weight, arm] = calculateBalanceForOperationConfig(aircraft, selectedOpsConfig);
  let moment = arm * weight;

  // Passengers
  loading.passengers.forEach(
    (seat) => {
      const seatIndex = aircraft.seats.findIndex(s => s.id === seat.location);
      if (seatIndex < 0) return;
      const seatData = aircraft.seats[seatIndex];
      weight += Math.max(Number(seat.count), 0) * Math.max(Number(seat.avgWeight), 0);
      moment += Math.max(Number(seat.count), 0) * Math.max(Number(seat.avgWeight), 0) * seatData.arm;
    }
  )

  // Cargo
  loading.cargo.forEach(
    (cargo) => {
      const cargoIndex = aircraft.cargoAreas.findIndex(c => c.id === cargo.location);
      if (cargoIndex < 0) return;
      const cargoData = aircraft.cargoAreas[cargoIndex];
      weight += Math.max(Number(cargo.weight), 0);
      moment += Math.max(Number(cargo.weight), 0) * cargoData.arm;
    }
  )

  // Unused Fuel
  loading.fuel.forEach(
    (fuel) => {
      const fuelIndex = aircraft.fuelTanks.findIndex(f => f.id === fuel.tank);
      if (fuelIndex < 0) return;
      const fuelData = aircraft.fuelTanks[fuelIndex];
      weight += Math.max(Number(fuel.loadedFuel) - Number(fuel.tripFuel), 0);
      moment += (Math.max(Number(fuel.loadedFuel) - Number(fuel.tripFuel), 0)) * fuelData.arm;
    }
  )

  return [weight, moment / weight];
}

export function calculateBalanceForTakeoff(aircraft: aircraftT, selectedOpsConfig: string, loading: loadingT): [number, number] {
  let [weight, arm] = calculateBalanceForLanding(aircraft, selectedOpsConfig, loading);
  let moment = arm * weight;

  // Consumed Fuel
  loading.fuel.forEach(
    (fuel) => {
      const fuelIndex = aircraft.fuelTanks.findIndex(f => f.id === fuel.tank);
      if (fuelIndex < 0) return;
      const fuelData = aircraft.fuelTanks[fuelIndex];
      weight += Math.max(Number(fuel.tripFuel), 0);
      moment += Math.max(Number(fuel.tripFuel), 0) * fuelData.arm;
    }
  )

  return [weight, moment / weight];
}

// Priority is assumed that higher number fills last and consumes first
export function calculateBalancePointsForTanks(aircraft: aircraftT, selectedOpsConfig: string, loading: loadingT): momentObjectT[] {
  var groupBy = (xs: { tank: fuelTankT, load: fuelLoadT }[]) => {
    return xs.reduce((rv: { [key: number]: { tank: fuelTankT, load: fuelLoadT }[] }, x) => {
      (rv[x.tank.priority ?? 0] ??= []).push(x);
      return rv;
    }, {});
  };

  // Get tanks sorted on priority
  const tankData = loading.fuel.map(t => {
    let tank = aircraft.fuelTanks.find(T => t.tank === T.id);
    if (tank === undefined) return;
    return { tank: tank, load: t };
  })
    .filter(t => t != undefined)
  const grouped = groupBy(tankData);

  // Get landing balance
  let [weight, arm] = calculateBalanceForTakeoff(aircraft, selectedOpsConfig, loading);
  let moment = arm * weight;
  const points: momentObjectT[] = [{ weight: weight, arm: arm }];

  // Loop over each tank group
  for (const [_, group] of Object.entries(grouped).reverse()) {

    // Sort the tank group data by consumed fuel
    const sortedGroup = group.sort((a, b) => a.load.tripFuel - b.load.tripFuel);

    // Loop over each tank in group and add a point as each tank empties
    let totalConsumedFuel = 0;
    for (const { tank: _, load: load } of Object.values(sortedGroup)) {
      // Get the segment of consumed fuel by all tanks in group
      let segmentConsumedFuel = Math.max(load.tripFuel - totalConsumedFuel, 0);
      // Remove the segment fuel amount from each tank in group if they more to give
      for (const { tank: fuelTankI, load: loadI } of Object.values(sortedGroup)) {
        if (totalConsumedFuel >= loadI.tripFuel) continue;
        weight -= (Math.min(segmentConsumedFuel, loadI.tripFuel))
        moment -= (Math.min(segmentConsumedFuel, loadI.tripFuel)) * fuelTankI.arm;
      }
      totalConsumedFuel += segmentConsumedFuel;
      // Add point for each tank in group (TODO: This may result in duplicates)
      points.push({ weight: weight, arm: moment / weight });
    }
  }

  // Last Point (should be unnecessary as this should match takeoff load);
  points.push({ weight: weight, arm: moment / weight });
  return points;
}

export function truncateNumber(n: number, precision: number): number {
  if (n < 0) return Math.ceil(n * precision) / precision;
  return Math.floor(n * precision) / precision;
}

export function roundNumber(n: number, precision: number): number {
  return Math.round(n * precision) / precision;
}

export const saveStringToFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

function validateAircraftConfig(aircraftConfig: aircraftConfigT) {
  if (aircraftConfig === null) return "Bad aircraft config";
  if (typeof aircraftConfig !== 'object') return "Bad aircraft config";
  if (!Object.hasOwn(aircraftConfig, 'name')) return "Aircraft config missing 'name' property";
  if (typeof aircraftConfig.name !== 'string') return "Aircraft config 'name' property is incorrect type"
  if (!Object.hasOwn(aircraftConfig, 'seats')) return "Aircraft config missing 'seats' property";
  if (Array.isArray(aircraftConfig.seats)) {
    for (const seat of aircraftConfig.seats) {
      if (typeof seat !== 'string') return "Aircraft config seats 'seat' property is incorrect type"
    }
  }
  if (Array.isArray(aircraftConfig.cargoAreas)) {
    for (const cargoArea of aircraftConfig.cargoAreas) {
      if (typeof cargoArea !== 'string') return "Aircraft config cargoAreas 'cargoArea' property is incorrect type"
    }
  }
  if (Array.isArray(aircraftConfig.fuelTanks)) {
    for (const fuelTank of aircraftConfig.fuelTanks) {
      if (typeof fuelTank !== 'string') return "Aircraft config cargoAreas 'fuelTank' property is incorrect type"
    }
  }
}

function validateFuelTank(fuelTank: fuelTankT) {
  if (fuelTank === null) return "Bad aircraft fuel tanks";
  if (typeof fuelTank !== 'object') return "Bad aircraft fuel tanks";
  if (!Object.hasOwn(fuelTank, 'name')) return "Aircraft fuel tanks missing 'name' property";
  if (typeof fuelTank.name !== 'string') return "Aircraft fuel tanks 'name' property is incorrect type"
  if (!Object.hasOwn(fuelTank, 'unusable')) return "Aircraft fuel tanks missing 'unusable' property";
  if (typeof fuelTank.unusable !== 'number') return "Aircraft fuel tanks 'unusable' property is incorrect type"
  if (!Object.hasOwn(fuelTank, 'maxWeight')) return "Aircraft fuel tanks missing 'maxWeight' property";
  if (typeof fuelTank.maxWeight !== 'number') return "Aircraft fuel tanks 'maxWeight' property is incorrect type"
  if (!Object.hasOwn(fuelTank, 'arm')) return "Aircraft fuel tanks missing 'arm' property";
  if (typeof fuelTank.arm !== 'number') return "Aircraft fuel tanks 'arm' property is incorrect type"
  if (!Object.hasOwn(fuelTank, 'removable')) return "Aircraft fuel tanks missing 'removable' property";
  if (typeof fuelTank.removable !== 'boolean') return "Aircraft fuel tanks 'removable' property is incorrect type"
  if (Object.hasOwn(fuelTank, 'priority') && typeof fuelTank.priority !== 'number') return "Aircraft fuel tanks 'priority' property is incorrect type"
  return false;
}
function validateEquipment(equipment: equipmentT) {
  if (equipment === null) return "Bad aircraft equipment";
  if (typeof equipment !== 'object') return "Bad aircraft equipment";
  if (!Object.hasOwn(equipment, 'name')) return "Aircraft equipment missing 'name' property";
  if (typeof equipment.name !== 'string') return "Aircraft equipment 'name' property is incorrect type"
  if (!Object.hasOwn(equipment, 'area')) return "Aircraft equipment missing 'area' property";
  if (typeof equipment.area !== 'string') return "Aircraft equipment 'area' property is incorrect type"
  if (!Object.hasOwn(equipment, 'weight')) return "Aircraft equipment missing 'weight' property";
  if (typeof equipment.weight !== 'number') return "Aircraft equipment 'weight' property is incorrect type"
  if (!Object.hasOwn(equipment, 'arm')) return "Aircraft equipment missing 'arm' property";
  if (typeof equipment.arm !== 'number') return "Aircraft equipment 'arm' property is incorrect type"
  return false;
}

function validateCargoArea(cargoArea: cargoAreaT) {
  if (cargoArea === null) return "Bad aircraft cargoArea";
  if (typeof cargoArea !== 'object') return "Bad aircraft cargoArea";
  if (!Object.hasOwn(cargoArea, 'name')) return "Aircraft cargoArea missing 'name' property";
  if (typeof cargoArea.name !== 'string') return "Aircraft cargoArea 'name' property is incorrect type"
  if (!Object.hasOwn(cargoArea, 'maxWeight')) return "Aircraft cargoArea missing 'maxWeight' property";
  if (typeof cargoArea.maxWeight !== 'number') return "Aircraft cargoArea 'maxWeight' property is incorrect type"
  if (!Object.hasOwn(cargoArea, 'arm')) return "Aircraft cargoArea missing 'arm' property";
  if (typeof cargoArea.arm !== 'number') return "Aircraft cargoArea 'arm' property is incorrect type"
  return false;
}

function validateSeat(seat: seatT) {
  if (seat === null) return "Bad aircraft seat";
  if (typeof seat !== 'object') return "Bad aircraft seat";
  if (!Object.hasOwn(seat, 'name')) return "Aircraft seat missing 'name' property";
  if (typeof seat.name !== 'string') return "Aircraft seat 'name' property is incorrect type"
  if (!Object.hasOwn(seat, 'lateralDist')) return "Aircraft seat missing 'lateralDist' property";
  if (typeof seat.lateralDist !== 'number') return "Aircraft seat 'lateralDist' property is incorrect type"
  if (!Object.hasOwn(seat, 'seatCount')) return "Aircraft seat missing 'seatCount' property";
  if (typeof seat.seatCount !== 'number') return "Aircraft seat 'seatCount' property is incorrect type"
  if (!Object.hasOwn(seat, 'maxWeight')) return "Aircraft seat missing 'maxWeight' property";
  if (typeof seat.maxWeight !== 'number') return "Aircraft seat 'maxWeight' property is incorrect type"
  if (!Object.hasOwn(seat, 'arm')) return "Aircraft seat missing 'arm' property";
  if (typeof seat.arm !== 'number') return "Aircraft seat 'arm' property is incorrect type"
  return false;
}

function validateLimit(limit: weightLimitT) {
  if (limit === null) return "Bad aircraft limits";
  if (typeof limit !== 'object') return "Bad aircraft limits";
  if (!Object.hasOwn(limit, 'name')) return "Aircraft limits missing 'name' property";
  if (typeof limit.name !== 'string') return "Aircraft limits 'name' property is incorrect type"
  if (Object.hasOwn(limit, 'weight') && typeof limit.weight !== 'number') return "Aircraft limit 'weight' property is incorrect type";
  if (Object.hasOwn(limit, 'color') && typeof limit.color !== 'string') return "Aircraft limit 'color' property is incorrect type";
  if (Object.hasOwn(limit, 'lineStyle') && typeof limit.lineStyle !== 'string') return "Aircraft limit 'lineStyle' property is incorrect type";
  return false;
}

function validateRegion(region: regionT) {
  if (region === null) return "Bad aircraft limits";
  if (typeof region !== 'object') return "Bad aircraft limits";
  if (!Object.hasOwn(region, 'name')) return "Aircraft limits missing 'name' property";
  if (typeof region.name !== 'string') return "Aircraft limits 'name' property is incorrect type"
  if (!Object.hasOwn(region, 'data')) return "Aircraft limits missing 'name' property";
  for (const point of region.data) {
    if (Object.hasOwn(point, 'arm') && typeof point.arm !== 'number') return "Aircraft region data 'arm' is incorrect type"
    if (Object.hasOwn(point, 'weight') && typeof point.weight !== 'number') return "Aircraft region data 'weight' is incorrect type"
  }
  if (Object.hasOwn(region, 'color') && typeof region.color !== 'string') return "Aircraft limit 'color' property is incorrect type";
  if (Object.hasOwn(region, 'lineStyle') && typeof region.lineStyle !== 'string') return "Aircraft limit 'lineStyle' property is incorrect type";
  return false;
}

function validateAircraftLimits(limits: aircraftLimitsT) {
  if (limits === null) return "Bad aircraft limits";
  if (typeof limits !== 'object') return "Bad aircraft limits";
  if (!Object.hasOwn(limits, 'regions')) return "Aircraft limits missing 'regions' property";
  if (!Object.hasOwn(limits, 'limits')) return "Aircraft limits missing 'limits' property";
  for (const limit of limits.limits) {
    const limitValid = validateLimit(limit);
    if (limitValid) return limitValid;
  }
  for (const region of limits.regions) {
    const limitValid = validateRegion(region);
    if (limitValid) return limitValid;
  }
}

function validateAircraftProperties(properties: aircraftPropertiesT) {
  if (properties === null) return "Bad aircraft properties";
  if (typeof properties !== 'object') return "Bad aircraft properties";
  if (!Object.hasOwn(properties, 'tailNumber')) return "Aircraft properties missing 'tailNumber' property";
  if (typeof properties.tailNumber !== 'string') return "Aircraft properties 'tailNumber' property is incorrect type";
  if (!Object.hasOwn(properties, 'type')) return "Aircraft properties missing 'type' property";
  if (typeof properties.type !== 'string') return "Aircraft properties 'type' property is incorrect type";
  if (!Object.hasOwn(properties, 'emptyWeight')) return "Aircraft properties missing 'emptyWeight' property";
  if (typeof properties.emptyWeight !== 'number') return "Aircraft properties 'emptyWeight' property is incorrect type";
  if (!Object.hasOwn(properties, 'emptyArm')) return "Aircraft properties missing 'emptyArm' property";
  if (typeof properties.emptyArm !== 'number') return "Aircraft properties 'emptyArm' property is incorrect type";
  if (!Object.hasOwn(properties, 'leadingEdgeMAC')) return "Aircraft properties missing 'leadingEdgeMAC' property";
  if (typeof properties.leadingEdgeMAC !== 'number') return "Aircraft properties 'leadingEdgeMAC' property is incorrect type";
  if (!Object.hasOwn(properties, 'mac')) return "Aircraft properties missing 'mac' property";
  if (typeof properties.mac !== 'number') return "Aircraft properties 'mac' property is incorrect type";
  return false;
}

export function validateAircraft(aircraft: aircraftT): (string | false) {
  if (aircraft === null) return "Bad aircraft";
  if (typeof aircraft !== 'object') return "Bad aircraft";
  if (!Object.hasOwn(aircraft, 'properties')) return "Aircraft missing 'properties' property";
  const aircraftProps = validateAircraftProperties(aircraft.properties)
  if (aircraftProps) return aircraftProps;
  const aircraftLimits = validateAircraftLimits(aircraft.limits)
  if (aircraftLimits) return aircraftLimits;
  if (!Object.hasOwn(aircraft, 'limits')) return "Aircraft missing 'limits' property";
  if (typeof aircraft.limits !== 'object') return "Aircraft 'limits' property is incorrect type";

  if (!Object.hasOwn(aircraft, 'seats')) return "Aircraft missing 'seats' property";
  for (const seat of aircraft.seats) {
    const seatValid = validateSeat(seat);
    if (seatValid) return seatValid;
  }

  if (!Object.hasOwn(aircraft, 'cargoAreas')) return "Aircraft missing 'cargoAreas' property";
  for (const cargoArea of aircraft.cargoAreas) {
    const cargoAreaValid = validateCargoArea(cargoArea);
    if (cargoAreaValid) return cargoAreaValid;
  }

  if (!Object.hasOwn(aircraft, 'fuelTanks')) return "Aircraft missing 'fuelTanks' property";
  for (const fuelTank of aircraft.fuelTanks) {
    const fuelTankValid = validateFuelTank(fuelTank);
    if (fuelTankValid) return fuelTankValid;
  }

  if (!Object.hasOwn(aircraft, 'equipment')) return "Aircraft missing 'equipment' property";
  for (const equipment of aircraft.equipment) {
    const equipmentValid = validateEquipment(equipment);
    if (equipmentValid) return equipmentValid;
  }

  if (!Object.hasOwn(aircraft, 'aircraftConfigs')) return "Aircraft missing 'aircraftConfigs' property";
  for (const aircraftConfig of aircraft.aircraftConfigs) {
    const configValid = validateAircraftConfig(aircraftConfig);
    if (configValid) return configValid;
  }

  if (!Object.hasOwn(aircraft, 'operationConfigs')) return "Aircraft missing 'operationConfigs' property";
  if (!Array.isArray(aircraft.operationConfigs)) return "Aircraft 'operationConfigs' property is incorrect type";
  return false;
}

function validateSetupProperties(setup: setupT) {
  if (setup === null) return "Bad setup";
  if (typeof setup !== 'object') return "Bad setup";
  if (!Object.hasOwn(setup, 'weightUnits')) return "Setup missing 'weightUnits' property"
  if (!weightUnits.includes(setup.weightUnits)) return "Setup with invalid 'weightUnits' value"
  if (!Object.hasOwn(setup, 'lengthUnits')) return "Setup missing 'lengthUnits' property"
  if (!lengthUnits.includes(setup.lengthUnits)) return "Setup with invalid 'lengthUnits' value"
  if (!Object.hasOwn(setup, 'fuelUnits')) return "Setup missing 'fuelUnits' property"
  if (!fuelUnits.includes(setup.fuelUnits)) return "Setup with invalid 'fuelUnits' value"
  if (!Object.hasOwn(setup, 'useMAC')) return "Setup missing 'useMAC' property"
  if (typeof setup.useMAC !== 'boolean') return "Setup with invalid 'useMAC' value"
  if (!Object.hasOwn(setup, 'fuelDensity')) return "Setup missing 'fuelDensity' property"
  if (typeof setup.fuelDensity !== 'number') return "Setup with invalid 'fuelDensity' value"
  return false;
}

export function validateConfig(config: Object): (string | false) {
  if (config === null) return "Bad config";
  if (typeof config !== 'object') return "Bad config";
  if (!Object.hasOwn(config as configT, 'setup')) return "Config missing 'setup' property";
  const setupProps = validateSetupProperties((config as configT).setup)
  if (setupProps) return setupProps;
  if (!Object.hasOwn(config, 'name')) return "Config missing 'name' property";
  if (typeof (config as configT).name !== 'string') return "Config 'name' property is incorrect type";

  if (!Object.hasOwn(config, 'aircraft')) return "Config missing 'aircraft' property";
  if (!Array.isArray((config as configT).aircraft)) return "Config 'aircraft' property is incorrect type";
  const aircraft = (config as configT).aircraft
  for (const plane of aircraft) {
    const resp = validateAircraft(plane);
    if (resp) return resp;
  }

  return false;
}
