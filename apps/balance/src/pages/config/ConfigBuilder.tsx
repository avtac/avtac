import './ConfigBuilder.css'
import { MultiPane } from '../../Layout'
import Limitations from './Limitations.tsx'
import Diagram from '../../Diagram'
import Graph from '../../Graph.tsx'
import { useMemo, useState } from 'react'
import { type configT, type aircraftT, type operationConfigT, type nameProps, type aircraftProps, baseLengthUnit, baseWeightUnit, baseFuelUnit, DiagramModes } from '../../Types'
import { SeatConfig } from './Seats.tsx'
import { CargoConfig } from './Cargo.tsx'
import { Equipment } from './Equipment.tsx'
import AircraftConfigs from './Config.tsx'
import AircraftOperationConfig from './BOW.tsx'
import Header from '../../Header.tsx'
import AircraftConfig from './Aircraft.tsx'
import { FuelConfig } from './Fuel.tsx'
import Setup from './Setup.tsx'
import { UnitContext } from '../../UnitsContext.tsx'
import { activeConfigBuilder } from '../../utility.ts'

export function getNewConfig(): configT {
  const config: configT = {
    id: crypto.randomUUID(),
    name: "",
    setup: {
      weightUnits: baseWeightUnit,
      lengthUnits: baseLengthUnit,
      fuelUnits: baseFuelUnit,
      useMAC: false,
      fuelDensity: 6,
    },
    aircraft: [{
      id: crypto.randomUUID(),
      properties: {
        tailNumber: "",
        type: "",
        emptyArm: 35.5,
        emptyWeight: 1550,
        leadingEdgeMAC: 0,
        mac: 0
      },
      seats: [{
        id: crypto.randomUUID(),
        name: "Pilot Seat",
        arm: 37,
        seatCount: 2,
        lateralDist: 0,
        maxWeight: 200
      }, {
        id: crypto.randomUUID(),
        name: "Back Seat",
        arm: 73,
        seatCount: 2,
        lateralDist: 0,
        maxWeight: 200
      }],
      cargoAreas: [{
        arm: 93,
        id: crypto.randomUUID(),
        name: "C 1",
        maxWeight: 75
      }, {
        arm: 123,
        id: crypto.randomUUID(),
        name: "C 2",
        maxWeight: 25
      }, {
        arm: 73,
        id: crypto.randomUUID(),
        name: "C 3",
        maxWeight: 225
      }],
      fuelTanks: [],
      limits: {
        regions: [{
          name: "Normal",
          id: crypto.randomUUID(),
          color: '#D11F1F',
          data: [
            { id: crypto.randomUUID(), arm: 35, weight: 1500 },
            { id: crypto.randomUUID(), arm: 35, weight: 1950 },
            { id: crypto.randomUUID(), arm: 41, weight: 2550 },
            { id: crypto.randomUUID(), arm: 47.5, weight: 2550 },
            { id: crypto.randomUUID(), arm: 47.5, weight: 1500 }
          ]
        },
        {
          name: "Utility",
          id: crypto.randomUUID(),
          color: '#4294FF',
          data: [
            { id: crypto.randomUUID(), arm: 35, weight: 1500 },
            { id: crypto.randomUUID(), arm: 35, weight: 1950 },
            { id: crypto.randomUUID(), arm: 37.5, weight: 2200 },
            { id: crypto.randomUUID(), arm: 40.5, weight: 2200 },
            { id: crypto.randomUUID(), arm: 40.5, weight: 1500 }
          ]
        }

        ],
        limits: []
      },
      equipment: [],
      aircraftConfigs: [{
        id: crypto.randomUUID(),
        name: "Standard",
        seats: [],
        cargoAreas: [],
        equipment: [],
        fuelTanks: []
      }],
      operationConfigs: [{
        id: crypto.randomUUID(),
        config: "",
        name: "Standard",
        seats: [],
        cargoAreas: []
      }]
    }]
  };
  config.aircraft[0].operationConfigs[0].config = config.aircraft[0].aircraftConfigs[0].id;
  return config;
}

function SeatCargoFuelConfig({ aircraft, setAircraft }: aircraftProps & nameProps) {
  return (
    <>
      <SeatConfig aircraft={aircraft} setAircraft={setAircraft} />
      <CargoConfig aircraft={aircraft} setAircraft={setAircraft} />
      <FuelConfig aircraft={aircraft} setAircraft={setAircraft} />
    </>
  )
}

