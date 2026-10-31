import './Aircraft.css'
import { useRef, type ReactNode, type RefObject } from "react";
import { type aircraftPropertiesT, type configProps, type aircraftT, type configT, type nameProps, baseLengthUnit, baseWeightUnit } from "../../Types";
import { Subregion } from "../../Layout";
import { roundNumber, validateConfig } from '../../utility';
import { convertLengthUnit, convertWeightUnit, unitPrecision } from '../../UnitsContext';

interface aircraftConfigProps extends configProps {
  selectedAircraft: string,
  setSelectedAircraft: (arg0: string) => void
}

function getNewAircraft(): aircraftT {
  return {
    id: crypto.randomUUID(),
    properties: {
      tailNumber: "",
      type: "",
      emptyArm: 0,
      emptyWeight: 0,
      leadingEdgeMAC: 0,
      mac: 0,
    },
    seats: [{
      id: crypto.randomUUID(),
      name: "Pilot Seat",
      arm: 0,
      seatCount: 1,
      lateralDist: 0,
      maxWeight: 200
    }],
    cargoAreas: [],
    fuelTanks: [],
    limits: {
      regions: [],
      limits: []
    },
    equipment: [],
    aircraftConfigs: [],
    operationConfigs: []
  }
}

interface aircraftMergingProps extends configProps {
  selectedAircraft: string
}

function AircraftMerging({ config, setConfig, selectedAircraft }: aircraftMergingProps): ReactNode {
  const selectRef: RefObject<HTMLSelectElement | null> = useRef(null);

  function copyConfig<K extends keyof aircraftT>(key: K[]): void {
    const aircraftIndex = config.aircraft.findIndex(a => a.id === selectedAircraft);
    const tmp: configT = JSON.parse(JSON.stringify(config));
    Array.from(selectRef.current!.selectedOptions).forEach(child => {
      const childAircraftIndex = config.aircraft.findIndex(a => a.id === child.value);

      key.forEach(k => tmp.aircraft[childAircraftIndex][k] = JSON.parse(JSON.stringify(tmp.aircraft[aircraftIndex][k])));
    });
    setConfig(tmp);
  }

  const options = config.aircraft.map(a => {
    if (a.id === selectedAircraft) return;
    return <option key={a.id} value={a.id}>{(a.properties.type != "" ? a.properties.type + ": " : "") + a.properties.tailNumber}</option>;
  });

  return (
    <Subregion>
      <h3>Aircraft Merging</h3>
      <div id='aircraftMergeHolder'>
        <select id='childAircraftSelect' multiple ref={selectRef}>
          {options}
        </select>
        <div id='aircraftCopyRow'>
          <button onClick={() => copyConfig(['limits', 'seats', 'cargoAreas', 'equipment', 'aircraftConfigs', 'operationConfigs'])}>Paste Full Config</button>
          <button onClick={() => copyConfig(['limits'])}>Paste Geometry</button>
          <button onClick={() => copyConfig(['seats', 'cargoAreas'])}>Paste Seats/Cargo</button>
          <button onClick={() => copyConfig(['equipment'])}>Paste Equipment</button>
          <button onClick={() => copyConfig(['aircraftConfigs'])}>Paste Configs</button>
          <button onClick={() => copyConfig(['operationConfigs'])}>Paste Ops Configs</button>
        </div>
      </div>
    </Subregion >
  );
}

