import '../../Layout.css'
import './Fuel.css'
import { useContext } from "react";
import { Subregion } from "../../Layout";
import { type fuelTankT, type aircraftProps, type aircraftT, baseLengthUnit, baseFuelUnit } from "../../Types";
import { convertFuelUnits, convertLengthUnit, UnitContext, unitPrecision } from "../../UnitsContext";
import { roundNumber, validateAircraft } from "../../utility";
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface fuelInputProps extends aircraftProps {
  tank: fuelTankT,
  index: number
}

function FuelInput({ tank, index, aircraft, setAircraft }: fuelInputProps) {
  const units = useContext(UnitContext);

  function setValue<T extends keyof fuelTankT, V extends fuelTankT[T]>(name: T, value: V): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.fuelTanks[index][name] = value;
    setAircraft(tmp);
  }

  function removeFuel(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.fuelTanks.splice(index, 1);
    // TODO: check if any configs use this fuelTankT id and remove it
    setAircraft(tmp);
  }

  return (
    <tr>
      <td>
        <input
          name={"name" + index}
          placeholder="Name"
          value={tank.name ? tank.name : ""}
          onChange={e => setValue('name', e.target.value)} />
      </td>
      <td>
        <input
          name={"arm" + index}
          placeholder={units.lengthUnits}
          type="number"
          value={tank.arm ? roundNumber(convertLengthUnit(tank.arm, baseLengthUnit, units.lengthUnits), unitPrecision) : ""}
          onChange={e => setValue('arm', convertLengthUnit(Number(e.target.value), units.lengthUnits, baseLengthUnit))} />
      </td>
      <td>
        <input
          name={"maxCapacity" + index}
          placeholder={units.fuelUnits}
          type="number"
          value={tank.maxWeight ? roundNumber(convertFuelUnits(tank.maxWeight, baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision) : ""}
          onChange={e => setValue('maxWeight', convertFuelUnits(Number(e.target.value), units.fuelUnits, baseFuelUnit, units.fuelDensity))} />
      </td>
      <td>
        <input
          name={"unusable" + index}
          placeholder={units.fuelUnits}
          type="number"
          value={tank.unusable ? roundNumber(convertFuelUnits(tank.unusable, baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision) : ""}
          onChange={e => setValue('unusable', convertFuelUnits(Number(e.target.value), units.fuelUnits, baseFuelUnit, units.fuelDensity))} />
      </td>
      <td>
        <input
          name={"priority" + index}
          placeholder="0"
          min={0}
          type="number"
          value={tank.priority ? tank.priority : ""}
          onChange={e => setValue('priority', Number(e.target.value))} />
      </td>
      <td>
        <input
          type="checkbox"
          checked={aircraft.fuelTanks[index].removable}
          onChange={e => setValue('removable', e.target.checked)} />
      </td>
      <td>
        <button onClick={() => removeFuel()}><FontAwesomeIcon icon={faXmark} /></button>
      </td>
    </tr>
  );
}

function FuelConfig({ aircraft, setAircraft }: aircraftProps) {
  const units = useContext(UnitContext);
  if (validateAircraft(aircraft)) return <></>;

  function addFuel(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.fuelTanks.push({
      id: crypto.randomUUID(),
      name: "",
      arm: 0,
      maxWeight: 300,
      unusable: 0,
      removable: false,
      priority: 0
    });
    setAircraft(tmp);
  }

  return (
    <Subregion>
      <details open id="fuelConfig">
        <summary id='title'>
          <h3>Fuel Config</h3>
          <button onClick={addFuel}><FontAwesomeIcon icon={faPlus} /></button>
        </summary>
        <p>Define all possible fuel tanks</p>
        <table className="tableData sortedTable">
          <thead>
            {aircraft.fuelTanks.length > 0 &&
              <tr>
                <th>Name</th>
                <th className="defaultForward">{`Arm (${units.lengthUnits})`}</th>
                <th>{`Max Fuel (${units.fuelUnits})`}</th>
                <th>{`Unusable Fuel (${units.fuelUnits})`}</th>
                <th>Priority</th>
                <th>Removable</th>
                <th className='noSort'></th>
              </tr>
            }
          </thead>
          <tbody>
            {
              aircraft.fuelTanks.map((tank: fuelTankT, index: number) => (
                <FuelInput
                  key={tank.id}
                  tank={tank}
                  index={index}
                  aircraft={aircraft}
                  setAircraft={setAircraft} />
              ))
            }
          </tbody >
        </table >
      </details >
    </Subregion >
  );
}

export { FuelConfig }
