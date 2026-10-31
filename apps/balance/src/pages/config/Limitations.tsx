import "./Limitations.css"
import "../../Layout.css"
import { useContext, useRef, type ClipboardEvent, type ReactNode } from "react";
import { Subregion } from "../../Layout";
import { type regionT, type regionPointT, type weightLimitT, type aircraftProps, type aircraftT, type nameProps, baseLengthUnit, baseWeightUnit } from "../../Types";
import { convertLengthUnit, convertWeightUnit, UnitContext, unitPrecision } from "../../UnitsContext";
import { roundNumber, validateAircraft } from "../../utility";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const availableStyles = [['Solid', ''], ['Dashed', '1 1'], ['Dotted', '.3 1'], ['Dot Dash', '3 2 .4 2']]

interface weightLimitProps extends aircraftProps {
  limit: weightLimitT
}

function WeightLimit({ limit, aircraft, setAircraft }: weightLimitProps): ReactNode {
  const units = useContext(UnitContext);
  const index = aircraft.limits.limits.findIndex((lim: weightLimitT) => lim.id === limit.id);
  const timeRef = useRef(0);
  if (index < 0) return;

  function setValue<K extends keyof weightLimitT, V extends weightLimitT[K]>(key: K, value: V): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.limits.limits[index][key] = value;
    setAircraft(tmp);
  }

  function setColor(color: string) {
    const now = Date.now();
    if (now - timeRef.current < 100) return;
    timeRef.current = now;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.limits.limits[index]['color'] = color;
    setAircraft(tmp);
  }

  function removeLimit(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.limits.limits.splice(index, 1);
    setAircraft(tmp);
  }

  return (
    <tr className="weightLimit">
      <td>
        <input
          id={`geometryLimitName-${limit.id}`}
          placeholder="Limit Name"
          defaultValue={limit.name}
          onChange={e => setValue("name", e.target.value)} />
      </td>
      <td>
        <input
          id={`geometryLimitWeight-${limit.id}`}
          placeholder={units.weightUnits}
          type="number"
          value={limit.weight ? roundNumber(convertWeightUnit(limit.weight, baseWeightUnit, units.weightUnits), unitPrecision) : ""}
          onChange={e => setValue("weight", convertWeightUnit(Number(e.target.value), units.weightUnits, baseWeightUnit))} />
      </td>
      <td>
        <input
          id={`geometryLimitColor-${limit.id}`}
          type="color"
          value={limit.color}
          onChange={e => setColor(e.target.value)} />
      </td>
      <td>
        <select
          id={`geometryLimitStyle-${limit.id}`}
          value={limit.lineStyle}
          onChange={e => setValue('lineStyle', e.target.value)}>
          {availableStyles.map((style: string[]) => <option key={style[0]} value={style[1]}>{style[0]}</option>)}
        </select>
      </td>
      <td>
        <button onClick={removeLimit}><FontAwesomeIcon icon={faXmark} /></button>
      </td>
    </tr>
  );
}

interface weightRegionRowProps extends aircraftProps {
  regionPoint: regionPointT,
  regionIndex: number,
  index: number,
}

function WeightRegionRow({ regionPoint, aircraft, setAircraft, regionIndex, index }: weightRegionRowProps): ReactNode {
  const units = useContext(UnitContext);

  function setValue<K extends keyof regionPointT, V extends regionPointT[K]>(key: K, value: V): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.limits.regions[regionIndex].data[index][key] = value;
    setAircraft(tmp);
  }

  function addPoint(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.limits.regions[regionIndex].data.splice(index, 0, { arm: regionPoint.arm, weight: regionPoint.weight, id: crypto.randomUUID() });
    setAircraft(tmp);
  }

  function deletePoint(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.limits.regions[regionIndex].data.splice(index, 1);
    setAircraft(tmp);
  }

  function paste(event: ClipboardEvent<HTMLInputElement>): void {
    event.preventDefault();
    const raw = event.clipboardData.getData("text/plain");
    const data: regionPointT[] = [];
    for (const row of raw.split("\n")) {
      if (row == "") break;
      const split = row.split("\t");
      if (split.length < 2) return; // Break out and don't do anything
      if (isNaN(Number(split[0])) || isNaN(Number(split[1]))) return;
      data.push({ id: crypto.randomUUID(), weight: Number(split[0]), arm: Number(split[1]) });
    }

    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.limits.regions[regionIndex].data.splice(index, 1)
    for (let i = 0; i < data.length; i++) {
      tmp.limits.regions[regionIndex].data.splice(index + i, 0, data[i])
    }
    setAircraft(tmp);
  }

  return (
    <tr className="weightRegionRow">
      <td>
        <input
          id={`geometryRegionPointWeight-${regionPoint.id}`}
          placeholder={units.weightUnits}
          min={0}
          step={10}
          type="number"
          value={regionPoint.weight ? roundNumber(convertWeightUnit(regionPoint.weight, baseWeightUnit, units.weightUnits), unitPrecision) : ""}
          onPaste={e => paste(e)}
          onChange={e => setValue('weight', convertWeightUnit(Number(e.target.value), units.weightUnits, baseWeightUnit))} />
      </td>
      <td>
        <input
          id={`geometryRegionPointArm-${regionPoint.id}`}
          placeholder={units.lengthUnits}
          type="number"
          value={regionPoint.arm ? roundNumber(convertLengthUnit(regionPoint.arm, baseLengthUnit, units.lengthUnits), unitPrecision) : ""}
          onChange={e => setValue('arm', convertLengthUnit(Number(e.target.value), units.lengthUnits, baseLengthUnit))} />
      </td>
      <td>
        {aircraft.limits.regions[regionIndex].data.length > 3 &&
          <button onClick={deletePoint}><FontAwesomeIcon icon={faXmark} /></button>}
      </td>
      <td>
        {<button className="addButton" onClick={addPoint}></button>}
      </td>
    </tr>
  );
}

