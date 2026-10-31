import './Balance.css'
import { MultiPane } from '../../Layout'
import Diagram from '../../Diagram'
import Graph from '../../Graph.tsx'
import { useMemo, useState, type ReactNode } from 'react'
import { type configT, DiagramModes, type aircraftT, type aircraftConfigT, type loadingT, type operationConfigT } from '../../Types'
import Header from '../../Header.tsx'
import Setup from './Setup.tsx'
import { UnitContext } from '../../UnitsContext.tsx'
import Config from './Config.tsx'
import { activeConfigData, uploadedConfigs } from '../../utility.ts'
import Loading from './Loading.tsx'
import { Export } from './Export.tsx'

const defaultLoading: loadingT = {
  fuel: [],
  passengers: [],
  cargo: [],
}

function checkConfigChanged(activeConfig: configT) {
  const configsStrings = localStorage.getItem(uploadedConfigs);
  if (!configsStrings) return false;
  const configs: { [key: string]: configT } = JSON.parse(configsStrings);
  if (!Object.keys(configs).includes(activeConfig.id)) return false
  const baseConfig = configs[activeConfig.id]

  // Equipment is not checked
  type searchSubset = keyof Pick<aircraftConfigT, "seats" | "cargoAreas" | "fuelTanks">
  const searchItems: searchSubset[] = ['seats', 'cargoAreas', 'fuelTanks'];
  for (let i = 0; i < baseConfig.aircraft.length; i++) {
    for (let j = 0; j < baseConfig.aircraft[i].aircraftConfigs.length; j++) {
      for (const item of searchItems) {
        const base = baseConfig.aircraft[i].aircraftConfigs[j][item];
        const active = activeConfig.aircraft[i].aircraftConfigs[j][item];
        if (base.length !== active.length) return true;
        for (let k = 0; k < base.length; k++) {
          if (!active.includes(base[k])) return true;
          if (!base.includes(active[k])) return true;
        }
      }
    }
  }
  return false;
}

interface warningProps {
  display: boolean;
  text: string;
}

function Warning({ display, text }: warningProps): ReactNode {
  const [displaying, setDisplaying] = useState(display);

  return (
    <>
      {display &&
        <div
          id="changeWarning"
          className={displaying ? "" : "hide"}
          onClick={() => setDisplaying(false)}>
          <p>{text}</p>
        </div>
      }
    </>
  )
}

