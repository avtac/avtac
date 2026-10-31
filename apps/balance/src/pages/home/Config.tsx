// TODO: 6. Add Overview/Printout page

import './Config.css'
import '../../Layout.css'
import { useContext, useEffect, useRef, useState, type ReactElement, type RefObject } from 'react';
import { MultiPane, Subregion } from "../../Layout";
import { type cargoAreaT, type aircraftT, type equipmentT, type seatT, type fuelTankT, type nameProps, baseLengthUnit, baseWeightUnit, baseFuelUnit, type aircraftProps, type configT, type loadingT, type loadingProps } from "../../Types";
import { activeConfigData, calculateBalanceForOperationConfig, calculateEmptyBalanceForConfig, getSortedByArm, roundNumber, uploadedConfigs, validateAircraft } from '../../utility';
import { convertFuelUnits, convertLengthUnit, convertWeightUnit, UnitContext, unitPrecision } from '../../UnitsContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faCheck, faEllipsisV } from "@fortawesome/free-solid-svg-icons"

interface addDialogProps {
  ref: RefObject<null | HTMLDialogElement>
  mode: boolean; // True for add/False for remove
  onAdd: () => void;
  onRemove: () => void;
}

function AddDialog({ ref, mode, onAdd, onRemove }: addDialogProps): ReactElement {
  return (
    <dialog
      ref={ref}
      closedby='any'
      className='addRemoveDialog'>
      {mode ?
        <button onClick={onAdd}>{"Add To Aircraft"}</button>
        :
        <button onClick={onRemove}>{"Remove From Aircraft"}</button>
      }
    </dialog>
  );
}

interface seatSelectionProps extends aircraftProps, loadingProps {
  seat: seatT;
  opsConfigIndex: number;
  airConfigIndex: number;
}

