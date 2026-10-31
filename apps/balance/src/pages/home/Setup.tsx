import './Setup.css'
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { showPopupDialog, Subregion } from "../../Layout";
import { type configProps, type configT, type nameProps, type weightUnitsT, type setupT, type lengthUnitsT, type fuelUnitsT, volumeUnits, type volumeUnitsT, baseVolumeUnit, baseWeightUnit } from "../../Types";
import { activeConfigData, roundNumber, uploadedConfigs, validateConfig } from "../../utility";
import { convertDensityUnits, fuelTypes, fuelUnitsElements, lengthUnitsElements, unitPrecision, weightUnitsElements } from '../../UnitsContext';

interface unitsProps extends configProps {
  macAvailable: boolean;
}

function Units({ config, setConfig, macAvailable }: unitsProps): ReactNode {
  const [selectedDensity, setSelectedDensity] = useState(fuelTypes.length - 1);
  const oldDensity = useRef(6);

  useEffect(() => {
    if (config.id) {
      config.setup.useMAC = macAvailable;
      setSelectedDensity(index >= 0 ? index : fuelTypes.length - 1)
      oldDensity.current = config.setup.fuelDensity;
    }
  }, [])
  if (!config.id) return (<></>);
  const index = fuelTypes.findIndex(t => t.density === config.setup.fuelDensity);

  function setValue<T extends keyof setupT, V extends setupT[T]>(name: T, value: V): void {
    const tmp: configT = JSON.parse(JSON.stringify(config));
    tmp.setup[name] = value;
    setConfig(tmp);
  }

  function setSelectedDensitySpecial(selection: number) {
    setSelectedDensity(selection);
    if (selection === fuelTypes.length - 1) {
      return;
    }
    const newDensity = fuelTypes[selection].density; // lbs/gal
    // Loop through every tank and convert weights
    const tmp: configT = JSON.parse(JSON.stringify(config));
    tmp.setup.fuelDensity = newDensity;
    for (let i = 0; i < config.aircraft.length; i++) {
      for (let j = 0; j < config.aircraft[i].fuelTanks.length; j++) {
        tmp.aircraft[i].fuelTanks[j].maxWeight = tmp.aircraft[i].fuelTanks[j].maxWeight / oldDensity.current * newDensity;
        tmp.aircraft[i].fuelTanks[j].unusable = tmp.aircraft[i].fuelTanks[j].unusable / oldDensity.current * newDensity;
      }
    }
    setConfig(tmp);
    oldDensity.current = newDensity;
  }

  function setManualDensity(density: number) {
    const newDensity = density; //lbs/gal
    if (newDensity === 0) {
      setValue('fuelDensity', newDensity);
      return;
    }
    const tmp: configT = JSON.parse(JSON.stringify(config));
    tmp.setup.fuelDensity = density;
    for (let i = 0; i < config.aircraft.length; i++) {
      for (let j = 0; j < config.aircraft[i].fuelTanks.length; j++) {
        tmp.aircraft[i].fuelTanks[j].maxWeight = tmp.aircraft[i].fuelTanks[j].maxWeight / oldDensity.current * newDensity;
        tmp.aircraft[i].fuelTanks[j].unusable = tmp.aircraft[i].fuelTanks[j].unusable / oldDensity.current * newDensity;
      }
    }
    setConfig(tmp);
    oldDensity.current = newDensity;
  }

  let fuelTypeElements: ReactNode = []
  if (volumeUnits.includes(config.setup.fuelUnits as volumeUnitsT)) {
    fuelTypeElements = fuelTypes.map((t, i) => {
      return (<option
        key={t.name}
        value={i}>
        {t.name} ({i < fuelTypes.length - 1 ? roundNumber(convertDensityUnits(t.density, baseVolumeUnit, baseWeightUnit, config.setup.fuelUnits as volumeUnitsT, config.setup.weightUnits), unitPrecision) : roundNumber(convertDensityUnits(config.setup.fuelDensity, baseVolumeUnit, baseWeightUnit, config.setup.fuelUnits as volumeUnitsT, config.setup.weightUnits), unitPrecision)})
      </option>)
    });
  }
  return (
    <Subregion>
      <h3>Units</h3>
      {macAvailable && (<>
        <label htmlFor='useMACCheck'>Use MAC</label>
        <input id='useMACCheck' type='checkbox' checked={config.setup.useMAC} onChange={(e) => setValue('useMAC', e.target.checked)} />
      </>)}
      <div id='unitsSelect'>
        <label htmlFor="weightUnitSelect">Weight</label>
        <select id="weightUnitSelect" value={config.setup.weightUnits} onChange={e => setValue('weightUnits', e.target.value as weightUnitsT)}>
          {weightUnitsElements}
        </select>
        <label htmlFor="lengthUnitSelect">Length</label>
        <select id="lengthUnitSelect" value={config.setup.lengthUnits} onChange={e => setValue('lengthUnits', e.target.value as lengthUnitsT)}>
          {lengthUnitsElements}
        </select>
        <label htmlFor="fuelUnitSelect">Fuel</label>
        <select id="fuelUnitSelect" value={config.setup.fuelUnits} onChange={e => setValue('fuelUnits', e.target.value as fuelUnitsT)}>
          {fuelUnitsElements}
        </select>
        {volumeUnits.includes(config.setup.fuelUnits as volumeUnitsT) &&
          <>
            <label htmlFor='fuelDensity'>Fuel Density ({config.setup.weightUnits}/{config.setup.fuelUnits})</label>
            <div id='fuelDensityHolder'>
              <select
                id="fuelDensity"
                value={selectedDensity}
                onChange={(e) => setSelectedDensitySpecial(Number(e.target.value))}>
                {fuelTypeElements}
              </select>
              {selectedDensity === fuelTypes.length - 1 &&
                <input
                  id="fuelDensityInput"
                  type="number"
                  min={0}
                  placeholder={`${config.setup.weightUnits}/${config.setup.fuelUnits}`}
                  value={config.setup.fuelDensity ? roundNumber(convertDensityUnits(config.setup.fuelDensity, baseVolumeUnit, baseWeightUnit, config.setup.fuelUnits as volumeUnitsT, config.setup.weightUnits), unitPrecision) : ""}
                  onChange={(e) => setManualDensity(convertDensityUnits(Number(e.target.value), config.setup.fuelUnits as volumeUnitsT, config.setup.weightUnits, baseVolumeUnit, baseWeightUnit))} />
              }
            </div>
          </>
        }
      </div>
    </Subregion>
  )
}