function ConfigBuilder() {
  const defaultValue = getNewConfig();

  let storageConfig: configT = defaultValue;
  const local = localStorage.getItem(activeConfigBuilder);
  if (local != null)
    storageConfig = JSON.parse(local);

  const [config, setConfig] = useState(storageConfig);
  const [selectedAircraft, setSelectedAircraft] = useState(config.aircraft.length > 0 ? config.aircraft[0].id : "")
  const aircraftIndex = config.aircraft.findIndex(a => a.id === selectedAircraft);

  const [selectedConfig, setSelectedConfig] = useState(aircraftIndex >= 0 && config.aircraft[aircraftIndex].aircraftConfigs.length > 0 ? config.aircraft[aircraftIndex].aircraftConfigs[0].id : "");
  const [selectedOpsConfig, setSelectedOpsConfig] = useState(aircraftIndex >= 0 && config.aircraft[aircraftIndex].operationConfigs.length > 0 ? config.aircraft[aircraftIndex].operationConfigs[0].id : "")
  const [selectedPanel, setSelectedPanel] = useState(0);

  useMemo(() => {
    if (config.aircraft.findIndex(a => a.id === selectedAircraft) < 0)
      setSelectedAircraft(config.aircraft[0].id);
    else return;
    if (config.aircraft[0].aircraftConfigs.findIndex(a => a.id === selectedConfig) < 0)
      setSelectedConfig(config.aircraft[0].aircraftConfigs[0].id);
    if (config.aircraft[0].operationConfigs.findIndex(a => a.id === selectedOpsConfig) < 0)
      setSelectedOpsConfig(config.aircraft[0].operationConfigs[0].id);
  }, [config])

  function setSelectedAircraftSpecial(aircraftId: string): void {
    if (aircraftId === selectedAircraft) return;
    setSelectedAircraft(aircraftId);
    const aircraftIndex = config.aircraft.findIndex(a => aircraftId === a.id);
    if (aircraftIndex >= 0 && config.aircraft[aircraftIndex].operationConfigs.length > 0) {
      setSelectedOpsConfig(config.aircraft[aircraftIndex].operationConfigs[0].id);
      setSelectedConfig(config.aircraft[aircraftIndex].operationConfigs[0].config);
    }
  }

  function setConfigSpecial(value: configT): void {
    localStorage.setItem(activeConfigBuilder, JSON.stringify(value));
    setConfig(value);
  }

  function setAircraftSpecial(value: aircraftT): void {
    const tmp: configT = JSON.parse(JSON.stringify(config));
    tmp.aircraft[aircraftIndex] = value;
    localStorage.setItem(activeConfigBuilder, JSON.stringify(tmp));
    setConfig(tmp);
  }

  function setOpsConfig(opsConfigId: string): void {
    setSelectedOpsConfig(opsConfigId);
    const oI = config.aircraft[aircraftIndex].operationConfigs.findIndex((c: operationConfigT) => c.id === opsConfigId);
    if (oI >= 0 && config.aircraft[aircraftIndex].operationConfigs[oI].config != selectedConfig)
      setSelectedConfig(config.aircraft[aircraftIndex].operationConfigs[oI].config);
  }

  useMemo(() => {
    if (selectedPanel === 4) {
      const opsConfigIndex = config.aircraft[aircraftIndex].operationConfigs.findIndex((c: operationConfigT) => c.id === selectedOpsConfig);
      // Set the selected config to the one being used by the ops config
      if (opsConfigIndex >= 0 && config.aircraft[aircraftIndex].operationConfigs[opsConfigIndex].config)
        setSelectedConfig(config.aircraft[aircraftIndex].operationConfigs[opsConfigIndex].config);
    }
  }, [selectedPanel]);

  return (
    <>
      <Header title='Balance Config' />
      <section id="content">
        <UnitContext value={config.setup}>
          <div className='panel' id='leftPanel'>
            <MultiPane selected={selectedPanel} setSelected={setSelectedPanel}>
              <Setup
                name={"Setup"}
                selectedAircraft={selectedAircraft}
                config={config}
                setConfig={setConfigSpecial} />
              <AircraftConfig name={"Aircraft"}
                config={config}
                setConfig={setConfigSpecial}
                selectedAircraft={selectedAircraft}
                setSelectedAircraft={setSelectedAircraftSpecial} />
              <Limitations
                name={"Limitations"}
                aircraft={config.aircraft[aircraftIndex]}
                setAircraft={setAircraftSpecial} />
              <SeatCargoFuelConfig
                name={"Seat/Cargo/Fuel"}
                aircraft={config.aircraft[aircraftIndex]}
                setAircraft={setAircraftSpecial} />
              <Equipment
                name={"Equipment"}
                aircraft={config.aircraft[aircraftIndex]}
                setAircraft={setAircraftSpecial} />
              <AircraftConfigs
                name={"Configs"}
                aircraft={config.aircraft[aircraftIndex]}
                setAircraft={setAircraftSpecial}
                selectedConfig={selectedConfig}
                setSelectedConfig={setSelectedConfig} />
              <AircraftOperationConfig
                name={"Ops Config"}
                aircraft={config.aircraft[aircraftIndex]}
                setAircraft={setAircraftSpecial}
                selectedConfig={selectedConfig}
                setSelectedConfig={setSelectedConfig}
                selectedOpsConfig={selectedOpsConfig}
                setSelectedOpsConfig={setOpsConfig} />
            </MultiPane>
          </div>
          <div id='rightPanel'>
            <div className='panel' id='graphHolder'>
              <Graph
                aircraft={config.aircraft[aircraftIndex]}
                selectedConfig={selectedPanel >= 5 ? selectedConfig : ""}
                selectedOpsConfig={selectedPanel === 6 ? selectedOpsConfig : ""} />
            </div>
            <div className='panel' id='diagramHolder'>
              <Diagram
                aircraft={config.aircraft[aircraftIndex]}
                diagramMode={selectedPanel === 6 ? DiagramModes.Ops : selectedPanel === 5 ? DiagramModes.Config : DiagramModes.All}
                selectedConfig={selectedConfig}
                selectedOpsConfig={selectedOpsConfig} />
            </div>
          </div>
        </UnitContext>
      </section>
    </>
  )
}

export default ConfigBuilder;
