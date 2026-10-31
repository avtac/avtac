import '../../Layout.css'
import './Cargo.css'
import { useContext } from "react";
import { Subregion } from "../../Layout";
import { type cargoAreaT, type aircraftProps, type aircraftT, baseLengthUnit, baseWeightUnit } from "../../Types";
import { convertLengthUnit, convertWeightUnit, UnitContext, unitPrecision } from "../../UnitsContext";
import { roundNumber, validateAircraft } from "../../utility";
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface cargoInputProps extends aircraftProps {
  area: cargoAreaT,
  index: number
}

function CargoInput({ area, index, aircraft, setAircraft }: cargoInputProps) {
  const units = useContext(UnitContext);

  function setValue<T extends keyof cargoAreaT, V extends cargoAreaT[T]>(name: T, value: V): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.cargoAreas[index][name] = value;
    setAircraft(tmp);
  }

  function removeCargo(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.cargoAreas.splice(index, 1);
    // TODO: check if any configs use this cargo id and remove it
    setAircraft(tmp);
  }

  return (
    <tr>
      <td>
        <input
          name={"name" + index}
          placeholder="Name"
          value={area.name ? area.name : ""}
          onChange={e => setValue('name', e.target.value)} />
      </td>
      <td>
        <input
          name={"arm" + index}
          placeholder={units.lengthUnits}
          type="number"
          value={area.arm ? roundNumber(convertLengthUnit(area.arm, baseLengthUnit, units.lengthUnits), unitPrecision) : ""}
          onChange={e => setValue('arm', convertLengthUnit(Number(e.target.value), units.lengthUnits, baseLengthUnit))} />
      </td>
      <td>
        <input
          name={"maxWeight" + index}
          placeholder={units.weightUnits}
          type="number"
          min={0}
          value={area.maxWeight ? roundNumber(convertWeightUnit(area.maxWeight, baseWeightUnit, units.weightUnits), unitPrecision) : ""}
          onChange={e => setValue('maxWeight', convertWeightUnit(Number(e.target.value), units.weightUnits, baseWeightUnit))} />
      </td>
      <td>
        <button onClick={() => removeCargo()}><FontAwesomeIcon icon={faXmark} /></button>
      </td>
    </tr>
  );
}

function CargoConfig({ aircraft, setAircraft }: aircraftProps) {
  const units = useContext(UnitContext);
  if (validateAircraft(aircraft)) return;

  function addCargo(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.cargoAreas.push({
      id: crypto.randomUUID(),
      name: "",
      arm: 0,
      maxWeight: 300
    });
    setAircraft(tmp);
  }

  return (
    <Subregion>
      <details open id="cargoConfig">
        <summary id='title'>
          <h3>Cargo Config</h3>
          <button onClick={addCargo}><FontAwesomeIcon icon={faPlus} /></button>
        </summary>
        <p>Define all possible cargo locations</p>
        <table className="tableData sortedTable">
          <thead>
            {aircraft.cargoAreas.length > 0 &&
              <tr>
                <th>Name</th>
                <th className="defaultForward">{`Arm (${units.lengthUnits})`}</th>
                <th>{`Max Weight (${units.weightUnits})`}</th>
                <th className='noSort'></th>
              </tr>
            }
          </thead>
          <tbody>
            {aircraft.cargoAreas.map((area: cargoAreaT, index: number) => (
              <CargoInput
                key={area.id}
                area={area}
                index={index}
                aircraft={aircraft}
                setAircraft={setAircraft} />
            ))}
          </tbody>
        </table>
      </details>
    </Subregion >
  );
}

export { CargoConfig }