function SeatSelection({ aircraft, setAircraft, loading, setLoading, seat, opsConfigIndex, airConfigIndex }: seatSelectionProps): ReactElement {
  const units = useContext(UnitContext);
  const dialogRef: RefObject<null | HTMLDialogElement> = useRef(null);
  let seatIndex: number = -1;
  if (opsConfigIndex >= 0) seatIndex = aircraft.operationConfigs[opsConfigIndex].seats.findIndex((s) => s.id === seat.id);

  let checked = useRef(seatIndex >= 0);
  const passengers = loading.passengers.find(s => s.location === seat.id);
  const oldWeight = useRef(convertWeightUnit(seat.maxWeight * seat.seatCount - (passengers ? passengers.count * passengers.avgWeight : 0), baseWeightUnit, units.weightUnits));

  const inConfig = aircraft.aircraftConfigs[airConfigIndex].seats.some((s) => s === seat.id);

  function selectCheckbox(): void {
    if (opsConfigIndex < 0 || !inConfig) return;
    checked.current = !checked.current;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    if (checked.current) {
      if (!aircraft.operationConfigs[opsConfigIndex].seats.some(s => s.id === seat.id)) {
        tmp.operationConfigs[opsConfigIndex].seats.push({ id: seat.id, weight: oldWeight.current });
      }
    } else {
      tmp.operationConfigs[opsConfigIndex].seats.splice(seatIndex, 1);
    }
    setAircraft(tmp);
  }

  function addToConfig() {
    if (aircraft.aircraftConfigs[airConfigIndex].seats.includes(seat.id) || airConfigIndex < 0) return;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.aircraftConfigs[airConfigIndex].seats.push(seat.id);
    setAircraft(tmp);
  }

  function removeFromConfig() {
    if (!aircraft.aircraftConfigs[airConfigIndex].seats.includes(seat.id) || airConfigIndex < 0) return;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    const index = tmp.aircraftConfigs[airConfigIndex].seats.findIndex(a => a === seat.id);
    tmp.aircraftConfigs[airConfigIndex].seats.splice(index, 1);
    const opsIndex = tmp.operationConfigs[opsConfigIndex].seats.findIndex(a => a.id === seat.id);
    if (opsIndex >= 0) {
      tmp.operationConfigs[opsConfigIndex].seats.splice(opsIndex, 1);
    }
    const loadIndex = loading.passengers.findIndex(a => a.location === seat.id);
    if (loadIndex >= 0) {
      const tmpLoad: loadingT = JSON.parse(JSON.stringify(loading));
      tmpLoad.passengers.splice(loadIndex, 1);
      setLoading(tmpLoad);
    }
    setAircraft(tmp);
  }

  function setWeight(weight: number): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    const newWeight = Math.min(seat.maxWeight * seat.seatCount, convertWeightUnit(weight, units.weightUnits, baseWeightUnit));
    tmp.operationConfigs[opsConfigIndex].seats[seatIndex].weight = newWeight;
    oldWeight.current = newWeight;
    setAircraft(tmp);
  }

  let opsWeight = undefined;
  if (seatIndex >= 0) {
    opsWeight = roundNumber(convertWeightUnit(aircraft.operationConfigs[opsConfigIndex].seats[seatIndex].weight, baseWeightUnit, units.weightUnits), unitPrecision);
    oldWeight.current = aircraft.operationConfigs[opsConfigIndex].seats[seatIndex].weight;
  }

  checked.current = seatIndex >= 0;
  return (
    <tr className={"seatSelect" + (!inConfig ? " unused" : "")}>
      <td className="clickable" onClick={selectCheckbox}>
        <input className="clickable" disabled={!inConfig} onChange={() => { }} checked={checked.current} type={"checkbox"} />
      </td>
      <td className="clickable" onClick={selectCheckbox}>{seat.name}</td>
      <td className='narrowFilter'>{roundNumber(convertLengthUnit(seat.arm, baseLengthUnit, units.lengthUnits), unitPrecision)} {units.lengthUnits}</td>
      <td className='narrowFilter'>{roundNumber(convertWeightUnit(seat.maxWeight, baseWeightUnit, units.weightUnits), unitPrecision)} {units.weightUnits}</td>
      <td>{seat.seatCount}</td>
      <td>
        <input
          id={"seatWeightInput" + seat.id}
          disabled={!inConfig || seatIndex < 0}
          type='number'
          min={0}
          max={seat.maxWeight * (seat.seatCount - (passengers ? passengers.count : 0))}
          placeholder={units.weightUnits}
          value={opsWeight ? roundNumber(convertWeightUnit(opsWeight, baseWeightUnit, units.weightUnits), unitPrecision) : ""}
          onChange={(e) => { setWeight(Number(e.target.value)) }} />
      </td>
      <td onClick={() => { if (dialogRef.current) dialogRef.current.show() }}>
        <FontAwesomeIcon style={{ cursor: 'pointer' }} icon={faEllipsisV} />
        <AddDialog
          ref={dialogRef}
          mode={!inConfig}
          onAdd={addToConfig}
          onRemove={removeFromConfig} />
      </td>
    </tr>
  );
}

interface cargoSelectionProps extends aircraftProps, loadingProps {
  cargoArea: cargoAreaT,
  opsConfigIndex: number
  airConfigIndex: number
}

