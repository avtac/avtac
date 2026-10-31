import '../../Layout.css'
import './Loading.css'
import { useContext, useRef, useState, type ReactNode, type RefObject } from "react";
import { baseFuelUnit, baseLengthUnit, baseWeightUnit, type aircraftT, type cargoAreaT, type cargoT, type fuelTankT, type loadingProps, type loadingT, type nameProps, type passengerT, type seatT } from "../../Types";
import { MultiPane, Subregion } from "../../Layout";
import { calculateBalanceForLanding, calculateBalanceForOperationConfig, calculateBalanceForTakeoff, calculateEmptyBalanceForConfig, getSortedByArm, getSortedByArmClosest, roundNumber, validateAircraft } from "../../utility";
import { convertFuelUnits, convertLengthUnit, convertWeightUnit, UnitContext, unitPrecision } from "../../UnitsContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faFillDrip } from '@fortawesome/free-solid-svg-icons';

interface seatLoadingProps extends loadingProps {
  aircraft: aircraftT;
  opsConfigIndex: number;
  seat: seatT;
}

function SeatLoading({ loading, setLoading, aircraft, opsConfigIndex, seat }: seatLoadingProps): ReactNode {
  const units = useContext(UnitContext);
  const seatIndex = aircraft.operationConfigs[opsConfigIndex].seats.findIndex(s => s.id === seat.id);
  let opsUsedSeats = 0;
  if (seatIndex >= 0)
    opsUsedSeats = Math.ceil(aircraft.operationConfigs[opsConfigIndex].seats[seatIndex].weight / seat.maxWeight)
  const opsWeight = seatIndex >= 0 ? aircraft.operationConfigs[opsConfigIndex].seats[seatIndex].weight : 0;

  const s = loading.passengers.find(s => s.location === seat.id);
  const loadedWeight = (s ? s.count * s.avgWeight : 0);
  const totalWeight = loadedWeight + opsWeight;

  function setCount(count: number): void {
    const tmp: loadingT = JSON.parse(JSON.stringify(loading));
    if (count === 0) {
      const index = tmp.passengers.findIndex(s => s.location === seat.id);
      if (index >= 0)
        tmp.passengers.splice(index, 1);
    } else if (!tmp.passengers.some(s => s.location === seat.id)) {
      const averageWeightInput = document.querySelector("#seatLoadingAverageWeight") as HTMLInputElement;
      const averageWeight = convertWeightUnit(Number(averageWeightInput.value), units.weightUnits, baseWeightUnit);
      tmp.passengers.push({ location: seat.id, avgWeight: averageWeight ? averageWeight : seat.maxWeight, count: Math.max(Math.min(count, seat.seatCount - opsUsedSeats), 0) });
    } else {
      const index = tmp.passengers.findIndex(s => s.location === seat.id);
      tmp.passengers[index].count = Math.max(Math.min(count, seat.seatCount - opsUsedSeats), 0);
    }
    setLoading(tmp);
  }

  function setWeight(weight: number): void {
    const tmp: loadingT = JSON.parse(JSON.stringify(loading));
    if (!tmp.passengers.some(s => s.location === seat.id))
      return;
    else {
      const index = tmp.passengers.findIndex(s => s.location === seat.id);
      tmp.passengers[index].avgWeight = Math.min(weight, seat.maxWeight);
    }
    setLoading(tmp);
  }

  return (
    <tr>
      <td>{seat.name}</td>
      <td className='passengerLoadingSeats'>
        {opsUsedSeats === seat.seatCount ?
          0
          :
          <input
            id={'seatCount' + seat.id}
            type='number'
            min={0}
            max={seat.seatCount - opsUsedSeats}
            value={s ? s.count : 0}
            onChange={e => setCount(Number(e.target.value))}
          />}{" / " + (seat.seatCount - opsUsedSeats)}
      </td>
      <td>
        {opsUsedSeats === seat.seatCount ?
          <p>Seats Filled</p>
          :
          <input
            id={'seatAvgWeight' + seat.id}
            type='number'
            min={0}
            max={roundNumber(convertWeightUnit(seat.maxWeight, baseWeightUnit, units.weightUnits), unitPrecision)}
            value={s && s.avgWeight > 0 ? roundNumber(convertWeightUnit(s.avgWeight, baseWeightUnit, units.weightUnits), unitPrecision) : ""}
            onChange={(e) => setWeight(convertWeightUnit(Number(e.target.value), units.weightUnits, baseWeightUnit))}
            placeholder={units.weightUnits}
          />
        }
      </td>
      <td>{roundNumber(convertWeightUnit(totalWeight, baseWeightUnit, units.weightUnits), unitPrecision)} / {roundNumber(convertWeightUnit(seat.maxWeight, baseWeightUnit, units.weightUnits), unitPrecision) * seat.seatCount} {units.weightUnits}</td>
    </tr>
  )
}

interface cargoLoadingProps extends loadingProps {
  aircraft: aircraftT;
  opsConfigIndex: number;
  cargoArea: cargoAreaT;
}

