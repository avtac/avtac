import './Config.css'
import '../../Layout.css'
import { useContext, useEffect, useRef, useState, type ReactElement } from 'react';
import { MultiPane, Subregion } from "../../Layout";
import { type aircraftConfigT, type cargoAreaT, type aircraftT, type equipmentT, type seatT, type aircraftProps, type fuelTankT, type nameProps, baseLengthUnit, baseWeightUnit, baseFuelUnit } from "../../Types";
import { roundNumber, validateAircraft } from '../../utility';
import { convertFuelUnits, convertLengthUnit, convertWeightUnit, UnitContext, unitPrecision } from '../../UnitsContext';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface seatSelectionProps extends aircraftProps {
  seat: seatT,
  configIndex: number
}

function SeatSelection({ seat, configIndex, aircraft, setAircraft }: seatSelectionProps): ReactElement {
  const units = useContext(UnitContext);
  let seatIndex: number = -1;
  if (configIndex >= 0) seatIndex = aircraft.aircraftConfigs[configIndex].seats.findIndex((s: string) => s == seat.id);
  const checked = useRef(seatIndex >= 0);

  function selectCheckbox(): void {
    if (configIndex < 0) return;
    checked.current = !checked.current;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    if (checked.current) {
      if (tmp.aircraftConfigs[configIndex].seats.findIndex((s: string) => s === seat.id) < 0)
        tmp.aircraftConfigs[configIndex].seats.push(seat.id);
    } else {
      tmp.aircraftConfigs[configIndex].seats.splice(seatIndex, 1);
      for (const [index, opsConf] of tmp.operationConfigs.entries()) {
        const usesConfig = opsConf.config === tmp.aircraftConfigs[configIndex].id;
        if (usesConfig) {
          const i = opsConf.seats.findIndex((s: { weight: number, id: string }) => s.id === seat.id);
          if (i < 0) continue;
          tmp.operationConfigs[index].seats.splice(i, 1);
        }
      }
    }
    checked.current = !checked.current;
    setAircraft(tmp);
  }

  checked.current = seatIndex >= 0;
  return (
    <tr className="seatSelect" onClick={selectCheckbox}>
      <td>
        <input onChange={() => { }} checked={checked.current} type={"checkbox"} />
      </td>
      <td>{seat.name}</td>
      <td>{roundNumber(convertLengthUnit(seat.arm, baseLengthUnit, units.lengthUnits), unitPrecision)} {units.lengthUnits}</td>
      <td>{roundNumber(convertWeightUnit(seat.maxWeight, baseWeightUnit, units.weightUnits), unitPrecision)} {units.weightUnits}</td>
      <td>{seat.seatCount}</td>
    </tr>
  );
}

interface cargoSelectionProps extends aircraftProps {
  cargoArea: cargoAreaT,
  configIndex: number
}

function CargoSelection({ cargoArea, configIndex, aircraft, setAircraft }: cargoSelectionProps): ReactElement {
  const units = useContext(UnitContext);
  let cargoAreaIndex = -1;
  if (configIndex >= 0) cargoAreaIndex = aircraft.aircraftConfigs[configIndex].cargoAreas.findIndex((s: string) => s == cargoArea.id);
  const checked = useRef(cargoAreaIndex >= 0);

  function selectCheckbox(): void {
    if (configIndex < 0) return;
    checked.current = !checked.current;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    if (checked.current) {
      if (tmp.aircraftConfigs[configIndex].cargoAreas.findIndex((s: string) => s === cargoArea.id) < 0)
        tmp.aircraftConfigs[configIndex].cargoAreas.push(cargoArea.id);
    } else {
      tmp.aircraftConfigs[configIndex].cargoAreas.splice(cargoAreaIndex, 1);
      for (const [index, opsConf] of tmp.operationConfigs.entries()) {
        const usesConfig = opsConf.config === tmp.aircraftConfigs[configIndex].id;
        if (usesConfig) {
          const i = opsConf.cargoAreas.findIndex((s: { weight: number, id: string }) => s.id === cargoArea.id)
          if (i < 0) continue;
          tmp.operationConfigs[index].cargoAreas.splice(i, 1);
        }
      }
    }
    checked.current = !checked.current;
    setAircraft(tmp);
  }

  checked.current = cargoAreaIndex >= 0;
  return (
    <tr className="cargoAreaSelect" onClick={selectCheckbox}>
      <td>
        <input onChange={() => { }} checked={checked.current} type={"checkbox"} />
      </td>
      <td>{cargoArea.name}</td>
      <td>{roundNumber(convertLengthUnit(cargoArea.arm, baseLengthUnit, units.lengthUnits), unitPrecision)} {units.lengthUnits}</td>
      <td>{roundNumber(convertWeightUnit(cargoArea.maxWeight, baseWeightUnit, units.weightUnits), unitPrecision)} {units.weightUnits}</td>
    </tr>
  );
}