function CargoSelection({ aircraft, setAircraft, loading, setLoading, cargoArea, opsConfigIndex, airConfigIndex }: cargoSelectionProps): ReactElement {
  const units = useContext(UnitContext);
  let cargoAreaIndex: number = -1;
  const dialogRef: RefObject<null | HTMLDialogElement> = useRef(null);
  if (opsConfigIndex >= 0) cargoAreaIndex = aircraft.operationConfigs[opsConfigIndex].cargoAreas.findIndex((s) => s.id === cargoArea.id);

  let checked = useRef(cargoAreaIndex >= 0);
  const loadedCargo = loading.cargo.find(c => c.location === cargoArea.id);
  const oldWeight = useRef(convertWeightUnit(cargoArea.maxWeight - (loadedCargo ? loadedCargo.weight : 0), baseWeightUnit, units.weightUnits));

  const inConfig = aircraft.aircraftConfigs[airConfigIndex].cargoAreas.some((s) => s === cargoArea.id);

  function selectCheckbox(): void {
    if (opsConfigIndex < 0 || !inConfig) return;
    checked.current = !checked.current;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    if (checked.current) {
      if (!aircraft.operationConfigs[opsConfigIndex].cargoAreas.some(s => s.id === cargoArea.id)) {
        tmp.operationConfigs[opsConfigIndex].cargoAreas.push({ id: cargoArea.id, weight: oldWeight.current });
      }
    } else {
      tmp.operationConfigs[opsConfigIndex].cargoAreas.splice(cargoAreaIndex, 1);
    }
    setAircraft(tmp);
  }

  function addToConfig() {
    if (airConfigIndex < 0) return;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.aircraftConfigs[airConfigIndex].cargoAreas.push(cargoArea.id);
    setAircraft(tmp);
  }

  function removeFromConfig() {
    if (airConfigIndex < 0) return;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    const index = tmp.aircraftConfigs[airConfigIndex].cargoAreas.findIndex(a => a === cargoArea.id);
    if (index < 0) return;
    tmp.aircraftConfigs[airConfigIndex].cargoAreas.splice(index, 1);
    const opsIndex = tmp.operationConfigs[opsConfigIndex].cargoAreas.findIndex(a => a.id === cargoArea.id);
    if (opsIndex >= 0) {
      tmp.operationConfigs[opsConfigIndex].cargoAreas.splice(opsIndex, 1);
    }
    const loadIndex = loading.cargo.findIndex(a => a.location === cargoArea.id);
    if (loadIndex >= 0) {
      const tmpLoad: loadingT = JSON.parse(JSON.stringify(loading));
      tmpLoad.cargo.splice(loadIndex, 1);
      setLoading(tmpLoad);
    }
    setAircraft(tmp);
  }

  function setWeight(weight: number): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    const newWeight = Math.min(cargoArea.maxWeight, convertWeightUnit(weight, units.weightUnits, baseWeightUnit));
    tmp.operationConfigs[opsConfigIndex].cargoAreas[cargoAreaIndex].weight = newWeight;
    oldWeight.current = newWeight;
    setAircraft(tmp);
  }

  let opsWeight = undefined;
  if (cargoAreaIndex >= 0) {
    opsWeight = roundNumber(convertWeightUnit(aircraft.operationConfigs[opsConfigIndex].cargoAreas[cargoAreaIndex].weight, baseWeightUnit, units.weightUnits), unitPrecision);
    oldWeight.current = aircraft.operationConfigs[opsConfigIndex].cargoAreas[cargoAreaIndex].weight;
  }

  checked.current = cargoAreaIndex >= 0;
  return (
    <tr className={"cargoAreaSelect" + (!inConfig ? " unused" : "")}>
      <td className="clickable" onClick={selectCheckbox}>
        <input className="clickable" disabled={!inConfig} onChange={() => { }} checked={checked.current} type={"checkbox"} />
      </td>
      <td className="clickable" onClick={selectCheckbox}>{cargoArea.name}</td>
      <td className='narrowFilter'>{roundNumber(convertLengthUnit(cargoArea.arm, baseLengthUnit, units.lengthUnits), unitPrecision)} {units.lengthUnits}</td>
      <td>{roundNumber(convertWeightUnit(cargoArea.maxWeight, baseWeightUnit, units.weightUnits), unitPrecision)} {units.weightUnits}</td>
      <td>
        <input
          id={"cargoWeightInput" + cargoArea.id}
          disabled={!inConfig || cargoAreaIndex < 0}
          min={0}
          max={cargoArea.maxWeight - (loadedCargo ? loadedCargo.weight : 0)}
          type='number'
          onChange={(e) => { setWeight(Number(e.target.value)) }}
          placeholder={units.weightUnits}
          value={opsWeight ? opsWeight : ""} />
      </td>
      <td onClick={() => { if (dialogRef.current) dialogRef.current.show() }}>
        <FontAwesomeIcon style={{ cursor: 'pointer' }} icon={faEllipsisV} />
        <AddDialog
          ref={dialogRef}
          mode={!inConfig}
          onAdd={addToConfig}
          onRemove={removeFromConfig} />
      </td>
    </tr>
  );
}