function CargoLoading({ loading, setLoading, aircraft, opsConfigIndex, cargoArea }: cargoLoadingProps): ReactNode {
  const units = useContext(UnitContext);
  const cargoAreaIndex = aircraft.operationConfigs[opsConfigIndex].cargoAreas.findIndex(s => s.id === cargoArea.id);
  const opsWeight = cargoAreaIndex >= 0 ? aircraft.operationConfigs[opsConfigIndex].cargoAreas[cargoAreaIndex].weight : 0;

  const cargo = loading.cargo.find(c => c.location === cargoArea.id);
  const loadedWeight = (cargo ? cargo.weight : 0)
  const totalWeight = loadedWeight + opsWeight

  function setWeight(weight: number): void {
    const tmp: loadingT = JSON.parse(JSON.stringify(loading));
    weight = convertWeightUnit(weight, units.weightUnits, baseWeightUnit);
    if (!tmp.cargo.some(c => c.location === cargoArea.id))
      tmp.cargo.push({ location: cargoArea.id, weight: weight });
    else {
      const index = tmp.cargo.findIndex(c => c.location === cargoArea.id);
      tmp.cargo[index].weight = Math.min(cargoArea.maxWeight - opsWeight, weight);
    }
    setLoading(tmp);
  }

  return (
    <tr>
      <td>{cargoArea.name}</td>
      <td>
        {opsWeight === cargoArea.maxWeight ?
          <p>Cargo Filled</p>
          :
          <input
            id={'cargoLoad' + cargoArea.id}
            type='number'
            min={0}
            max={roundNumber(convertWeightUnit(cargoArea.maxWeight - opsWeight, baseWeightUnit, units.weightUnits), unitPrecision) + 5}
            step={5}
            value={loadedWeight ? roundNumber(convertWeightUnit(loadedWeight, baseWeightUnit, units.weightUnits), unitPrecision) : ""}
            onChange={e => setWeight(Number(e.target.value))}
            placeholder={units.weightUnits}
          />}
      </td>
      <td>{roundNumber(convertWeightUnit(totalWeight, baseWeightUnit, units.weightUnits), unitPrecision)} / {roundNumber(convertWeightUnit(cargoArea.maxWeight, baseWeightUnit, units.weightUnits), unitPrecision)} {units.weightUnits}</td>
    </tr>
  )
}

interface fuelLoadingProps extends loadingProps {
  aircraft: aircraftT;
  opsConfigIndex: number;
  fuelTank: fuelTankT;
}