interface fuelSelectionProps extends aircraftProps {
  fuelTank: fuelTankT,
  configIndex: number
}

function FuelSelection({ fuelTank, configIndex, aircraft, setAircraft }: fuelSelectionProps): ReactElement {
  const units = useContext(UnitContext);
  let fuelTankIndex = -1;
  if (configIndex >= 0) fuelTankIndex = aircraft.aircraftConfigs[configIndex].fuelTanks.findIndex((s: string) => s == fuelTank.id);
  const checked = useRef(fuelTankIndex >= 0 || !fuelTank.removable);

  function selectCheckbox(): void {
    if (configIndex < 0 || !fuelTank.removable) return;
    checked.current = !checked.current;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    if (checked.current) {
      if (tmp.aircraftConfigs[configIndex].fuelTanks.findIndex((s: string) => s === fuelTank.id) < 0)
        tmp.aircraftConfigs[configIndex].fuelTanks.push(fuelTank.id);
    } else {
      tmp.aircraftConfigs[configIndex].fuelTanks.splice(fuelTankIndex, 1);
    }
    checked.current = !checked.current;
    setAircraft(tmp);
  }

  checked.current = fuelTankIndex >= 0;
  return (
    <tr className="fuelTankSelect" onClick={selectCheckbox}>
      <td>
        <input
          disabled={!fuelTank.removable}
          onChange={() => { }}
          checked={!fuelTank.removable || checked.current}
          type={"checkbox"} />
      </td>
      <td>{fuelTank.name}</td>
      <td>{roundNumber(convertLengthUnit(fuelTank.arm, baseLengthUnit, units.lengthUnits), unitPrecision)} {units.fuelUnits}</td>
      <td>{roundNumber(convertFuelUnits(fuelTank.maxWeight, baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision)} {units.fuelUnits}</td>
      <td>{roundNumber(convertFuelUnits(fuelTank.unusable, baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision)} {units.fuelUnits}</td>
    </tr>
  );
}

interface EquipmentSelectionProps {
  equipment: equipmentT,
  configIndex: number,
  aircraft: aircraftT,
  setAircraft: (arg0: aircraftT) => void
}

function EquipmentSelection({ equipment, configIndex, aircraft, setAircraft }: EquipmentSelectionProps): ReactElement {
  const units = useContext(UnitContext);
  const oldCount = useRef(1);
  const [count, setCount] = useState(1);
  let equipmentIndex = -1;
  if (configIndex >= 0) equipmentIndex = aircraft.aircraftConfigs[configIndex].equipment.findIndex((s: { id: string, count: number }) => s.id == equipment.id);
  const checked = useRef(equipmentIndex >= 0);

  function selectCheckbox(): void {
    if (configIndex < 0) return;
    checked.current = !checked.current;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    if (checked.current) {
      if (tmp.aircraftConfigs[configIndex].equipment.findIndex((s: { id: string, count: number }) => s.id === equipment.id) < 0) {
        tmp.aircraftConfigs[configIndex].equipment.push({ id: equipment.id, count: Math.max(count, oldCount.current) });
        setCount(Math.max(count, oldCount.current));
      }
    } else {
      tmp.aircraftConfigs[configIndex].equipment.splice(equipmentIndex, 1);
      oldCount.current = count;
      setCount(0);
    }
    setAircraft(tmp);
  }

  function setAircraftCount(value: number): void {
    if (!checked.current) return;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.aircraftConfigs[configIndex].equipment[equipmentIndex].count = value;
    if (value === 0) {
      selectCheckbox();
      return;
    }
    setCount(value);
    setAircraft(tmp);
  }

  checked.current = equipmentIndex >= 0;
  useEffect(() => {
    setCount(equipmentIndex >= 0 ? aircraft.aircraftConfigs[configIndex].equipment[equipmentIndex].count : 0);
    oldCount.current = 1;
  }, [configIndex])
  return (
    <tr className="equipmentSelect">
      <td onClick={selectCheckbox}>
        <input onChange={() => { }} checked={checked.current} type={"checkbox"} />
      </td>
      <td onClick={selectCheckbox}>{equipment.name}</td>
      <td onClick={selectCheckbox}>{roundNumber(convertLengthUnit(equipment.arm, baseLengthUnit, units.lengthUnits), unitPrecision)} {units.lengthUnits}</td>
      <td onClick={selectCheckbox}>{roundNumber(convertWeightUnit(equipment.weight, baseWeightUnit, units.weightUnits), unitPrecision)} {units.weightUnits}</td>
      <td>
        <input
          id={`equipmentCount-${equipment.id}`}
          disabled={!checked.current}
          min={0}
          value={count}
          type={"number"}
          onChange={(e) => setAircraftCount(Number(e.target.value))} />
      </td>
    </tr>
  );
}

interface AircraftConfigsProps {
  aircraft: aircraftT,
  setAircraft: (arg0: aircraftT) => void,
  selectedConfig: string,
  setSelectedConfig: (arg0: string) => void
}

function AircraftConfigs({ aircraft, setAircraft, selectedConfig, setSelectedConfig }: AircraftConfigsProps & nameProps): ReactElement {
  const units = useContext(UnitContext);
  if (validateAircraft(aircraft)) return (<h2 style={{ margin: " 20px auto" }}>Invalid Config</h2>);
  const configIndex = aircraft.aircraftConfigs.findIndex(c => c.id === selectedConfig);

  function addConfig(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    const newConfig: aircraftConfigT = {
      id: crypto.randomUUID(),
      name: "Name",
      seats: [],
      cargoAreas: [],
      equipment: [],
      fuelTanks: []
    };
    tmp.aircraftConfigs.push(newConfig);
    setSelectedConfig(newConfig.id);
    setAircraft(tmp);
  }

  function duplicateConfig() {
    if (configIndex < 0) return;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    const newConfig: aircraftConfigT = JSON.parse(JSON.stringify(tmp.aircraftConfigs[configIndex]));
    newConfig.id = crypto.randomUUID();
    newConfig.name = newConfig.name + " - Copy";
    tmp.aircraftConfigs.push(newConfig);
    setSelectedConfig(newConfig.id);
    setAircraft(tmp);
  }

  function deleteConfig(): void {
    if (configIndex < 0) return;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    const oldConfig = tmp.aircraftConfigs.splice(configIndex, 1)[0].id;
    const newConfig = tmp.aircraftConfigs.length > 0 ? tmp.aircraftConfigs[0].id : "";
    for (const [index, opsConf] of tmp.operationConfigs.entries()) {
      const usesConfig = opsConf.config == oldConfig;
      if (usesConfig) {
        tmp.operationConfigs[index].config = newConfig;
        // TODO: This could be done more intelligently to only remove missing items in the new
        // config
        tmp.operationConfigs[index].seats = [];
        tmp.operationConfigs[index].cargoAreas = [];
      }
    }
    setSelectedConfig(newConfig);
    setAircraft(tmp);
  }

  function setName(name: string): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.aircraftConfigs[configIndex].name = name;
    setAircraft(tmp);
  }

  return (
    <>
      <Subregion>
        <div id="aircraftTitle">
          <div>
            <p style={{ fontSize: ".7rem" }}>Active Config</p>
            <select
              id='configSelect'
              onChange={(e) => setSelectedConfig(e.target.value)}
              value={selectedConfig}>
              {aircraft.aircraftConfigs.map((conf) => {
                return <option key={conf.id + "selectOption"} value={conf.id}>{conf.name}</option>
              })}
            </select>
          </div>
          <div>
            <p>Config Name</p>
            <input
              id='configName'
              value={configIndex >= 0 ? aircraft.aircraftConfigs[configIndex].name : ""}
              onChange={(e) => setName(e.target.value)} />
          </div>
          <button onClick={addConfig}>Add</button>
          <button onClick={duplicateConfig}>Duplicate</button>
          <button onClick={deleteConfig}>Delete</button>
        </div>
        <p>Using the defined seats, cargo areas, fuel tanks, and equipment define all layouts the aircraft can be configured in</p>
      </Subregion>
      <MultiPane>
        <Subregion name={"Seats"}>
          <table className="tableData sortedTable">
            <thead>
              <tr>
                <th><FontAwesomeIcon icon={faCheck} /></th>
                <th style={{ width: "9.5rem" }}>Name</th>
                <th className="defaultForward" style={{ width: "5.5rem" }}>{`Arm (${units.lengthUnits})`}</th>
                <th style={{ width: "9.5rem" }}>{`Max Weight (${units.weightUnits})`}</th>
                <th style={{ width: "5rem" }}># Seats</th>
              </tr>
            </thead>
            <tbody>
              {aircraft.seats.map((seat: seatT) => {
                return <SeatSelection key={seat.id + " seatSelect"} configIndex={configIndex} seat={seat} aircraft={aircraft} setAircraft={setAircraft} />
              })}
            </tbody>
          </table>
        </Subregion>
        <Subregion name={"Cargo Areas"}>
          <table className="tableData sortedTable">
            <thead>
              <tr>
                <th><FontAwesomeIcon icon={faCheck} /></th>
                <th style={{ width: "9.5rem" }}>Name</th>
                <th className="defaultForward" style={{ width: "5.5rem" }}>{`Arm (${units.lengthUnits})`}</th>
                <th style={{ width: "9.5rem" }}>{`Max Weight (${units.weightUnits})`}</th>
              </tr>
            </thead>
            <tbody>
              {aircraft.cargoAreas.map((cargo: cargoAreaT) => {
                return <CargoSelection key={cargo.id + " cargoSelect"} configIndex={configIndex} cargoArea={cargo} aircraft={aircraft} setAircraft={setAircraft} />
              })}
            </tbody>
          </table>
        </Subregion>
        <Subregion name={"Fuel Tanks"}>
          <table className="tableData sortedTable">
            <thead>
              <tr>
                <th><FontAwesomeIcon icon={faCheck} /></th>
                <th style={{ width: "9.5rem" }}>Name</th>
                <th className="defaultForward" style={{ width: "5.5rem" }}>{`Arm (${units.lengthUnits})`}</th>
                <th style={{ width: "9rem" }}>{`Max Fuel (${units.fuelUnits})`}</th>
                <th style={{ width: "11.5rem" }}>{`Unusable Fuel (${units.fuelUnits})`}</th>
              </tr>
            </thead>
            <tbody>
              {aircraft.fuelTanks.map((fuel: fuelTankT) => {
                return <FuelSelection key={fuel.id + " fuelSelect"} configIndex={configIndex} fuelTank={fuel} aircraft={aircraft} setAircraft={setAircraft} />
              })}
            </tbody>
          </table>
        </Subregion>
        <Subregion name={"Equipment"}>
          <table className="tableData sortedTable">
            <thead>
              <tr>
                <th><FontAwesomeIcon icon={faCheck} /></th>
                <th style={{ width: "9.5rem" }}>Name</th>
                <th className="defaultForward" style={{ width: "5.5rem" }}>{`Arm (${units.lengthUnits})`}</th>
                <th style={{ width: "9.5rem" }}>{`Weight (${units.weightUnits})`}</th>
                <th style={{ width: "5rem" }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {aircraft.equipment.map((equipment: equipmentT) => {
                return <EquipmentSelection key={equipment.id + " equipSelect"} configIndex={configIndex} equipment={equipment} aircraft={aircraft} setAircraft={setAircraft} />
              })}
            </tbody>
          </table>
        </Subregion>
      </MultiPane>
    </>
  );
}

export default AircraftConfigs;