interface weightRegionProps extends aircraftProps {
  region: regionT
}

function WeightRegion({ region, aircraft, setAircraft }: weightRegionProps): ReactNode {
  const units = useContext(UnitContext);
  const regionIndex = aircraft.limits.regions.findIndex((reg: regionT) => reg.id === region.id);
  const timeRef = useRef(0);

  if (regionIndex < 0) {
    console.log("Warning: Did not find region index in config");
    return;
  }

  function setValue<K extends keyof regionT, V extends regionT[K]>(key: K, value: V): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.limits.regions[regionIndex][key] = value;
    setAircraft(tmp);
  }

  function removeRegion(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.limits.regions.splice(regionIndex, 1);
    setAircraft(tmp);
  }

  function setColor(color: string): void {
    const now = Date.now();
    if (now - timeRef.current < 100) return;
    timeRef.current = now;
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    tmp.limits.regions[regionIndex].color = color;
    setAircraft(tmp);
  }

  const name = region.name;
  return (
    <details className="weightRegion">
      <summary style={{ width: "100%", display: 'flex', justifyContent: 'space-between', alignItems: "center", cursor: 'pointer' }}>
        <div className="title">
          <input
            id={`geometryRegionName-${region.id}`}
            placeholder="Name"
            defaultValue={name}
            onChange={e => setValue('name', e.target.value)} />
          <input
            id={`geometryRegionColor-${region.id}`}
            type="color"
            value={region.color}
            onChange={e => setColor(e.target.value)} />
          <select
            id={`geometryRegionStyle-${region.id}`}
            value={region.lineStyle}
            onChange={e => setValue('lineStyle', e.target.value)}>
            {availableStyles.map((style: string[]) =>
              <option key={style[0]} value={style[1]}>{style[0]}</option>
            )}
          </select>
          <button onClick={removeRegion}><FontAwesomeIcon icon={faXmark} /></button>
        </div>
      </summary>
      <table className="regionTable">
        <tbody>
          <tr>
            <th>Weight ({units.weightUnits})</th>
            <th>Arm ({units.lengthUnits})</th>
            <th></th>
          </tr>
          {region.data.map((regionPoint: regionPointT, index: number) => {
            return <WeightRegionRow
              key={regionPoint.id}
              aircraft={aircraft}
              regionIndex={regionIndex}
              setAircraft={setAircraft}
              index={index}
              regionPoint={regionPoint} />
          })}
        </tbody>
      </table>
    </details>
  );
}

function AircraftLimits({ aircraft, setAircraft }: aircraftProps): ReactNode {
  const units = useContext(UnitContext);
  function addLimit(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    const newLimit: weightLimitT = {
      name: "",
      id: crypto.randomUUID(),
      weight: 0,
      color: '#444444'
    };
    tmp.limits.limits.push(newLimit);
    setAircraft(tmp);
  }

  function addRegion(): void {
    const tmp: aircraftT = JSON.parse(JSON.stringify(aircraft));
    const newLimit: regionT = {
      name: "",
      id: crypto.randomUUID(),
      color: '#000000',
      data: [
        { id: crypto.randomUUID(), weight: 1000, arm: 10 },
        { id: crypto.randomUUID(), weight: 2000, arm: 10 },
        { id: crypto.randomUUID(), weight: 2000, arm: 20 },
        { id: crypto.randomUUID(), weight: 1000, arm: 20 }
      ]
    };
    tmp.limits.regions.push(newLimit);
    setAircraft(tmp);
  }

  return (
    <>
      <Subregion id="limits">
        <details open>
          <summary id='title'>
            <h3>Limits</h3>
            <button onClick={addLimit}><FontAwesomeIcon icon={faPlus} /></button>
          </summary>
          <p>Define all weight limits</p>
          {aircraft.limits.limits.length > 0 && <table className="tableData sortedTable">
            <thead>
              <tr>
                <th>Name</th>
                <th className="defaultForward">Weight Limit ({units.weightUnits})</th>
                <th className="noSort">Color</th>
                <th className="noSort">Style</th>
                <th className="noSort"></th>
              </tr>
            </thead>
            <tbody>
              {aircraft.limits.limits.map((limit: weightLimitT) => {
                return <WeightLimit
                  key={limit.id}
                  limit={limit}
                  aircraft={aircraft}
                  setAircraft={setAircraft} />
              })}
            </tbody>
          </table>}
        </details>
      </Subregion>
      <Subregion id="regions">
        <details open>
          <summary id='title'>
            <h3>Regions</h3>
            <button onClick={addRegion}><FontAwesomeIcon icon={faPlus} /></button>
          </summary>
          <p>Define all regions using weight/arm pairs</p>
          {aircraft.limits.regions.map((region: regionT) => (
            <WeightRegion key={region.id} region={region} aircraft={aircraft} setAircraft={setAircraft} />
          ))}
        </details>
      </Subregion>
    </>
  );
}

function Limitations({ aircraft, setAircraft }: aircraftProps & nameProps): ReactNode {
  if (validateAircraft(aircraft)) return (<h2 style={{ margin: " 20px auto" }}>Invalid Config</h2>);
  return (
    <>
      <AircraftLimits aircraft={aircraft} setAircraft={setAircraft} />
    </>
  );
}

export default Limitations;
