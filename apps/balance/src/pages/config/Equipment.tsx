import './Equipment.css'
import '../../Layout.css'
import { Subregion } from '../../Layout'
import { type cargoAreaT, type aircraftT, type equipmentT, type seatT, type nameProps, baseLengthUnit, baseWeightUnit } from '../../Types'
import { getSortedByArm, roundNumber, validateAircraft } from '../../utility';
import { useContext, type ReactElement } from 'react';
import { convertLengthUnit, convertWeightUnit, UnitContext, unitPrecision } from '../../UnitsContext';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface equipmentRowProps {
  setAircraft: (arg0: aircraftT) => void,
  values: (seatT | cargoAreaT)[],
  index: number,
  equip: equipmentT,
  aircraft: aircraftT,
}

function EquipmentRow({ equip, values, index, aircraft, setAircraft }: equipmentRowProps) {
  const units = useContext(UnitContext);
  const areaIndex = values.findIndex((s) => s.id === equip.area);

  function deleteEquipment(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.equipment.splice(index, 1);
    setAircraft(tmp);
  }

  function setValue<K extends keyof equipmentT, V extends equipmentT[K]>(key: K, value: V): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.equipment[index][key] = value;
    setAircraft(tmp);
  }

  function setCargoArea(value: string): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.equipment[index].area = value;
    const valueIndex = values.findIndex((s) => s.id === equip.area);
    if (valueIndex >= 0)
      tmp.equipment[index].arm = values[valueIndex].arm;
    setAircraft(tmp);
  }

  return (
    <tr>
      <td>
        <input
          id={`equipmentName-${equip.id}`}
          defaultValue={equip.name}
          placeholder={"Name"}
          onChange={(e) => setValue('name', e.target.value)} />
      </td>
      <td>
        <input
          id={`equipmentWeight-${equip.id}`}
          type="number"
          value={equip.weight ? roundNumber(convertWeightUnit(equip.weight, baseWeightUnit, units.weightUnits), unitPrecision) : ""}
          placeholder={units.weightUnits}
          onChange={(e) => setValue('weight', convertWeightUnit(Number(e.target.value), units.weightUnits, baseWeightUnit))}
          min={0} />
      </td>
      <td>
        <select
          id={`equipmentArea-${equip.id}`}
          value={equip.area}
          onChange={(e) => setCargoArea(e.target.value)}>
          <option value={""}>Manual</option>
          {values.map((area) => {
            return <option key={area.id} value={area.id}>{area.name}</option>
          })}
        </select>
      </td>
      <td>
        <input
          id={`equipmentArm-${equip.id}`}
          type="number"
          value={areaIndex < 0 ? (equip.arm ? roundNumber(convertLengthUnit(equip.arm, baseLengthUnit, units.lengthUnits), unitPrecision) : "") : roundNumber(convertLengthUnit(values[areaIndex].arm, baseLengthUnit, units.lengthUnits), unitPrecision)}
          disabled={areaIndex >= 0}
          placeholder={units.lengthUnits}
          onChange={(e) => setValue('arm', convertLengthUnit(Number(e.target.value), units.lengthUnits, baseLengthUnit))} />
      </td>
      <td>
        <button onClick={deleteEquipment}><FontAwesomeIcon icon={faXmark} /></button>
      </td>
    </tr>
  );
}

interface equipmentProps {
  aircraft: aircraftT,
  setAircraft: (arg0: aircraftT) => void
}

function Equipment({ aircraft, setAircraft }: equipmentProps & nameProps): ReactElement {
  const units = useContext(UnitContext);
  if (validateAircraft(aircraft)) return (<h2 style={{ margin: " 20px auto" }}>Invalid Config</h2>);

  // S or C are appended to the start of the area id in the equipment type to denote seat or cargoArea in selection value
  const values = getSortedByArm([...aircraft.seats.map(s => { return { ...s, id: "S" + s.id } }), ...aircraft.cargoAreas.map(c => { return { ...c, id: "C" + c.id } })])

  function addEquipment(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.equipment.push({
      id: crypto.randomUUID(),
      name: "",
      weight: 0,
      arm: 0,
      area: ""
    });
    setAircraft(tmp);
  }

  return (
    <Subregion id='editEquipmentTable'>
      <div id='title' style={{ cursor: 'unset' }}>
        <h3>Equipment</h3>
        <button onClick={addEquipment}><FontAwesomeIcon icon={faPlus} /></button>
      </div>
      <p>Define all possible equipment not included in the empty weight</p>
      <table className='tableData sortedTable'>
        <thead>
          <tr>
            <th>Name</th>
            <th>{`Weight (${units.weightUnits})`}</th>
            <th>Cargo Area</th>
            <th className="defaultForward">{`Arm (${units.lengthUnits})`}</th>
            <th className='noSort'></th>
          </tr>
        </thead>
        <tbody>
          {[...aircraft.equipment].map((data, i) => {
            return <EquipmentRow
              key={data.id}
              equip={data}
              values={values}
              index={i}
              aircraft={aircraft}
              setAircraft={setAircraft} />
          })}
        </tbody>
      </table>
    </Subregion>
  );
}

export { Equipment }