interface fuelSelectionProps extends aircraftProps, loadingProps {
  fuelTank: fuelTankT,
  airConfigIndex: number
}

function FuelSelection({ aircraft, setAircraft, loading, setLoading, fuelTank, airConfigIndex }: fuelSelectionProps): ReactElement {
  const units = useContext(UnitContext);
  const dialogRef: RefObject<null | HTMLDialogElement> = useRef(null);
  const inConfig = aircraft.aircraftConfigs[airConfigIndex].fuelTanks.some(s => s === fuelTank.id);

  function addToConfig() {
    if (airConfigIndex < 0) return;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.aircraftConfigs[airConfigIndex].fuelTanks.push(fuelTank.id);
    setAircraft(tmp);
  }

  function removeFromConfig() {
    if (airConfigIndex < 0) return;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    const index = tmp.aircraftConfigs[airConfigIndex].fuelTanks.findIndex(a => a === fuelTank.id);
    if (index < 0) return;
    tmp.aircraftConfigs[airConfigIndex].fuelTanks.splice(index, 1);
    const loadIndex = loading.fuel.findIndex(a => a.tank === fuelTank.id);
    if (loadIndex >= 0) {
      const tmpLoad: loadingT = JSON.parse(JSON.stringify(loading));
      tmpLoad.fuel.splice(loadIndex, 1);
      setLoading(tmpLoad);
    }
    setAircraft(tmp);
  }

  return (
    <tr className={"fuelTankSelect" + (fuelTank.removable && !inConfig ? " unused" : "")}>
      <td>{fuelTank.name}</td>
      <td className='narrowFilter'>{roundNumber(convertLengthUnit(fuelTank.arm, baseLengthUnit, units.lengthUnits), unitPrecision)} {units.lengthUnits}</td>
      <td>{roundNumber(convertFuelUnits(fuelTank.maxWeight, baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision)} {units.fuelUnits}</td>
      <td>{roundNumber(convertFuelUnits(fuelTank.unusable, baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision)} {units.fuelUnits}</td>
      <td>{fuelTank.priority}</td>
      {fuelTank.removable ?
        <td onClick={() => { if (dialogRef.current) dialogRef.current.show() }}>
          <FontAwesomeIcon style={{ cursor: 'pointer' }} icon={faEllipsisV} />
          <AddDialog
            ref={dialogRef}
            mode={!inConfig}
            onAdd={addToConfig}
            onRemove={removeFromConfig} />
        </td>
        :
        <td></td>
      }
    </tr>
  );
}

interface EquipmentSelectionProps extends aircraftProps {
  equipment: equipmentT,
  airConfigIndex: number
}

function EquipmentSelection({ aircraft, setAircraft, equipment, airConfigIndex }: EquipmentSelectionProps): ReactElement {
  const units = useContext(UnitContext);
  const oldCount = useRef(1);
  const dialogRef: RefObject<null | HTMLDialogElement> = useRef(null);
  const weightDialogRef: RefObject<null | HTMLDialogElement> = useRef(null);
  const [count, setCount] = useState(1);
  const equipmentIndex = aircraft.equipment.findIndex((e) => e.id === equipment.id);

  const inConfig = aircraft.aircraftConfigs[airConfigIndex].equipment.some((s) => s.id === equipment.id);

  const locationValues = getSortedByArm([...aircraft.seats.map(s => { return { ...s, id: "S" + s.id } }), ...aircraft.cargoAreas.map(c => { return { ...c, id: "C" + c.id } })])
  const locationValueIndex = locationValues.findIndex((s) => s.id === equipment.area);

  function addToConfig() {
    if (airConfigIndex < 0) return;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.aircraftConfigs[airConfigIndex].equipment.push({ id: equipment.id, count: 1 });
    setAircraft(tmp);
  }

  function removeFromConfig() {
    if (airConfigIndex < 0) return;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    const index = tmp.aircraftConfigs[airConfigIndex].equipment.findIndex(a => a.id === equipment.id);
    if (index < 0) return;
    tmp.aircraftConfigs[airConfigIndex].equipment.splice(index, 1);
    setAircraft(tmp);
  }

  function setAircraftCount(value: number): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    const index = aircraft.aircraftConfigs[airConfigIndex].equipment.findIndex((s) => s.id === equipment.id);
    tmp.aircraftConfigs[airConfigIndex].equipment[index].count = value;
    setCount(value);
    setAircraft(tmp);
  }

  function setValue<K extends keyof equipmentT, V extends equipmentT[K]>(key: K[], value: V[]) {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    key.forEach((k, i) => {
      tmp.equipment[equipmentIndex][k] = value[i];
      if (k === 'area') {
        const valueIndex = locationValues.findIndex(e => e.id === value[i]);
        if (valueIndex >= 0)
          tmp.equipment[equipmentIndex].arm = locationValues[valueIndex].arm;
      }
    });
    setAircraft(tmp);
  }

  function resetValue<K extends keyof equipmentT>(key: K[]) {
    const originalConfigStrings = localStorage.getItem(uploadedConfigs);
    const activeConfigString = localStorage.getItem(activeConfigData);
    if (!originalConfigStrings || !activeConfigString) return;

    const originalConfigs: { [key: string]: configT } = JSON.parse(originalConfigStrings);
    const activeConfig: configT = JSON.parse(activeConfigString);
    const original = originalConfigs[activeConfig.id];
    if (!original) return;

    const originalAircraft = original.aircraft.find((a) => a.id === aircraft.id);
    if (!originalAircraft) return;

    setValue(key, key.map(k => originalAircraft.equipment[equipmentIndex][k]));
  }

  useEffect(() => {
    const index = aircraft.aircraftConfigs[airConfigIndex].equipment.findIndex((s) => s.id === equipment.id);
    setCount(inConfig ? aircraft.aircraftConfigs[airConfigIndex].equipment[index].count : 0);
    oldCount.current = 1;
  }, [aircraft])

  const location = locationValues.find(e => e.id === equipment.area);
  const arm = roundNumber(convertLengthUnit(location ? location.arm : equipment.arm, baseLengthUnit, units.lengthUnits), unitPrecision);
  return (
    <tr
      className={"equipmentSelect" + (!inConfig ? " unloaded" : "")}>
      <td
        className='clickable'
        onClick={() => { if (!inConfig) addToConfig(); else removeFromConfig(); }}>
        <input
          type='checkbox'
          checked={inConfig}
          onChange={() => { if (!inConfig) addToConfig(); else removeFromConfig(); }} />
      </td>
      <td
        className='clickable'
        onClick={() => { if (!inConfig) addToConfig(); else removeFromConfig(); }}>{equipment.name}</td>
      <td
        className='clickable armUpdate narrowFilter'
        onClick={() => { if (dialogRef.current && inConfig) dialogRef.current.show() }}>
        {arm} {units.lengthUnits}
        <dialog
          ref={dialogRef}
          closedby='any'>
          <div
            className='equipmentEdit'>
            <div>
              <p>Arm</p>
              <FontAwesomeIcon style={{ cursor: 'pointer' }} onClick={() => { resetValue(['arm', 'area']) }} icon={faArrowsRotate} />
            </div>
            <select
              id={"equipSelectArmLoc-" + equipment.id}
              value={equipment.area}
              onChange={e => setValue(['area'], [e.target.value])}>
              <option value={""}>Manual</option>
              {locationValues.map((area) => {
                return <option key={area.id} value={area.id}>{area.name}</option>
              })}
            </select>
            {locationValueIndex < 0 &&
              <input
                id={'customEquipmentArm' + equipment.id}
                disabled={!(locationValueIndex < 0)}
                placeholder={units.lengthUnits}
                type='number'
                onChange={e => setValue(['arm'], [Number(e.target.value)])}
                value={arm} />
            }
          </div>
        </dialog>
      </td>
      <td
        className='clickable armUpdate narrowFilter'
        onClick={() => { if (weightDialogRef.current && inConfig) weightDialogRef.current.show() }}>
        {roundNumber(convertWeightUnit(equipment.weight, baseWeightUnit, units.weightUnits), unitPrecision)} {units.weightUnits}
        <dialog
          ref={weightDialogRef}
          closedby='any'>
          <div
            className='equipmentEdit'>
            <div>
              <p>Weight</p>
              <FontAwesomeIcon
                style={{ cursor: 'pointer' }}
                onClick={() => { resetValue(['weight']) }}
                icon={faArrowsRotate} />
            </div>
            <input
              id={'customEquipmentWeight' + equipment.id}
              placeholder={units.weightUnits}
              type='number'
              onChange={e => setValue(['weight'], [Number(e.target.value)])}
              value={equipment.weight ? roundNumber(convertWeightUnit(equipment.weight, baseWeightUnit, units.weightUnits), unitPrecision) : ""} />
          </div>
        </dialog>
      </td>
      <td>
        <input
          id={`equipmentCount-${equipment.id}`}
          disabled={!inConfig}
          min={0}
          value={count}
          type={"number"}
          onChange={(e) => setAircraftCount(Number(e.target.value))} />
      </td>
      <td>{roundNumber(convertWeightUnit(equipment.weight * count, baseWeightUnit, units.weightUnits), unitPrecision)} {units.weightUnits}</td>
    </tr>
  );
}

interface ConfigProps extends aircraftProps, loadingProps {
  selectedOpsConfig: string,
}

function Config({ aircraft, setAircraft, loading, setLoading, selectedOpsConfig }: ConfigProps & nameProps): ReactElement {
  const units = useContext(UnitContext);
  const [filter, setFilter] = useState(true);
  if (validateAircraft(aircraft)) return (<h2 style={{ margin: " 20px auto" }}>Invalid Config</h2>);
  const opsConfigIndex = aircraft.operationConfigs.findIndex(c => c.id === selectedOpsConfig);
  if (opsConfigIndex < 0) return (<></>);
  const configIndex = aircraft.aircraftConfigs.findIndex(c => c.id === aircraft.operationConfigs[opsConfigIndex].config);

  const [emptyWeight, emptyArm] = calculateEmptyBalanceForConfig(aircraft, aircraft.operationConfigs[opsConfigIndex].config);
  const [opsWeight, opsArm] = calculateBalanceForOperationConfig(aircraft, selectedOpsConfig);

  let seatRows = aircraft.seats
    .filter(seat => !filter || aircraft.aircraftConfigs[configIndex].seats.some(s => s === seat.id))
    .map((seat: seatT) => {
      return <SeatSelection
        key={seat.id + " seatSelect"}
        aircraft={aircraft}
        setAircraft={setAircraft}
        loading={loading}
        setLoading={setLoading}
        airConfigIndex={configIndex}
        opsConfigIndex={opsConfigIndex}
        seat={seat} />
    })

  let cargoRows = aircraft.cargoAreas
    .filter(cargoArea => !filter || aircraft.aircraftConfigs[configIndex].cargoAreas.some(c => c === cargoArea.id))
    .map((cargo: cargoAreaT) => {
      return <CargoSelection
        key={cargo.id + " cargoSelect"}
        cargoArea={cargo}
        aircraft={aircraft}
        setAircraft={setAircraft}
        loading={loading}
        setLoading={setLoading}
        opsConfigIndex={opsConfigIndex}
        airConfigIndex={configIndex} />
    })

  let fuelRows = aircraft.fuelTanks
    .filter(fuelTank => !filter || !(fuelTank.removable && !aircraft.aircraftConfigs[configIndex].fuelTanks.some(f => f === fuelTank.id)))
    .map((fuel: fuelTankT) => {
      return <FuelSelection
        key={fuel.id + " fuelSelect"}
        fuelTank={fuel}
        loading={loading}
        setLoading={setLoading}
        aircraft={aircraft}
        setAircraft={setAircraft}
        airConfigIndex={configIndex} />
    })

  let equipmentRows = aircraft.equipment
    .map((equipment: equipmentT) => {
      return <EquipmentSelection
        key={equipment.id + " equipSelect"}
        equipment={equipment}
        aircraft={aircraft}
        setAircraft={setAircraft}
        airConfigIndex={configIndex} />
    })

  return (
    <>
      <Subregion id='balance-configTitle'>
        <div>
          <h3>{aircraft.operationConfigs[opsConfigIndex].name}</h3>
          <label htmlFor='configFilter'>Filter Rows</label>
          <input id='configFilter' type='checkbox' checked={filter} onChange={(e) => setFilter(e.target.checked)} />
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
        </div>
      </Subregion>
      <MultiPane>
        <Subregion id='seatConfigTable' name={"Seats"}>
          <table className="tableData sortedTable">
            <thead>
              <tr>
                <th><FontAwesomeIcon icon={faCheck} /></th>
                <th>Name</th>
                <th className='narrowFilter defaultForward'>{`Arm (${units.lengthUnits})`}</th>
                <th className='narrowFilter'>{`Max Wt. (${units.weightUnits})`}</th>
                <th># of Seats</th>
                <th>Ops Load</th>
                <th className="noSort"></th>
              </tr>
            </thead>
            <tbody>
              {seatRows}
            </tbody>
          </table>
        </Subregion>
        <Subregion id='cargoConfigTable' name={"Cargo Areas"}>
          <table className="tableData sortedTable">
            <thead>
              <tr>
                <th><FontAwesomeIcon icon={faCheck} /></th>
                <th>Name</th>
                <th className='narrowFilter defaultForward'>{`Arm (${units.lengthUnits})`}</th>
                <th>{`Max Wt. (${units.weightUnits})`}</th>
                <th>Ops Load</th>
                <th className="noSort"></th>
              </tr>
            </thead>
            <tbody>
              {cargoRows}
            </tbody>
          </table>
        </Subregion>
        <Subregion id='equipmentConfigTable' name={"Equipment"}>
          <table className="tableData sortedTable">
            <thead>
              <tr>
                <th><FontAwesomeIcon icon={faCheck} /></th>
                <th>Name</th>
                <th className='narrowFilter defaultForward'>{`Arm (${units.lengthUnits})`}</th>
                <th className='narrowFilter'>{`Wt. (${units.weightUnits})`}</th>
                <th>Count</th>
                <th>{`Total Wt. (${units.weightUnits})`}</th>
              </tr>
            </thead>
            <tbody>
              {equipmentRows}
            </tbody>
          </table>
        </Subregion>
        <Subregion id='fuelConfigTable' name={"Fuel Tanks"}>
          <table className="tableData sortedTable">
            <thead>
              <tr>
                <th>Name</th>
                <th className='narrowFilter defaultForward'>{`Arm (${units.lengthUnits})`}</th>
                <th>{`Max Fuel (${units.fuelUnits})`}</th>
                <th>{`Unusable Fuel (${units.fuelUnits})`}</th>
                <th>Priority</th>
                <th className="noSort"></th>
              </tr>
            </thead>
            <tbody>
              {fuelRows}
            </tbody>
          </table>
        </Subregion>
      </MultiPane >
    </>
  );
}


export default Config;