function appendConfigToSavedConfigs(config: configT): void {
  const savedConfigsString = localStorage.getItem(uploadedConfigs);
  if (savedConfigsString === null) {
    localStorage.setItem(uploadedConfigs,
      JSON.stringify({ [config.id]: config })
    );
    return;
  }
  // TODO: Check if the config already exists and ask if overwrite is OK
  const savedConfigs = JSON.parse(savedConfigsString);
  savedConfigs[config.id] = config;
  localStorage.setItem(uploadedConfigs, JSON.stringify(savedConfigs));
}



interface SetupProps extends configProps, nameProps {
  selectedAircraft: string,
  setSelectedAircraft: (arg0: string) => void
  selectedOpsConfig: string,
  setSelectedOpsConfig: (arg0: string) => void
}

function Setup({ config, setConfig, selectedAircraft, setSelectedAircraft, selectedOpsConfig, setSelectedOpsConfig }: SetupProps): ReactNode {
  const foundConfigs: { id: string, name: string }[] = []
  const [availableConfigList, setAvailableConfigList] = useState(foundConfigs);
  const validityRef: RefObject<(null | HTMLParagraphElement)> = useRef(null);

  useMemo(() => {
    const savedConfigsString = localStorage.getItem(uploadedConfigs);
    if (savedConfigsString) {
      const savedConfigs: { [key: string]: configT } = JSON.parse(savedConfigsString)
      const foundConfigs: { id: string, name: string }[] = Object.entries(savedConfigs).map(([id, config]) => ({ id: id, name: config.name }));
      setAvailableConfigList(foundConfigs);
    }
    const notValid = validateConfig(config);
    if (validityRef.current) validityRef.current.textContent = notValid ? notValid : "";
  }, [config])

  function openFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ".json";
    input.onchange = function(event) {
      const target = event.target as HTMLInputElement;
      if (!target) return;
      const files = target.files;
      if (!files) return;
      if (files.length > 1) return;
      const fileReader = new FileReader();
      fileReader.readAsText(files[0]);
      fileReader.onload = () => {
        const data: string = fileReader.result as string;
        if (!data) return;
        const validity = validateConfig(JSON.parse(data))
        if (validity) {
          showPopupDialog("INVALID", "Uploaded config is invalid\n" + validity);
          return;
        }
        setConfig(JSON.parse(data));
        appendConfigToSavedConfigs(JSON.parse(data));
      };
    };
    input.click();
  }

  function deleteConfig(): void {
    // Get Configs
    const savedConfigsString = localStorage.getItem(uploadedConfigs);
    if (!savedConfigsString) return;
    const savedConfigs: { [key: string]: configT } = JSON.parse(savedConfigsString)
    // Does it include the one to delete
    if (!Object.keys(savedConfigs).includes(config.id)) return;
    // Delete
    delete savedConfigs[config.id];
    localStorage.setItem(uploadedConfigs, JSON.stringify(savedConfigs));
    // Set config to a different config
    if (Object.keys(savedConfigs).length > 0) {
      const foundConfigs: { id: string, name: string }[] = Object.entries(savedConfigs).map(([id, config]) => ({ id: id, name: config.name }));
      setAvailableConfigList(foundConfigs);
      selectConfig(Object.keys(savedConfigs)[0]);
    } else {
      setAvailableConfigList([]);
      setConfig({} as configT);
    }
  }

  function selectConfig(configId: string): void {
    const savedConfigsString = localStorage.getItem(uploadedConfigs);
    if (!savedConfigsString) return;
    const savedConfigs = JSON.parse(savedConfigsString)

    const selectedConfig: (configT | undefined) = savedConfigs[configId];
    if (!selectedConfig) return;
    localStorage.setItem(activeConfigData, JSON.stringify(selectedConfig));
    setConfig(selectedConfig)
  }

  const availableConfigs = availableConfigList.sort((a, b) => a.name.localeCompare(b.name)).map((v) => <option value={v.id} key={v.id}>{v.name}</option>)
  const aircraftOptions = !config.aircraft || validateConfig(config) ? [] : config.aircraft
    .sort((a, b) =>
      a.properties.tailNumber.localeCompare(b.properties.tailNumber)
    )
    .map((a) =>
      <option
        key={a.id}
        value={a.id}>
        {(a.properties.type != "" ? a.properties.type + ": " : "") + a.properties.tailNumber}
      </option>
    )

  const selectedAircraftIndex = config.aircraft ? config.aircraft.findIndex(a => a.id === selectedAircraft) : -1;
  const opsConfigOptions = selectedAircraftIndex < 0 || validateConfig(config) ? [] : config.aircraft[selectedAircraftIndex].operationConfigs
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    .map((a) =>
      <option
        key={a.id}
        value={a.id}>
        {a.name}
      </option>
    )

  return (
    <>
      <Subregion id="balance-configSelectRow">
        <div>
          <h3>Config File</h3>
          <select id="configFileSelect" value={config.id} onChange={e => selectConfig(e.target.value)}>
            {availableConfigs}
          </select>
        </div>
        <p ref={validityRef}></p>
        <div id="buttons">
          <button onClick={openFile}>Upload Config</button>
          <button onClick={deleteConfig}>Remove Config</button>
        </div>
      </Subregion>
      <Subregion id='aircraftSelect'>
        <h3>{config.name}</h3>
        <div>
          <label htmlFor='setAircraft'>Aircraft</label>
          <select
            id='setAircraft'
            value={selectedAircraft}
            onChange={(e) => setSelectedAircraft(e.target.value)}>
            {aircraftOptions}
          </select>
          <label htmlFor='setOpsConfig'>Configuration</label>
          <select
            id='setOpsConfig'
            value={selectedOpsConfig}
            onChange={(e) => setSelectedOpsConfig(e.target.value)}>
            {opsConfigOptions}
          </select>
        </div>
      </Subregion>
      <Units
        macAvailable={selectedAircraftIndex >= 0 && config.aircraft[selectedAircraftIndex].properties ? (config.aircraft[selectedAircraftIndex].properties.mac != 0 && config.aircraft[selectedAircraftIndex].properties.leadingEdgeMAC != 0) : false}
        config={config}
        setConfig={setConfig} />
      <Subregion>
        <p><b>NOTICE:</b> Balance is an advisory tool for pilots, using this tool does not relieve the pilot of confirming all calculations and using sound pilot judgement. Developers do not take responsibility for any erroneous calculations.</p>
      </Subregion>
    </>
  )
}

export default Setup;