function AircraftConfig({ config, setConfig, selectedAircraft, setSelectedAircraft }: aircraftConfigProps & nameProps): ReactNode {
  const aircraftIndex = config.aircraft.findIndex(a => a.id === selectedAircraft);
  if (validateConfig(config)) return (<h2 style={{ margin: " 20px auto" }}>Invalid Config</h2>);

  function setValue<K extends keyof aircraftPropertiesT, V extends aircraftPropertiesT[K]>(key: K, value: V) {
    const tmp: configT = JSON.parse(JSON.stringify(config));
    tmp.aircraft[aircraftIndex].properties[key] = value;
    setConfig(tmp);
  }

  function addAircraft(): void {
    const emptyAircraft = getNewAircraft();

    const tmp: configT = JSON.parse(JSON.stringify(config));
    tmp.aircraft.push(emptyAircraft);
    setSelectedAircraft(tmp.aircraft[tmp.aircraft.length - 1].id)
    setConfig(tmp);
  }

  function duplicateAircraft() {
    const tmp: configT = JSON.parse(JSON.stringify(config));
    tmp.aircraft.push({ ...tmp.aircraft[aircraftIndex], id: crypto.randomUUID() });
    setSelectedAircraft(tmp.aircraft[tmp.aircraft.length - 1].id)
    setConfig(tmp);
  }

  function deleteAircraft() {
    const tmp: configT = JSON.parse(JSON.stringify(config));
    tmp.aircraft.splice(aircraftIndex, 1);
    if (tmp.aircraft.length === 0) {
      tmp.aircraft.push(getNewAircraft());
    }
    setSelectedAircraft(tmp.aircraft.length > 0 ? tmp.aircraft[0].id : "")
    setConfig(tmp);
  }

  const options = config.aircraft.sort((a, b) => a.properties.tailNumber.localeCompare(b.properties.tailNumber)).map(a => {
    return <option key={a.id} value={a.id}>{(a.properties.type != "" ? a.properties.type + ": " : "") + a.properties.tailNumber}</option>
  })

  return (
    <>
      <Subregion>
        <div id='aircraftSelectRow'>
          <div id='selector'>
            <h3>Aircraft</h3>
            <select id="aircraftSelect" value={selectedAircraft} onChange={e => setSelectedAircraft(e.target.value)}>
              {options}
            </select>
          </div>
          <div id='buttons'>
            <button onClick={addAircraft}>Add Aircraft</button>
            <button onClick={duplicateAircraft}>Duplicate Aircraft</button>
            <button onClick={deleteAircraft}>Delete Aircraft</button>
          </div>
        </div>
      </Subregion>
      <AircraftMerging config={config} setConfig={setConfig} selectedAircraft={selectedAircraft} />
      <Subregion>
        <h3>Aircraft Properties</h3>
        <div className="rows">
          <label>Tail Number *</label>
          <input
            id='aircraftTailNumber'
            value={config.aircraft[aircraftIndex].properties.tailNumber}
            placeholder="Tail Number"
            onChange={(e) => setValue('tailNumber', e.target.value)} />
          <label>Aircraft Type *</label>
          <input
            id='aircraftType'
            value={config.aircraft[aircraftIndex].properties.type}
            placeholder="Type"
            onChange={(e) => setValue('type', e.target.value)} />
          <label>Empty Weight ({config.setup.weightUnits}) *</label>
          <input
            id='aircraftEmptyWeight'
            value={config.aircraft[aircraftIndex].properties.emptyWeight ? roundNumber(convertWeightUnit(config.aircraft[aircraftIndex].properties.emptyWeight, baseWeightUnit, config.setup.weightUnits), unitPrecision) : ""}
            type="number"
            placeholder={config.setup.weightUnits}
            onChange={(e) => setValue('emptyWeight', convertWeightUnit(Number(e.target.value), config.setup.weightUnits, baseWeightUnit))} />
          <label>Empty Arm ({config.setup.lengthUnits}) *</label>
          <input
            id='aircraftEmptyArm'
            value={config.aircraft[aircraftIndex].properties.emptyArm ? roundNumber(convertLengthUnit(config.aircraft[aircraftIndex].properties.emptyArm, baseLengthUnit, config.setup.lengthUnits), unitPrecision) : ""}
            type="number"
            placeholder={config.setup.lengthUnits}
            onChange={(e) => setValue('emptyArm', convertLengthUnit(Number(e.target.value), config.setup.lengthUnits, baseLengthUnit))} />
          <label>Leading MAC ({config.setup.lengthUnits})</label>
          <input
            id='aircraftLeadingMAC'
            value={config.aircraft[aircraftIndex].properties.leadingEdgeMAC ? roundNumber(convertLengthUnit(config.aircraft[aircraftIndex].properties.leadingEdgeMAC, baseLengthUnit, config.setup.lengthUnits), unitPrecision) : ""}
            type="number"
            placeholder={config.setup.lengthUnits}
            onChange={(e) => setValue('leadingEdgeMAC', convertLengthUnit(Number(e.target.value), config.setup.lengthUnits, baseLengthUnit))} />
          <label>MAC ({config.setup.lengthUnits})</label>
          <input
            id='aircraftMAC'
            value={config.aircraft[aircraftIndex].properties.mac ? roundNumber(convertLengthUnit(config.aircraft[aircraftIndex].properties.mac, baseLengthUnit, config.setup.lengthUnits), unitPrecision) : ""}
            type="number"
            placeholder={config.setup.lengthUnits}
            onChange={(e) => setValue('mac', convertLengthUnit(Number(e.target.value), config.setup.lengthUnits, baseLengthUnit))} />
        </div>
      </Subregion>
    </>
  );
}

export default AircraftConfig;