function Balance() {
  const defaultValue = {} as configT;

  let storageConfig: configT = defaultValue;
  const local = localStorage.getItem(activeConfigData);
  if (local != null)
    storageConfig = JSON.parse(local);
  else {
    const saved = localStorage.getItem(uploadedConfigs);
    if (saved) {
      let data: configT[] = Object.values(JSON.parse(saved));
      if (data.length > 0)
        storageConfig = data[0];
      localStorage.setItem(activeConfigData, JSON.stringify(storageConfig));
    }
  }

  const [config, setConfig] = useState(storageConfig);
  const [selectedAircraft, setSelectedAircraft] = useState(config.aircraft && config.aircraft.length > 0 ? config.aircraft[0].id : "")
  const aircraftIndex = config.aircraft && config.aircraft.findIndex(a => a.id === selectedAircraft);

  const [selectedOpsConfig, setSelectedOpsConfig] = useState(aircraftIndex >= 0 && config.aircraft[aircraftIndex].operationConfigs.length > 0 ? config.aircraft[aircraftIndex].operationConfigs[0].id : "")
  const [selectedConfig, setSelectedConfig] = useState(aircraftIndex >= 0 && config.aircraft[aircraftIndex].operationConfigs.length > 0 ? config.aircraft[aircraftIndex].operationConfigs[0].config : "");
  const [selectedPanel, setSelectedPanel] = useState(0);

  const [loadingData, setLoadingData] = useState(defaultLoading);

  useMemo(() => {
    if (config.aircraft && config.aircraft.findIndex(a => a.id === selectedAircraft) < 0)
      setSelectedAircraftSpecial(config.aircraft[0].id);
    else return;
  }, [config])

  function setSelectedAircraftSpecial(aircraftId: string): void {
    if (aircraftId === selectedAircraft) return;
    setSelectedAircraft(aircraftId);

    const selectedAircraftIndex = config.aircraft.findIndex(a => a.id === aircraftId);
    if (selectedAircraftIndex < 0) return;
    const aircraft = config.aircraft[selectedAircraftIndex];

    setSelectedOpsConfig(aircraft.operationConfigs.length > 0 ? aircraft.operationConfigs[0].id : "");
    setSelectedConfig(aircraft.aircraftConfigs.length > 0 ? aircraft.operationConfigs[0].config : "");
  }

  function setSelectedOpsConfigSpecial(opsConfigId: string): void {
    if (opsConfigId === selectedOpsConfig) return;
    const selectedAircraftIndex = config.aircraft.findIndex(a => a.id === selectedAircraft);
    if (selectedAircraftIndex < 0) return;

    const aircraft = config.aircraft[selectedAircraftIndex];
    const selectedOpsConfigIndex = aircraft.operationConfigs.findIndex(o => o.id === opsConfigId);
    if (selectedOpsConfigIndex < 0) return;

    setSelectedOpsConfig(opsConfigId);
    setSelectedConfig(aircraft.operationConfigs[selectedOpsConfigIndex].config);
  }

  function setConfigSpecial(value: configT): void {
    localStorage.setItem(activeConfigData, JSON.stringify(value));
    setConfig(value);
  }

  function setAircraftSpecial(value: aircraftT): void {
    const tmp: configT = JSON.parse(JSON.stringify(config));
    tmp.aircraft[aircraftIndex] = value;
    localStorage.setItem(activeConfigData, JSON.stringify(tmp));
    setConfig(tmp);
  }

  useMemo(() => {
    if (selectedPanel === 4) {
      const opsConfigIndex = config.aircraft[aircraftIndex].operationConfigs.findIndex((c: operationConfigT) => c.id === selectedOpsConfig);
      // Set the selected config to the one being used by the ops config
      if (opsConfigIndex >= 0 && config.aircraft[aircraftIndex].operationConfigs[opsConfigIndex].config)
        setSelectedConfig(config.aircraft[aircraftIndex].operationConfigs[opsConfigIndex].config);
    }
  }, [selectedPanel]);

  useMemo(() => {
    setLoadingData(defaultLoading);
  }, [selectedOpsConfig])

  const changed = checkConfigChanged(config)
  return (
    <>
      <Header title="Balance" />
      <Warning text={"Config has changed and does not match original"} display={changed} />
      <section id="content">
        <UnitContext value={config.setup}>
          <div className='panel' id='leftPanel'>
            <MultiPane selected={selectedPanel} setSelected={setSelectedPanel}>
              <Setup
                name={"Setup"}
                config={config}
                setConfig={setConfigSpecial}
                selectedAircraft={selectedAircraft}
                setSelectedAircraft={setSelectedAircraftSpecial}
                selectedOpsConfig={selectedOpsConfig}
                setSelectedOpsConfig={setSelectedOpsConfigSpecial} />
              <Config
                name={"Config"}
                aircraft={config.aircraft && config.aircraft[aircraftIndex]}
                setAircraft={setAircraftSpecial}
                loading={loadingData}
                setLoading={setLoadingData}
                selectedOpsConfig={selectedOpsConfig} />
              <Loading
                name={"Loading"}
                loading={loadingData}
                setLoading={setLoadingData}
                aircraft={config.aircraft && config.aircraft[aircraftIndex]}
                selectedOpsConfig={selectedOpsConfig} />
              <Export
                name={"Export"}
                loading={loadingData}
                aircraft={config.aircraft && config.aircraft[aircraftIndex]}
                selectedOpsConfig={selectedOpsConfig} />
            </MultiPane>
          </div>
          <div id='rightPanel'>
            <div className='panel' id='graphHolder'>
              <Graph
                aircraft={config.aircraft && config.aircraft[aircraftIndex]}
                loading={loadingData}
                selectedConfig={selectedConfig}
                selectedOpsConfig={selectedOpsConfig} />
            </div>
            <div className='panel' id='diagramHolder'>
              <Diagram
                aircraft={config.aircraft && config.aircraft[aircraftIndex]}
                loading={loadingData}
                setLoading={setLoadingData}
                diagramMode={selectedPanel >= 0 ? DiagramModes.Ops : DiagramModes.All}
                selectedConfig={selectedConfig}
                selectedOpsConfig={selectedOpsConfig} />
            </div>
          </div>
        </UnitContext>
      </section>
    </>
  )
}

export default Balance;