function FuelLoading({ loading, setLoading, fuelTank }: fuelLoadingProps): ReactNode {
  const units = useContext(UnitContext);

  const fuel = loading.fuel.find(f => f.tank === fuelTank.id);
  const loadedWeight = roundNumber(convertFuelUnits(fuel ? fuel.loadedFuel : 0, baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision);
  const consumedFuel = roundNumber(convertFuelUnits(fuel ? fuel.tripFuel : 0, baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision);

  function setLoad(weight: number): void {
    const tmp: loadingT = JSON.parse(JSON.stringify(loading));
    weight = Math.min(
      convertFuelUnits(weight, units.fuelUnits, baseFuelUnit, units.fuelDensity),
      fuelTank.maxWeight);
    if (!tmp.fuel.some(c => c.tank === fuelTank.id))
      tmp.fuel.push({ tank: fuelTank.id, tripFuel: Math.max(weight - fuelTank.unusable, 0), loadedFuel: weight });
    else {
      const index = tmp.fuel.findIndex(c => c.tank === fuelTank.id);
      tmp.fuel[index].loadedFuel = weight;
      tmp.fuel[index].tripFuel = Math.min(Math.max(weight - fuelTank.unusable, 0), tmp.fuel[index].tripFuel);
    }
    setLoading(tmp);
  }

  function setUsed(weight: number): void {
    const tmp: loadingT = JSON.parse(JSON.stringify(loading));
    weight = Math.min(convertFuelUnits(weight, units.fuelUnits, baseFuelUnit, units.fuelDensity), fuel ? Math.max(fuel.loadedFuel - fuelTank.unusable, 0) : fuelTank.maxWeight);
    if (!tmp.fuel.some(c => c.tank === fuelTank.id))
      tmp.fuel.push({ tank: fuelTank.id, tripFuel: weight, loadedFuel: fuelTank.maxWeight });
    else {
      const index = tmp.fuel.findIndex(c => c.tank === fuelTank.id);
      tmp.fuel[index].tripFuel = weight;
    }
    setLoading(tmp);
  }

  return (
    <tr>
      <td>{fuelTank.name}</td>
      <td>
        <input
          id={'fuelTankLoad' + fuelTank.id}
          type='number'
          min={0}
          max={roundNumber(convertFuelUnits(fuelTank.maxWeight, baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision) + 1}
          value={loadedWeight ? loadedWeight : ""}
          onChange={e => setLoad(Number(e.target.value))}
          placeholder={units.fuelUnits}
        />
      </td>
      <td>
        <input
          id={'fuelTankUnusable' + fuelTank.id}
          type='number'
          min={0}
          max={loadedWeight - roundNumber(convertFuelUnits(fuelTank.unusable, baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision) + 1}
          value={consumedFuel ? consumedFuel : ""}
          onChange={e => setUsed(Number(e.target.value))}
          placeholder={units.fuelUnits}
        />
      </td>
      <td className='narrowFilter'>{roundNumber(loadedWeight - consumedFuel, unitPrecision)} {units.fuelUnits}</td>
    </tr>
  )
}

const loadingDirections = ['frontToBack', 'backToFront', 'point'] as const;
const loadingDirectionsNames = { frontToBack: "Front To Back", backToFront: "Back To Front", point: "Point" } as const;
type loadingDirectionsT = typeof loadingDirections[number];

function PassengerLoader({ loading, setLoading, aircraft, selectedOpsConfig }: titleProps) {
  const units = useContext(UnitContext);
  const [fillCenter, setFillCenter] = useState(0);
  const [direction, setDirection] = useState('frontToBack' as loadingDirectionsT)
  // Default average weight is 200lbs
  const [averageWeight, setAverageWeight] = useState(200)
  const dialogRef: RefObject<(null | HTMLDialogElement)> = useRef(null);

  const opsConfigIndex = aircraft.operationConfigs.findIndex(c => c.id === selectedOpsConfig);
  if (opsConfigIndex < 0) return (<></>);

  const configIndex = aircraft.aircraftConfigs.findIndex(c => c.id === aircraft.operationConfigs[opsConfigIndex].config);
  const totalSeats = loading.passengers.reduce((sum, s) => sum + s.count, 0);

  function loadSeats(count: number, direction: loadingDirectionsT): void {
    let remainingToLoad = count;
    const tmp: loadingT = JSON.parse(JSON.stringify(loading));
    tmp.passengers = [];

    // Seat locations sorted by arm
    let seats: seatT[] = [];
    if (['frontToBack', 'backToFront'].includes(direction)) {
      seats = getSortedByArm(aircraft.aircraftConfigs[configIndex].seats.map(seatId => aircraft.seats.find(s => s.id === seatId)).filter(s => s != undefined));
      if ('backToFront' === direction)
        seats = seats.reverse();
    }
    else if ('point' === direction)
      seats = getSortedByArmClosest(aircraft.aircraftConfigs[configIndex].seats.map(seatId => aircraft.seats.find(s => s.id === seatId)).filter(s => s != undefined), fillCenter);

    const originalFill: passengerT[] = loading.passengers;
    // Fill original seats to ensure they don't move
    for (const seat of seats) {
      if (remainingToLoad <= 0) break;
      const originalSeat = originalFill.find(s => s.location === seat.id);
      if (!originalSeat) continue;
      const numToLoad = Math.min(originalSeat.count, remainingToLoad);
      tmp.passengers.push({ ...originalSeat, count: numToLoad });
      remainingToLoad -= numToLoad;
    }

    // Fill seats with new passengers
    for (const seat of seats) {
      if (remainingToLoad <= 0) break;

      const seatIndex = aircraft.operationConfigs[opsConfigIndex].seats.findIndex(s => s.id === seat.id);
      let opsUsedSeats = 0;
      if (seatIndex >= 0)
        opsUsedSeats = Math.ceil(aircraft.operationConfigs[opsConfigIndex].seats[seatIndex].weight / seat.maxWeight)
      if (opsUsedSeats === seat.seatCount) continue;

      // If seat already taken skip it
      let takenSeatIndex = originalFill.findIndex(c => c.location === seat.id);
      let alreadyTaken = 0;
      if (takenSeatIndex >= 0)
        alreadyTaken = originalFill[takenSeatIndex].count;
      if (opsUsedSeats + alreadyTaken === seat.seatCount) continue;

      const numToLoad = Math.min(remainingToLoad, Math.max(seat.seatCount - opsUsedSeats - alreadyTaken, 0));
      remainingToLoad -= numToLoad;
      let newSeatIndex = tmp.passengers.findIndex(c => c.location === seat.id);
      if (newSeatIndex < 0)
        tmp.passengers.push({ location: seat.id, avgWeight: averageWeight, count: numToLoad + alreadyTaken });
      else {
        tmp.passengers[newSeatIndex].count = numToLoad + alreadyTaken;
      }
    }
    setLoading(tmp);
  }

  function setAverageWeights(): void {
    const tmp: loadingT = JSON.parse(JSON.stringify(loading));
    tmp.passengers = tmp.passengers.map(s => ({ ...s, avgWeight: Math.max(averageWeight, 0) }));
    setAverageWeight(averageWeight);
    setLoading(tmp);
  }

  return (
    <div className='filler'>
      <label htmlFor='seatTotalPassengersLoaded'>Passengers</label>
      <div>
        <input
          id='seatTotalPassengersLoaded'
          type='number'
          min={0}
          max={aircraft.seats.reduce((sum, s) => sum + s.seatCount, 0)}
          placeholder='Count'
          value={totalSeats ? totalSeats : ""}
          onChange={(e) => loadSeats(Number(e.target.value), direction)} />
        <button className='hiddenButton' onClick={() => dialogRef.current ? dialogRef.current.show() : undefined}>
          <FontAwesomeIcon icon={faEllipsisV} />
        </button>
        <dialog ref={dialogRef} className='rightDialog' closedby='any'>
          <div>
            <label htmlFor='seatLoadingDirectionSelect'>Seat Load Mode</label>
            <select id='seatLoadingDirectionSelect' value={direction} onChange={(e) => setDirection(e.target.value as loadingDirectionsT)}>
              {loadingDirections.map(d => <option value={d} key={d + "seatLoadingDirections"} >{loadingDirectionsNames[d]}</option>)}
            </select>
            {direction === 'point' &&
              <>
                <input
                  id='seatLoadCenterPoint'
                  type='number'
                  style={{ width: "5rem" }}
                  placeholder={units.lengthUnits}
                  value={fillCenter ? roundNumber(convertLengthUnit(fillCenter, baseLengthUnit, units.lengthUnits), unitPrecision) : ""}
                  onChange={(e) => setFillCenter(convertLengthUnit(Number(e.target.value), units.lengthUnits, baseLengthUnit))} />
              </>
            }
            <label htmlFor='seatLoadingAverageWeight'>Pax Avg Weight</label>
            <div>
              <input
                id='seatLoadingAverageWeight'
                type='number'
                min='0'
                placeholder={units.weightUnits}
                value={averageWeight ? roundNumber(convertWeightUnit(averageWeight, baseWeightUnit, units.weightUnits), unitPrecision) : ""}
                onChange={e => setAverageWeight(convertWeightUnit(Number(e.target.value), units.weightUnits, baseWeightUnit))} />
              <button className='hiddenButton' onClick={setAverageWeights}>
                <FontAwesomeIcon icon={faFillDrip} />
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </div>
  )
}

function CargoLoader({ loading, setLoading, aircraft, selectedOpsConfig }: titleProps) {
  const units = useContext(UnitContext);
  const [fillCenter, setFillCenter] = useState(0);
  const [direction, setDirection] = useState('frontToBack' as loadingDirectionsT)
  const dialogRef: RefObject<(null | HTMLDialogElement)> = useRef(null);

  const opsConfigIndex = aircraft.operationConfigs.findIndex(c => c.id === selectedOpsConfig);
  if (opsConfigIndex < 0) return (<></>);

  const configIndex = aircraft.aircraftConfigs.findIndex(c => c.id === aircraft.operationConfigs[opsConfigIndex].config);
  const totalCargo = loading.cargo.reduce((sum, s) => sum + s.weight, 0);

  function loadCargo(weight: number, direction: loadingDirectionsT): void {
    let remainingToLoad = weight;
    const tmp: loadingT = JSON.parse(JSON.stringify(loading));
    tmp.cargo = [];

    // Cargo locations sorted by arm
    let sortedCargoAreas: cargoAreaT[] = [];
    if (['frontToBack', 'backToFront'].includes(direction)) {
      sortedCargoAreas = getSortedByArm(aircraft.aircraftConfigs[configIndex].cargoAreas.map(cargoId => aircraft.cargoAreas.find(c => c.id === cargoId)).filter(c => c != undefined));
      if ('backToFront' === direction)
        sortedCargoAreas = sortedCargoAreas.reverse();
    }
    else if ('point' === direction)
      sortedCargoAreas = getSortedByArmClosest(aircraft.aircraftConfigs[configIndex].cargoAreas.map(cargoId => aircraft.cargoAreas.find(c => c.id === cargoId)).filter(c => c != undefined), fillCenter);

    const originalFill: cargoT[] = loading.cargo;
    // Fill original cargoAreas to ensure they don't move
    for (const cargoArea of sortedCargoAreas) {
      if (remainingToLoad <= 0) break;
      const originalCargoArea = originalFill.find(c => c.location === cargoArea.id);
      if (!originalCargoArea) continue;
      const numToLoad = Math.min(originalCargoArea.weight, remainingToLoad);
      if (numToLoad == 0) continue;
      tmp.cargo.push({ ...originalCargoArea, weight: numToLoad });
      remainingToLoad -= numToLoad;
    }

    // Fill cargoAreas with new cargo
    for (const cargoArea of sortedCargoAreas) {
      if (remainingToLoad <= 0) break;

      const cargoIndex = aircraft.operationConfigs[opsConfigIndex].cargoAreas.findIndex(s => s.id === cargoArea.id);
      let opsUsedCargo = 0;
      if (cargoIndex >= 0)
        opsUsedCargo = aircraft.operationConfigs[opsConfigIndex].cargoAreas[cargoIndex].weight
      if (opsUsedCargo === cargoArea.maxWeight) continue;

      // If cargoArea already taken skip it
      let takenCargoIndex = originalFill.findIndex(c => c.location === cargoArea.id);
      let alreadyTaken = 0;
      if (takenCargoIndex >= 0)
        alreadyTaken = originalFill[takenCargoIndex].weight;
      if (opsUsedCargo + alreadyTaken === cargoArea.maxWeight) continue;

      const numToLoad = Math.min(remainingToLoad, cargoArea.maxWeight - opsUsedCargo - alreadyTaken);
      remainingToLoad -= numToLoad;
      let newCargoIndex = tmp.cargo.findIndex(c => c.location === cargoArea.id);
      if (newCargoIndex < 0)
        tmp.cargo.push({ location: cargoArea.id, weight: numToLoad + alreadyTaken });
      else {
        tmp.cargo[newCargoIndex].weight = numToLoad + alreadyTaken;
      }
    }
    setLoading(tmp);
  }

  return (
    <div className='filler'>
      <label htmlFor='cargoTotalLoaded'>Cargo</label>
      <div>
        <input
          id='cargoTotalLoaded'
          type='number'
          min={0}
          max={aircraft.cargoAreas.reduce((sum, s) => sum + s.maxWeight, 0)}
          step={5}
          placeholder={units.weightUnits}
          value={totalCargo ? roundNumber(convertWeightUnit(totalCargo, baseWeightUnit, units.weightUnits), unitPrecision) : ""}
          onChange={(e) => loadCargo(convertWeightUnit(Number(e.target.value), units.weightUnits, baseWeightUnit), direction)} />
        <button className='hiddenButton' onClick={() => dialogRef.current ? dialogRef.current.show() : undefined}>
          <FontAwesomeIcon icon={faEllipsisV} />
        </button>
        <dialog ref={dialogRef} className='rightDialog' closedby='any'>
          <div>
            <label htmlFor='cargoLoadingDirectionSelect'>Cargo Load Mode</label>
            <select id='cargoLoadingDirectionSelect' value={direction} onChange={(e) => setDirection(e.target.value as loadingDirectionsT)}>
              {loadingDirections.map(d => <option value={d} key={d + "cargoLoadingDirections"} >{loadingDirectionsNames[d]}</option>)}
            </select>
            {direction === 'point' &&
              <>
                <input
                  id='cargoLoadCenterPoint'
                  type='number'
                  style={{ width: "5rem" }}
                  placeholder={units.lengthUnits}
                  value={fillCenter ? roundNumber(convertLengthUnit(fillCenter, baseLengthUnit, units.lengthUnits), unitPrecision) : ""}
                  onChange={(e) => setFillCenter(convertLengthUnit(Number(e.target.value), units.lengthUnits, baseLengthUnit))} />
              </>
            }
          </div>
        </dialog>
      </div>
    </div>
  )
}

const fuelModes = ['proportional', 'even'] as const;
const fuelModeNames = { proportional: "Proportional", even: "Even" } as const;
type fuelModesT = typeof fuelModes[number];

function fillGroup(group: fuelTankT[], loading: loadingT, fuelToAdd: number, mode: fuelModesT): number {
  let fuelRemaining = fuelToAdd;
  group.sort((a, b) => a.maxWeight - b.maxWeight);

  let tanksToFill = fuelToAdd > 0 ? group : group.reduce((total: fuelTankT[], t) => {
    const data = loading.fuel.find(l => l.tank === t.id);
    if (data != undefined && data.loadedFuel > 0) total.push(t);
    return total
  }, []);
  let tanksToFillCount = tanksToFill.length;

  const maxFuel = tanksToFill.reduce((sum, t) => sum + t.maxWeight, 0);
  const groupPreLoaded = group.reduce((sum, t) => {
    const load = loading.fuel.find(v => v.tank === t.id);
    if (load) return sum + load.loadedFuel;
    return sum;
  }, 0)

  // Return if already full
  if (groupPreLoaded === maxFuel && fuelRemaining >= 0 || groupPreLoaded === 0 && fuelRemaining <= 0) return fuelRemaining;

  // Loop over each tank in the priority group
  group.forEach(t => {
    const tankIndex = loading.fuel.findIndex(f => f.tank === t.id);
    const startingFuel = tankIndex >= 0 ? loading.fuel[tankIndex].loadedFuel : 0;

    let fuelToSet = 0;
    if (maxFuel <= fuelToAdd + groupPreLoaded) {
      fuelToSet = t.maxWeight;
    } else if (mode === 'proportional') {
      // Fractional Mode
      fuelToSet = (t.maxWeight / maxFuel * fuelToAdd) + startingFuel;
    } else {
      // Even Mode
      fuelToSet = fuelToAdd / tanksToFillCount + startingFuel;
    }
    // Constrain new value
    fuelToSet = roundNumber(Math.max(Math.min(fuelToSet, t.maxWeight), 0), 1000000);

    // Set fuel load on tank
    if (tankIndex < 0)
      loading.fuel.push({ tank: t.id, loadedFuel: fuelToSet, tripFuel: 0 });
    else {
      loading.fuel[tankIndex].loadedFuel = fuelToSet;
      loading.fuel[tankIndex].tripFuel = Math.max(Math.min(loading.fuel[tankIndex].tripFuel, fuelToSet - t.unusable), 0);
    }

    const fuelAdded = fuelToSet - startingFuel;
    fuelRemaining -= fuelAdded;

    if (mode === 'even' && fuelAdded != 0 && ((fuelToSet === t.maxWeight && fuelRemaining > 0) || (fuelRemaining < 0 && fuelToSet === 0))) {
      fuelToAdd -= fuelAdded;
      tanksToFillCount -= 1;
    }
  });

  return fuelRemaining;
}

function FuelLoader({ loading, setLoading, aircraft, selectedOpsConfig }: titleProps) {
  const units = useContext(UnitContext);
  const [mode, setMode] = useState('even' as fuelModesT);
  const dialogRef: RefObject<(null | HTMLDialogElement)> = useRef(null);

  const opsConfigIndex = aircraft.operationConfigs.findIndex(c => c.id === selectedOpsConfig);
  if (opsConfigIndex < 0) return (<></>);
  const configIndex = aircraft.aircraftConfigs.findIndex(c => c.id === aircraft.operationConfigs[opsConfigIndex].config);

  // fill tanks from low to high priority
  function fillTanks(totalFuel: number): void {
    totalFuel = Math.max(totalFuel, 0);

    var groupByPriority = (xs: string[]) => {
      return xs.reduce((rv: { [key: string]: fuelTankT[] }, x) => {
        const tank = aircraft.fuelTanks.find(v => v.id === x);
        if (tank === undefined) return rv;
        (rv[tank.priority ?? 0] ??= []).push(tank);
        return rv;
      }, {});
    };

    // Get tank data with load data
    const grouped = groupByPriority([
      ...aircraft.aircraftConfigs[configIndex].fuelTanks,
      ...aircraft.fuelTanks.reduce((ret: string[], d) => { if (!d.removable) ret.push(d.id); return ret }, [])
    ]);

    const tmp: loadingT = JSON.parse(JSON.stringify(loading));

    let fuelRemaining = totalFuel;

    // Subtract fuel already in tanks
    fuelRemaining -= loading.fuel.reduce((sum, t) => sum + t.loadedFuel, 0);

    const keys = Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b));

    // When removing, remove from the highest priority
    if (fuelRemaining < 0) keys.reverse();

    for (const p of keys) {
      if (fuelRemaining === 0) break;
      fuelRemaining = fillGroup(grouped[p], tmp, fuelRemaining, mode);
    }
    setLoading(tmp);
  }

  const totalFuel = loading.fuel.reduce((sum, s) => sum + s.loadedFuel, 0);

  return (
    <div className='filler'>
      <label htmlFor='fuelLoadInput'>Loaded Fuel</label>
      <div>
        <input
          id='fuelLoadInput'
          type='number'
          min={0}
          placeholder={units.fuelUnits}
          value={totalFuel ? roundNumber(convertFuelUnits(totalFuel, baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision) : ""}
          onChange={e => fillTanks(convertFuelUnits(Number(e.target.value), units.fuelUnits, baseFuelUnit, units.fuelDensity))}
        />
        <button className='hiddenButton' onClick={() => dialogRef.current ? dialogRef.current.show() : undefined}>
          <FontAwesomeIcon icon={faEllipsisV} />
        </button>
        <dialog ref={dialogRef} className='rightDialog' closedby='any'>
          <div>
            <label htmlFor='fuelLoadingModeSelect'>Fuel Load Mode</label>
            <select id='fuelLoadingModeSelect' value={mode} onChange={(e) => setMode(e.target.value as fuelModesT)}>
              {fuelModes.map(d => <option value={d} key={d + "fuelLoadingModeSelect"} >{fuelModeNames[d]}</option>)}
            </select>
          </div>
        </dialog>
      </div>
    </div>
  );
}

function fillUsageGroup(group: fuelTankT[], loading: loadingT, fuelToAdd: number, mode: fuelModesT): number {
  let fuelRemaining = fuelToAdd;
  group.sort((a, b) => a.maxWeight - b.maxWeight);

  let tanksToFill = fuelToAdd > 0 ? group : group.reduce((total: fuelTankT[], t) => {
    const data = loading.fuel.find(l => l.tank === t.id);
    if (data != undefined && data.loadedFuel > 0) total.push(t);
    return total
  }, []);
  let tanksToFillCount = tanksToFill.length;

  const maxFuel = tanksToFill.reduce((sum, t) => sum + t.maxWeight, 0);
  const groupPreLoaded = group.reduce((sum, t) => {
    const load = loading.fuel.find(v => v.tank === t.id);
    if (load) return sum + load.tripFuel;
    return sum;
  }, 0)

  // Return if already full
  if (groupPreLoaded === maxFuel && fuelRemaining >= 0) return fuelRemaining;

  // Loop over each tank in the priority group
  group.forEach(t => {
    const tankIndex = loading.fuel.findIndex(f => f.tank === t.id);
    const startingFuel = tankIndex >= 0 ? loading.fuel[tankIndex].tripFuel : 0;
    const maxLoaded = loading.fuel[tankIndex].loadedFuel - t.unusable;

    let fuelToSet = 0;
    if (maxFuel <= fuelToAdd + groupPreLoaded) {
      fuelToSet = t.maxWeight;
    } else if (mode === 'proportional') {
      // Fractional Mode
      fuelToSet = (t.maxWeight / maxFuel * fuelToAdd) + startingFuel;
    } else {
      // Even Mode
      fuelToSet = fuelToAdd / tanksToFillCount + startingFuel;
    }
    // Constrain new value
    fuelToSet = roundNumber(Math.max(Math.min(fuelToSet, maxLoaded), 0), 1000000);

    // Set fuel load on tank
    if (tankIndex < 0)
      loading.fuel.push({ tank: t.id, loadedFuel: fuelToSet, tripFuel: fuelToSet });
    else {
      loading.fuel[tankIndex].tripFuel = fuelToSet
    }

    const fuelAdded = fuelToSet - startingFuel;
    fuelRemaining -= fuelAdded;

    if (mode === 'even' && fuelAdded != 0 && ((fuelToSet === t.maxWeight && fuelRemaining > 0) || (fuelRemaining < 0 && fuelToSet === 0))) {
      fuelToAdd -= fuelAdded;
      tanksToFillCount -= 1;
    }
  });

  return fuelRemaining;
}

function FuelUsageLoader({ loading, setLoading, aircraft, selectedOpsConfig }: titleProps) {
  const units = useContext(UnitContext);
  const [mode, setMode] = useState('even' as fuelModesT);
  const dialogRef: RefObject<(null | HTMLDialogElement)> = useRef(null);

  const opsConfigIndex = aircraft.operationConfigs.findIndex(c => c.id === selectedOpsConfig);
  if (opsConfigIndex < 0) return (<></>);
  const configIndex = aircraft.aircraftConfigs.findIndex(c => c.id === aircraft.operationConfigs[opsConfigIndex].config);

  // fill tanks from low to high priority
  function fillTanks(totalFuel: number): void {
    totalFuel = Math.max(totalFuel, 0);

    var groupByPriority = (xs: string[]) => {
      return xs.reduce((rv: { [key: string]: fuelTankT[] }, x) => {
        const tank = aircraft.fuelTanks.find(v => v.id === x);
        if (tank === undefined) return rv;
        (rv[tank.priority ?? 0] ??= []).push(tank);
        return rv;
      }, {});
    };

    // Get tank data with load data
    const grouped = groupByPriority([
      ...aircraft.aircraftConfigs[configIndex].fuelTanks,
      ...aircraft.fuelTanks.reduce((ret: string[], d) => { if (!d.removable) ret.push(d.id); return ret }, [])
    ]);

    const tmp: loadingT = JSON.parse(JSON.stringify(loading));

    let fuelRemaining = totalFuel;

    // Subtract fuel already in tanks
    fuelRemaining -= loading.fuel.reduce((sum, t) => sum + t.tripFuel, 0);

    const keys = Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b));

    // When removing, remove from the highest priority
    if (fuelRemaining < 0) keys.reverse();

    for (const p of keys) {
      if (fuelRemaining === 0) break;
      fuelRemaining = fillUsageGroup(grouped[p], tmp, fuelRemaining, mode);
    }
    setLoading(tmp);
  }

  const totalFuel = loading.fuel.reduce((sum, s) => sum + s.tripFuel, 0);

  return (
    <div className='filler'>
      <label htmlFor='fuelUsageInput'>Trip Fuel</label>
      <div>
        <input
          id='fuelUsageInput'
          type='number'
          min={0}
          placeholder={units.fuelUnits}
          value={totalFuel ? roundNumber(convertFuelUnits(totalFuel, baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision) : ""}
          onChange={e => fillTanks(convertFuelUnits(Number(e.target.value), units.fuelUnits, baseFuelUnit, units.fuelDensity))}
        />
        <button className='hiddenButton' onClick={() => dialogRef.current ? dialogRef.current.show() : undefined}>
          <FontAwesomeIcon icon={faEllipsisV} />
        </button>
        <dialog ref={dialogRef} className='rightDialog' closedby='any'>
          <div>
            <label htmlFor='fuelUsageModeSelect'>Fuel Load Mode</label>
            <select id='fuelUsageModeSelect' value={mode} onChange={(e) => setMode(e.target.value as fuelModesT)}>
              {fuelModes.map(d => <option value={d} key={d + "fuelUsageModeSelect"} >{fuelModeNames[d]}</option>)}
            </select>
          </div>
        </dialog>
      </div>
    </div>
  );
}


interface titleProps extends loadingProps {
  aircraft: aircraftT;
  selectedOpsConfig: string;
}

function Title({ aircraft, selectedOpsConfig, loading, setLoading }: titleProps): ReactNode {
  const units = useContext(UnitContext);
  const opsConfigIndex = aircraft.operationConfigs.findIndex(c => c.id === selectedOpsConfig);
  if (opsConfigIndex < 0) return (<></>);

  const [emptyWeight, emptyArm] = calculateEmptyBalanceForConfig(aircraft, aircraft.operationConfigs[opsConfigIndex].config);
  const [opsWeight, opsArm] = calculateBalanceForOperationConfig(aircraft, selectedOpsConfig);
  const [takeoffWeight, takeoffArm] = calculateBalanceForTakeoff(aircraft, selectedOpsConfig, loading);
  const [landWeight, landArm] = calculateBalanceForLanding(aircraft, selectedOpsConfig, loading);

  return (
    <>
      <div id='loadingTitle'>
        <h3>{aircraft.operationConfigs[opsConfigIndex].name}</h3>
        <div id='loaders'>
          <PassengerLoader aircraft={aircraft} selectedOpsConfig={selectedOpsConfig} loading={loading} setLoading={setLoading} />
          <CargoLoader aircraft={aircraft} selectedOpsConfig={selectedOpsConfig} loading={loading} setLoading={setLoading} />
          <FuelLoader aircraft={aircraft} selectedOpsConfig={selectedOpsConfig} loading={loading} setLoading={setLoading} />
          <FuelUsageLoader aircraft={aircraft} selectedOpsConfig={selectedOpsConfig} loading={loading} setLoading={setLoading} />
        </div>
      </div>
      <div id='configTitleData'>
        <h4>Empty Weight</h4>
        <p>{roundNumber(convertWeightUnit(emptyWeight, baseWeightUnit, units.weightUnits), 100)} {units.weightUnits}</p>
        <h4>Empty Arm</h4>
        <p>{roundNumber(convertLengthUnit(emptyArm, baseLengthUnit, units.lengthUnits), 100)} {units.lengthUnits}</p>
        <h4>Ops Weight</h4>
        <p>{roundNumber(convertWeightUnit(opsWeight, baseWeightUnit, units.weightUnits), 100)} {units.weightUnits}</p>
        <h4>Ops Arm</h4>
        <p>{roundNumber(convertLengthUnit(opsArm, baseLengthUnit, units.lengthUnits), 100)} {units.lengthUnits}</p>
        <h4>Takeoff Weight</h4>
        <p>{roundNumber(convertWeightUnit(takeoffWeight, baseWeightUnit, units.weightUnits), 100)} {units.weightUnits}</p>
        <h4>Takeoff Arm</h4>
        <p>{roundNumber(convertLengthUnit(takeoffArm, baseLengthUnit, units.lengthUnits), 100)} {units.lengthUnits}</p>
        <h4>Land Weight</h4>
        <p>{roundNumber(convertWeightUnit(landWeight, baseWeightUnit, units.weightUnits), 100)} {units.weightUnits}</p>
        <h4>Land Arm</h4>
        <p>{roundNumber(convertLengthUnit(landArm, baseLengthUnit, units.lengthUnits), 100)} {units.lengthUnits}</p>
      </div>
    </>
  )
}

interface localLoadingProps extends loadingProps {
  aircraft: aircraftT;
  selectedOpsConfig: string;
}

function Loading({ loading, setLoading, aircraft, selectedOpsConfig }: localLoadingProps & nameProps): ReactNode {
  const units = useContext(UnitContext);
  if (validateAircraft(aircraft)) return (<h2 style={{ margin: " 20px auto" }}>Invalid Config</h2>);
  const opsConfigIndex = aircraft.operationConfigs.findIndex(c => c.id === selectedOpsConfig);
  if (opsConfigIndex < 0) return (<></>);
  const configIndex = aircraft.aircraftConfigs.findIndex(c => c.id === aircraft.operationConfigs[opsConfigIndex].config);

  let seatRows = getSortedByArm(aircraft.seats)
    .filter(seat => aircraft.aircraftConfigs[configIndex].seats.some(s => s === seat.id))
    .map((seat: seatT) => {
      return <SeatLoading
        key={seat.id + " seatFill"}
        loading={loading}
        setLoading={setLoading}
        aircraft={aircraft}
        opsConfigIndex={opsConfigIndex}
        seat={seat} />
    })

  let cargoRows = getSortedByArm(aircraft.cargoAreas)
    .filter(cargoArea => aircraft.aircraftConfigs[configIndex].cargoAreas.some(s => s === cargoArea.id))
    .map((cargoArea: cargoAreaT) => {
      return <CargoLoading
        key={cargoArea.id + " cargoFill"}
        loading={loading}
        setLoading={setLoading}
        aircraft={aircraft}
        opsConfigIndex={opsConfigIndex}
        cargoArea={cargoArea} />
    })

  let fuelRows = getSortedByArm(aircraft.fuelTanks)
    .filter(fuelTank => !fuelTank.removable || aircraft.aircraftConfigs[configIndex].fuelTanks.some(t => t === fuelTank.id))
    .map((fuelTank: fuelTankT) => {
      return <FuelLoading
        key={fuelTank.id + " cargoFill"}
        loading={loading}
        setLoading={setLoading}
        aircraft={aircraft}
        opsConfigIndex={opsConfigIndex}
        fuelTank={fuelTank} />
    })

  return (
    <>
      <Subregion id='balance-configTitle'>
        <Title
          aircraft={aircraft}
          selectedOpsConfig={selectedOpsConfig}
          loading={loading}
          setLoading={setLoading} />
      </Subregion>
      <MultiPane>
        <Subregion id='passengers' name="Passengers">
          <table className="tableData sortedTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Passengers</th>
                <th>Avg Wt. ({units.weightUnits})</th>
                <th>Total Wt. ({units.weightUnits})</th>
              </tr>
            </thead>
            <tbody>
              {seatRows}
            </tbody>
          </table>
        </Subregion>
        <Subregion id='cargo' name="Cargo">
          <table className="tableData sortedTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Cargo Wt. ({units.weightUnits})</th>
                <th>Total Wt. ({units.weightUnits})</th>
              </tr>
            </thead>
            <tbody>
              {cargoRows}
            </tbody>
          </table>
        </Subregion>
        <Subregion id='fuel' name="Fuel">
          <table className="tableData sortedTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Fuel Load ({units.fuelUnits})</th>
                <th>Trip Fuel ({units.fuelUnits})</th>
                <th className='narrowFilter'>Land Fuel ({units.fuelUnits})</th>
              </tr>
            </thead>
            <tbody>
              {fuelRows}
            </tbody>
          </table>
        </Subregion>
      </MultiPane>
    </>
  )
}

export default Loading;

