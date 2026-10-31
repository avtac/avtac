import '../../Layout.css'
import './Seats.css'
import { useContext } from "react";
import { Subregion } from "../../Layout";
import { type aircraftT, type seatT, type aircraftProps, baseLengthUnit, baseWeightUnit } from "../../Types";
import { convertLengthUnit, convertWeightUnit, UnitContext, unitPrecision } from "../../UnitsContext";
import { roundNumber, validateAircraft } from "../../utility";
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface seatInputProps extends aircraftProps {
  seat: seatT,
  index: number
}

function SeatInput({ seat, index, aircraft, setAircraft }: seatInputProps) {
  const units = useContext(UnitContext);

  function setValue<T extends keyof seatT, V extends seatT[T]>(name: T, value: V): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.seats[index][name] = value;
    setAircraft(tmp);
  }

  function removeSeat(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.seats.splice(index, 1);
    setAircraft(tmp);
    // TODO: check if any configs use this seat id and remove it
  }

  return (
    <tr>
      <td>
        <input name={"name" + index}
          placeholder="Name"
          value={seat.name ? seat.name : ""}
          onChange={e => setValue('name', e.target.value)} />
      </td>
      <td>
        <input
          name={"arm" + index}
          placeholder={units.lengthUnits}
          type="number"
          value={seat.arm ? roundNumber(convertLengthUnit(seat.arm, baseLengthUnit, units.lengthUnits), unitPrecision) : ""}
          onChange={e => setValue('arm', convertLengthUnit(Number(e.target.value), units.lengthUnits, baseLengthUnit))} />
      </td>
      <td>
        <input
          name={"maxWeight" + index}
          placeholder={units.weightUnits}
          min={0}
          type="number"
          value={seat.maxWeight ? roundNumber(convertWeightUnit(seat.maxWeight, baseWeightUnit, units.weightUnits), unitPrecision) : ""}
          onChange={e => setValue('maxWeight', convertWeightUnit(Number(e.target.value), units.weightUnits, baseWeightUnit))} />
      </td>
      <td>
        <input
          name={"lateralDist" + index}
          placeholder={units.lengthUnits}
          type="number"
          value={seat.lateralDist ? roundNumber(convertLengthUnit(seat.lateralDist, baseLengthUnit, units.lengthUnits), unitPrecision) : ""}
          onChange={e => setValue('lateralDist', convertLengthUnit(Number(e.target.value), units.lengthUnits, baseLengthUnit))} />
      </td>
      <td>
        <input
          name={"seatCount" + index}
          placeholder="Count"
          min={1}
          type="number"
          value={seat.seatCount ? seat.seatCount : ""}
          onChange={e => setValue('seatCount', Number(e.target.value))} />
      </td>
      <td>
        <button onClick={() => removeSeat()}><FontAwesomeIcon icon={faXmark} /></button>
      </td>
    </tr >
  );
}

function SeatConfig({ aircraft, setAircraft }: aircraftProps) {
  const units = useContext(UnitContext);
  if (validateAircraft(aircraft)) return (<h2 style={{ margin: " 20px auto" }}>Invalid Config</h2>);

  function addSeat(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.seats.push({
      id: crypto.randomUUID(),
      name: "New",
      arm: 0,
      seatCount: 1,
      maxWeight: 300,
      lateralDist: 0
    });
    setAircraft(tmp);
  }

  return (
    <Subregion>
      <details open id="seatConfig">
        <summary id='title'>
          <h3>Seat Config</h3>
          <button onClick={addSeat}><FontAwesomeIcon icon={faPlus} /></button>
        </summary>
        <p>Define all possible seat positions</p>
        <table className="tableData sortedTable">
          <thead>
            {aircraft.seats.length > 0 &&
              <tr>
                <th>Name</th>
                <th className="defaultForward">{`Arm (${units.lengthUnits})`}</th>
                <th>{`Max Weight (${units.weightUnits})`}</th>
                <th>{`Lateral Offset (${units.lengthUnits})`}</th>
                <th># of Seats</th>
                <th className='noSort'></th>
              </tr>
            }
          </thead>
          <tbody>
            {aircraft.seats.map((seat: seatT, index: number) => (
              <SeatInput
                key={seat.id}
                seat={seat}
                index={index}
                aircraft={aircraft}
                setAircraft={setAircraft} />
            ))}
          </tbody>
        </table>
      </details>
    </Subregion>
  );
}

export { SeatConfig }
