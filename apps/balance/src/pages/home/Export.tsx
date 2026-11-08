import './Export.css'
import mainStyle from '@avtac/ui/global.css?inline'
import diagramStyle from '../../Diagram.css?inline'
import graphStyle from '../../Graph.css?inline'
import Handlebars from "handlebars"
import { useMemo, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { renderToString } from 'react-dom/server';
import { baseFuelUnit, baseLengthUnit, baseWeightUnit, DiagramModes, type aircraftT, type fuelUnitsT, type lengthUnitsT, type loadingT, type nameProps, type setupT, type weightUnitsT } from "../../Types";
import { calculateBalanceForLanding, calculateBalanceForOperationConfig, calculateBalanceForTakeoff, calculateBalanceForZeroFuel, calculateEmptyBalanceForConfig, calculateMAC, roundNumber, validateAircraft, withinRegion } from '../../utility';
import { convertFuelUnits, convertLengthUnit, convertWeightUnit, UnitContext, unitPrecision } from '../../UnitsContext';
import Graph, { type graphOptionsT } from '../../Graph';
import Diagram from '../../Diagram';
import { Subregion } from '@avtac/ui/Layout';
import dayjs from 'dayjs';

interface templateDescription {
  fileName: string;
  name?: string;
  description?: string;
  primaryUse?: string;
  expectedLimits?: string[]; // List of names of limits that are used
  expectedRegions?: string[]; // List of names of regions that are used
  usesMAC?: boolean;
}

// Available Templates: This is where the template data is stored so clients
// have the information on what is available.
// Add to this list with the appropriate information along with the template
// in the public/templates folder to make more templates available

const availableTemplates: templateDescription[] = [
  {
    fileName: "BasicTemplate.html",
    name: "Basic HTML Template",
    description: "Basic export template written using the html format.",
    primaryUse: "Simple export"
  }
]

interface templateT {
  name?: string;
  size?: ("Letter" | "A4" | "Legal");
  style?: string;
  id?: string;
  inputs?: InputsT[];
  body: string;
}

interface InputsT {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  default?: string | number;
  options?: string[]; // for "select"
}

interface globalsT {
  user: Record<string, string>;
  defaultStyles: string;
  units: setupT;
  graph: (options: graphOptionsT) => ReactNode;
  diagram: string;

  mac: number;
  leadingMAC: number;
  aircraftType: string,
  aircraftTailNumber: string;
  aircraftConfig: string;

  emptyWeight: number;
  emptyArm: number;
  configWeight: number;
  configArm: number;
  opsWeight: number;
  opsArm: number;
  takeoffWeight: number;
  takeoffArm: number;
  landingWeight: number;
  landingArm: number;
  zeroFuelWeight: number;
  zeroFuelArm: number;

  numCrew: number;
  crewWeight: number;
  crewArm: number;
  crewCargoWeight: number,
  crewCargoArm: number;

  numPassengers: number;
  passengerWeight: number;
  passengerArm: number;

  cargoWeight: number;
  cargoArm: number;

  equipmentWeight: number,
  equipmentArm: number;

  totalFuel: number;
  totalFuelWeight: number;
  totalFuelArm: number;
  fuelBurn: number;
  fuelBurnWeight: number;
  landingFuel: number;
  landingFuelWeight: number,
  landingFuelArm: number;

  getMac: (arm: number) => number;
  getSeatPassengers: (id: string) => number;
  getSeatWeight: (id: string) => number;
  getSeatArm: (id: string) => number;
  getCargoWeight: (id: string) => number;
  getCargoArm: (id: string) => number,
  getLimit: (id: string) => number;
  withinRegion: (id: string, weight: number, arm: number) => boolean;
  convertWeight: (weight: number, fromUnit: weightUnitsT) => number;
  convertLength: (length: number, fromUnit: lengthUnitsT) => number;
  convertFuel: (length: number, fromUnit: fuelUnitsT) => number;
}

// Add general style to all templates
const headBase = `
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <style>${mainStyle}</style>
  <style>${graphStyle}</style>
  <style>${diagramStyle}</style>
  <style>
    #diagram #aircraft {
      fill: none !important;
      stroke: black !important;
      stroke-width: .5% !important;
    }
  </style>
`

interface templateBrowserProps {
  setTemplate: (argv: string) => void;
}

function TemplateBrowser({ setTemplate }: templateBrowserProps) {
  const ref: RefObject<null | HTMLDialogElement> = useRef(null);
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  async function addFile() {
    const select = document.getElementById("templateSearchSelect") as HTMLSelectElement;
    if (!select) return;
    const fileName = availableTemplates[Number(select.value)].fileName;
    const resp = await fetch(`templates/${fileName}`);
    const data = await resp.text();
    if (!data) return;
    let newTemplate: templateT = { body: data };
    const t = (newTemplate.body as string).match(/<title>(?<name>.*)<\/title>/);
    newTemplate.name = t?.groups?.name ?? "";

    newTemplate.id = crypto.randomUUID();
    setTemplate(newTemplate.id);
    const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
    const index = templates.findIndex(t => t.id === newTemplate.id);
    if (index < 0) templates.push(newTemplate);
    else templates[index] = newTemplate;
    localStorage.setItem("savedTemplates", JSON.stringify(templates));
    if (ref.current)
      ref.current.close();
  }

  const options = availableTemplates.map(
    (v, i) => (<option key={v.fileName} value={i}>{v.name}</option>)
  )

  return (
    <>
      <button onClick={() => { if (ref.current) ref.current.showModal() }}>Browse Templates</button>
      <dialog
        ref={ref}
        closedby='any'>
        <div id='templateDownloadDialog'>
          <div className='top'>
            <select id='templateSearchSelect' onChange={e => setSelectedTemplate(Number(e.target.value))}>{options}</select>
            <button onClick={addFile}>Get Template</button>
          </div>
          <h4>Description: </h4>
          <p>{
            availableTemplates[selectedTemplate].description
              ? availableTemplates[selectedTemplate].description
              : "None"
          }</p>
          <h4>Primary Use: </h4>
          <p>{
            availableTemplates[selectedTemplate].primaryUse
              ? availableTemplates[selectedTemplate].primaryUse
              : "None"
          }</p>
          <h4>Expected Limits: </h4>
          {
            availableTemplates[selectedTemplate].expectedLimits
              ? <ul>{availableTemplates[selectedTemplate].expectedLimits.map(v => <li key={v}>{v}</li>)}</ul>
              : <p>{"None"}</p>
          }
          <h4>Expected Regions: </h4>
          {
            availableTemplates[selectedTemplate].expectedRegions
              ? <ul>{availableTemplates[selectedTemplate].expectedRegions.map(v => <li key={v}>{v}</li>)}</ul>
              : <p>{"None"}</p>
          }
          <h4>Uses MAC: </h4>
          <p>{
            availableTemplates[selectedTemplate].usesMAC
              ? "Yes"
              : "No"
          }</p>
        </div>
      </dialog>
    </>
  )
}

function extractVariables(source: string): templateT {
  // If using the comment-header approach:
  const match = source.match(/^<!--\s*(\{[\s\S]*?\})\s*-->/m);
  if (!match) return { body: "" }
  const data = JSON.parse(match[1])
  return data;
}

function ExportHeader({ setTemplate, activeTemplate }: { setTemplate: (arg: string) => void, activeTemplate: string }): ReactNode {
  const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
  const options = templates.sort((a, b) => a.name?.localeCompare(b.name ?? "") ?? -1).map(t => <option key={t.id} value={t.id}>{t.name}</option>)

  function openFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ".hbs";
    input.onchange = function(event) {
      const target = event.target as HTMLInputElement;
      if (!target) return;
      const files = target.files;
      if (!files || files.length > 1) return;
      const fileReader = new FileReader();
      fileReader.readAsText(files[0]);
      fileReader.onload = () => {
        const data: string = fileReader.result as string;
        if (!data) return;

        let newTemplate: templateT = extractVariables(data);
        newTemplate.body = data;

        newTemplate.id = crypto.randomUUID();
        setTemplate(newTemplate.id);
        const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
        const index = templates.findIndex(t => t.id === newTemplate.id);
        if (index < 0) templates.push(newTemplate);
        else templates[index] = newTemplate;
        localStorage.setItem("savedTemplates", JSON.stringify(templates));
      };
    };
    input.click();
  }

  const deleteButton = () => {
    const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
    const index = templates.findIndex(t => t.id === activeTemplate);
    if (index >= 0) {
      templates.splice(index, 1);
      setTemplate(templates.length > 0 ? (templates[0].id ?? "") : "");
      localStorage.setItem("savedTemplates", JSON.stringify(templates));
    }
  }

  return (
    <Subregion id='exportTitle'>
      <div>
        <h3>Export</h3>
        <select
          id="templateSelect"
          value={activeTemplate}
          onChange={(e) => {
            setTemplate(e.target.value);
          }}>{options}</select>
      </div>
      <div id='exportButtonHolder'>
        <TemplateBrowser setTemplate={setTemplate} />
        <button
          id="openFile"
          onClick={openFile}>Upload Template</button>
        <button
          id="deleteButton"
          onClick={deleteButton}>Delete Template</button>
      </div>
    </Subregion>
  )
}

function generateScopeData(aircraft: aircraftT, loading: loadingT, selectedOpsConfig: string, units: setupT): (globalsT | undefined) {
  if (validateAircraft(aircraft)) return undefined;
  const opsConfigIndex = aircraft.operationConfigs.findIndex(c => c.id === selectedOpsConfig);
  if (opsConfigIndex < 0) return undefined;
  const configIndex = aircraft.aircraftConfigs.findIndex(c => c.id === aircraft.operationConfigs[opsConfigIndex].config);

  const graph = (options: graphOptionsT) => (<Graph aircraft={aircraft} loading={loading} selectedOpsConfig={selectedOpsConfig} selectedConfig={aircraft.operationConfigs[opsConfigIndex].config} _options={options} />);
  const diagram = (
    <Diagram
      aircraft={aircraft}
      loading={loading}
      setLoading={(_) => { }}
      selectedOpsConfig={selectedOpsConfig}
      selectedConfig={aircraft.operationConfigs[opsConfigIndex].config}
      diagramMode={DiagramModes.Ops} />);


  const mac = convertLengthUnit(aircraft.properties.mac, baseLengthUnit, units.lengthUnits);
  const leadingEdgeMAC = convertLengthUnit(aircraft.properties.leadingEdgeMAC, baseLengthUnit, units.lengthUnits);
  const aircraftType = aircraft.properties.type;
  const aircraftTailNumber = aircraft.properties.tailNumber;
  const aircraftConfig = aircraft.operationConfigs[opsConfigIndex].name;

  const emptyWeight = roundNumber(convertWeightUnit(aircraft.properties.emptyWeight, baseWeightUnit, units.weightUnits), unitPrecision);
  const emptyArm = roundNumber(convertLengthUnit(aircraft.properties.emptyArm, baseLengthUnit, units.lengthUnits), unitPrecision);
  let [configWeight, configArm] = calculateEmptyBalanceForConfig(aircraft, aircraft.operationConfigs[opsConfigIndex].config)
  configWeight = roundNumber(convertWeightUnit(configWeight, baseWeightUnit, units.weightUnits), unitPrecision);
  configArm = roundNumber(convertLengthUnit(configArm, baseLengthUnit, units.lengthUnits), unitPrecision);
  let [opsWeight, opsArm] = calculateBalanceForOperationConfig(aircraft, selectedOpsConfig);
  opsWeight = roundNumber(convertWeightUnit(opsWeight, baseWeightUnit, units.weightUnits), unitPrecision);
  opsArm = roundNumber(convertLengthUnit(opsArm, baseLengthUnit, units.lengthUnits), unitPrecision);
  let [zeroFuelWeight, zeroFuelArm] = calculateBalanceForZeroFuel(aircraft, selectedOpsConfig, loading);
  zeroFuelWeight = roundNumber(convertWeightUnit(zeroFuelWeight, baseWeightUnit, units.weightUnits), unitPrecision);
  zeroFuelArm = roundNumber(convertLengthUnit(zeroFuelArm, baseLengthUnit, units.lengthUnits), unitPrecision);
  let [landingWeight, landingArm] = calculateBalanceForLanding(aircraft, selectedOpsConfig, loading);
  landingWeight = roundNumber(convertWeightUnit(landingWeight, baseWeightUnit, units.weightUnits), unitPrecision);
  landingArm = roundNumber(convertLengthUnit(landingArm, baseLengthUnit, units.lengthUnits), unitPrecision);
  let [takeoffWeight, takeoffArm] = calculateBalanceForTakeoff(aircraft, selectedOpsConfig, loading);
  takeoffWeight = roundNumber(convertWeightUnit(takeoffWeight, baseWeightUnit, units.weightUnits), unitPrecision);
  takeoffArm = roundNumber(convertLengthUnit(takeoffArm, baseLengthUnit, units.lengthUnits), unitPrecision);

  const numCrew = aircraft.operationConfigs[opsConfigIndex].seats.reduce((sum, p) => sum + Math.ceil(p.weight / 200), 0);

  const crewWeight = roundNumber(convertWeightUnit(aircraft.operationConfigs[opsConfigIndex].seats.reduce((sum, p) => sum + p.weight, 0), baseWeightUnit, units.weightUnits), unitPrecision);
  const crewArm = crewWeight === 0 ? 0 : roundNumber(convertLengthUnit(aircraft.operationConfigs[opsConfigIndex].seats.reduce((sum, p) => { const s = aircraft.seats.find(s => s.id === p.id); if (!s) return sum; return sum + (p.weight * s.arm) }, 0) / crewWeight, baseLengthUnit, units.lengthUnits), unitPrecision);

  const crewCargoWeight = roundNumber(convertWeightUnit(aircraft.operationConfigs[opsConfigIndex].cargoAreas.reduce((sum, c) => sum + c.weight, 0), baseWeightUnit, units.weightUnits), unitPrecision);
  const crewCargoArm = crewCargoWeight === 0 ? 0 : roundNumber(convertLengthUnit(aircraft.operationConfigs[opsConfigIndex].cargoAreas.reduce((sum, c) => { const C = aircraft.cargoAreas.find(v => v.id === c.id); if (!C) return sum; return sum + (c.weight * C.arm) }, 0) / crewCargoWeight, baseLengthUnit, baseLengthUnit), unitPrecision);

  const numPassengers = loading.passengers.reduce((sum, p) => sum + p.count, 0);
  const passengerWeight = roundNumber(convertWeightUnit(loading.passengers.reduce((sum, s) => sum + s.avgWeight * s.count, 0), baseWeightUnit, units.weightUnits), unitPrecision);
  const passengerArm = passengerWeight === 0 ? 0 : roundNumber(convertLengthUnit(loading.passengers.reduce((sum, s) => { const S = aircraft.seats.find(v => v.id === s.location); if (!S) return sum; return sum + (s.avgWeight * s.count * S.arm) }, 0) / passengerWeight, baseLengthUnit, units.lengthUnits), unitPrecision);

  const cargoWeight = roundNumber(convertWeightUnit(loading.cargo.reduce((sum, c) => sum + c.weight, 0), baseWeightUnit, units.weightUnits), unitPrecision);
  const cargoArm = cargoWeight === 0 ? 0 : roundNumber(convertLengthUnit(loading.cargo.reduce((sum, c) => { const area = aircraft.cargoAreas.find(C => C.id === c.location); if (!area) return sum; return sum + (c.weight * area?.arm) }, 0) / cargoWeight, baseLengthUnit, units.lengthUnits), unitPrecision);

  const equipmentWeight = roundNumber(convertWeightUnit(aircraft.aircraftConfigs[configIndex].equipment.reduce((sum, e) => { const equip = aircraft.equipment.find(E => E.id === e.id); if (!equip) return sum; return sum + e.count * equip.weight }, 0), baseWeightUnit, units.weightUnits), unitPrecision);
  const equipmentArm = equipmentWeight === 0 ? 0 : roundNumber(convertLengthUnit(aircraft.aircraftConfigs[configIndex].equipment.reduce((sum, e) => { const equip = aircraft.equipment.find(E => E.id === e.id); if (!equip) return sum; return sum + e.count * equip.weight * equip.arm }, 0) / equipmentWeight, baseLengthUnit, units.lengthUnits), unitPrecision);

  const totalFuel = roundNumber(convertFuelUnits(loading.fuel.reduce((sum, f) => sum + f.loadedFuel, 0), baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision);
  const totalFuelWeight = roundNumber(convertFuelUnits(totalFuel, units.fuelUnits, units.weightUnits, units.fuelDensity), unitPrecision);
  const totalFuelArm = totalFuelWeight === 0 ? 0 : roundNumber(convertFuelUnits(loading.fuel.reduce((sum, f) => { const t = aircraft.fuelTanks.find(v => v.id === f.tank); if (!t) return sum; return sum + (t.arm * f.loadedFuel) }, 0), units.fuelUnits, units.weightUnits, units.fuelDensity) / totalFuelWeight, unitPrecision);
  const fuelBurn = roundNumber(convertFuelUnits(loading.fuel.reduce((sum, f) => sum + f.tripFuel, 0), baseFuelUnit, units.fuelUnits, units.fuelDensity), unitPrecision);
  const fuelBurnWeight = roundNumber(convertFuelUnits(fuelBurn, units.fuelUnits, units.weightUnits, units.fuelDensity), unitPrecision);
  const landingFuel = totalFuel - fuelBurn;
  const landingFuelWeight = roundNumber(convertFuelUnits(landingFuel, units.fuelUnits, units.weightUnits, units.fuelDensity), unitPrecision);
  const landingFuelArm = landingFuelWeight === 0 ? 0 : roundNumber(convertFuelUnits(loading.fuel.reduce((sum, f) => { const t = aircraft.fuelTanks.find(v => v.id === f.tank); if (!t) return sum; return sum + (t.arm * f.loadedFuel) }, 0), units.fuelUnits, units.weightUnits, units.fuelDensity) / landingFuelWeight, unitPrecision);

  const getMac = (arm: number) => roundNumber(calculateMAC(convertLengthUnit(arm, units.lengthUnits, baseLengthUnit), aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, true), unitPrecision);

  const getSeatPassengers = (seatName: string) => {
    const seat = aircraft.seats.find(s => s.name === seatName)
    if (!seat) return -1;
    const pax = loading.passengers.find(p => p.location === seat.id)
    return (pax ? pax.count : 0);
  }

  const getSeatWeight = (seatName: string) => {
    const seat = aircraft.seats.find(s => s.name === seatName)
    if (!seat) return -1;
    const pax = loading.passengers.find(p => p.location === seat.id)
    const crew = aircraft.operationConfigs[opsConfigIndex].seats.find(p => p.id === seat.id);
    return (pax ? pax.avgWeight * pax.count : 0) + (crew ? crew.weight : 0);
  }

  const getSeatArm = (seatName: string) => {
    const seat = aircraft.seats.find(s => s.name === seatName)
    if (!seat) return -1;
    return seat.arm;
  }

  const getCargoWeight = (cargoAreaName: string) => {
    const cargoArea = aircraft.cargoAreas.find(c => c.name === cargoAreaName)
    if (!cargoArea) return -1;
    const cargo = loading.cargo.find(c => c.location === cargoArea.id)
    const opsCargo = aircraft.operationConfigs[opsConfigIndex].cargoAreas.find(p => p.id === cargoArea.id);
    return (cargo ? cargo.weight : 0) + (opsCargo ? opsCargo.weight : 0);
  }

  const getCargoArm = (cargoAreaName: string) => {
    const cargoArea = aircraft.cargoAreas.find(c => c.name === cargoAreaName)
    if (!cargoArea) return -1;
    return cargoArea.arm;
  }

  const getLimit = (limitName: string) => {
    const limit = aircraft.limits.limits.find(l => l.name === limitName);
    return limit && limit.weight ? convertWeightUnit(limit.weight, baseWeightUnit, units.weightUnits) : 0;
  }

  // Expects units to be units.weightUnits and units.lengthUnits
  const withinRegionL = (regionName: string, weight: number, arm: number) => {
    const region = aircraft.limits.regions.find((r) => r.name === regionName);
    if (!region) return false;
    return withinRegion(region, convertWeightUnit(weight, units.weightUnits, baseWeightUnit), convertLengthUnit(arm, units.lengthUnits, baseLengthUnit));
  }

  const convertWeight = (weight: number, fromUnit: weightUnitsT) => convertWeightUnit(weight, fromUnit, units.weightUnits);
  const convertLength = (length: number, fromUnit: lengthUnitsT) => convertLengthUnit(length, fromUnit, units.lengthUnits);
  const convertFuel = (fuel: number, fromUnit: fuelUnitsT) => convertFuelUnits(fuel, fromUnit, units.fuelUnits, units.fuelDensity);

  const globalData: globalsT = {
    user: {},
    defaultStyles: headBase,
    units: units,
    graph: graph,
    diagram: renderToString(diagram),

    mac: mac,
    leadingMAC: leadingEdgeMAC,
    aircraftType: aircraftType,
    aircraftTailNumber: aircraftTailNumber,
    aircraftConfig: aircraftConfig,

    emptyWeight: emptyWeight,
    emptyArm: emptyArm,
    configWeight: configWeight,
    configArm: configArm,
    opsWeight: opsWeight,
    opsArm: opsArm,
    takeoffWeight: takeoffWeight,
    takeoffArm: takeoffArm,
    landingWeight: landingWeight,
    landingArm: landingArm,
    zeroFuelWeight: zeroFuelWeight,
    zeroFuelArm: zeroFuelArm,

    numCrew: numCrew,
    crewWeight: crewWeight,
    crewArm: crewArm,
    crewCargoWeight: crewCargoWeight,
    crewCargoArm: crewCargoArm,

    numPassengers: numPassengers,
    passengerWeight: passengerWeight,
    passengerArm: passengerArm,

    cargoWeight: cargoWeight,
    cargoArm: cargoArm,

    equipmentWeight: equipmentWeight,
    equipmentArm: equipmentArm,

    totalFuel: totalFuel,
    totalFuelWeight: totalFuelWeight,
    totalFuelArm: totalFuelArm,
    fuelBurn: fuelBurn,
    fuelBurnWeight: fuelBurnWeight,
    landingFuel: landingFuel,
    landingFuelWeight: landingFuelWeight,
    landingFuelArm: landingFuelArm,

    getMac: getMac,
    getSeatPassengers: getSeatPassengers,
    getSeatWeight: getSeatWeight,
    getSeatArm: getSeatArm,
    getCargoWeight: getCargoWeight,
    getCargoArm: getCargoArm,
    getLimit: getLimit,
    withinRegion: withinRegionL,
    convertWeight: convertWeight,
    convertLength: convertLength,
    convertFuel: convertFuel
  }

  return globalData;
}

function generateTemplate(globalData: globalsT, template: templateT): string {
  const T = Handlebars.compile(template.body);

  Handlebars.registerHelper("math", (a: number, opr: string, b: number): number => {
    var values: Record<string, number> = {
      "+": a + b,
      "-": a - b,
      "*": a * b,
      "/": b !== 0 ? a / b : 0
    }
    return values[opr] ?? 0;
  });
  Handlebars.registerHelper("min", (a: number, b: number) => a < b ? a : b);
  Handlebars.registerHelper("max", (a: number, b: number) => a > b ? a : b);
  Handlebars.registerHelper("graph", (options: graphOptionsT) => renderToString(globalData.graph(options)));
  Handlebars.registerHelper("date", (format: string) => dayjs().format(format));
  Handlebars.registerHelper("round", (n: number, precision: number) => roundNumber(n, precision));
  Handlebars.registerHelper("getMac", (arm: number) => globalData.getMac(arm));
  Handlebars.registerHelper("getSeatPassengers", (name: string) => globalData.getSeatPassengers(name));
  Handlebars.registerHelper("getSeatWeight", (name: string) => globalData.getSeatWeight(name));
  Handlebars.registerHelper("getSeatArm", (name: string) => globalData.getSeatArm(name));
  Handlebars.registerHelper("getCargoWeight", (name: string) => globalData.getCargoWeight(name));
  Handlebars.registerHelper("getCargoArm", (name: string) => globalData.getCargoArm(name));
  Handlebars.registerHelper("getLimit", (name: string) => globalData.getLimit(name));
  Handlebars.registerHelper("withinRegionL", (name: string, weight: number, arm: number) => globalData.withinRegion(name, weight, arm));
  Handlebars.registerHelper("convertWeight", (weight: number, unit: weightUnitsT) => globalData.convertWeight(weight, unit));
  Handlebars.registerHelper("convertLength", (length: number, unit: lengthUnitsT) => globalData.convertLength(length, unit));
  Handlebars.registerHelper("convertFuel", (fuel: number, unit: fuelUnitsT) => globalData.convertFuel(fuel, unit));
  return T(globalData);
}

function ManualInputs({ activeTemplate, setUserValues }: { activeTemplate: string, setUserValues: (arg0: string, arg1: string) => void }): ReactNode {
  const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
  const temp = templates.find(f => f.id === activeTemplate);
  if (!temp || !temp.inputs) return <></>
  let inputs = temp.inputs;

  if (inputs.length === 0) return <></>;
  return (
    <Subregion>
      <details>
        <summary>Manual Entries</summary>
        <div id='inputsHolder'>
          {inputs.map(input => [
            <div key={input.name + "-manual-input-holder"}>
              <label
                style={{ paddingRight: "4px" }}
                htmlFor={input.name + "-manual-input"}>{input.label}</label>
              {input.type === "select" ?
                <select
                  className="manualInput"
                  id={input.name + "-manual-input"}
                  onChange={(e) => setUserValues(input.name, e.target.value)} >
                  {input.options?.map(o => <option value={o}>{o}</option>)})
                </select>
                :
                <input
                  className="manualInput"
                  id={input.name + "-manual-input"}
                  type={input.type}
                  placeholder={input.label}
                  onChange={(e) => setUserValues(input.name, e.target.value)} />
              }
            </div>
          ])}
        </div>
      </details>
    </Subregion>
  )
}

function CustomIframe({ ...props }) {
  const [contentRef, setContentRef] = useState(null as (HTMLIFrameElement | null));

  const saveIframe = () => {
    if (!contentRef || !contentRef.contentWindow) return;
    contentRef.contentWindow.focus();
    contentRef.contentWindow.print();
  };

  function fitToContainer() {
    const parent = document.getElementById("iframeHolder");
    const container = document.getElementById("scaleHolder");
    const content = document.getElementById("exportPreview");
    if (!parent || !container || !content) return;

    const containerWidth = container.clientWidth;
    const contentWidth = content.clientWidth;

    // Calculate scale factor based on height
    const scale = Math.min(containerWidth / contentWidth, 1);

    // Apply transform to fit height
    content.style.transform = scale === 1 ? "" : `scale(${scale})`;
    content.style.transformOrigin = scale === 1 ? "" : 'top left';

    const size = content.getBoundingClientRect();
    container.style.height = size.height + "px";
  }

  useEffect(() => {
    window.addEventListener("resize", fitToContainer);
    fitToContainer();
  }, [])

  return (
    <>
      <Subregion id="iframeButton">
        <button
          id="exportButton"
          onClick={() => saveIframe()}>Export Form</button>
      </Subregion>
      <Subregion id="iframeHolder">
        <div id="scaleHolder">
          <iframe {...props} ref={setContentRef}></iframe>
        </div>
      </Subregion>
    </>
  )
}


interface exportProps {
  loading: loadingT;
  aircraft: aircraftT;
  selectedOpsConfig: string;
}

export function Export({ loading, aircraft, selectedOpsConfig }: exportProps & nameProps): ReactNode {
  const units = useContext(UnitContext);
  const ref: RefObject<(null | HTMLIFrameElement)> = useRef(null);
  const globalData = useRef(generateScopeData(aircraft, loading, selectedOpsConfig, units));
  const active: string = localStorage.getItem("activeTemplate") ?? "";
  const [activeTemplate, setTemplate] = useState(active);
  const [userValues, setUserValues] = useState<Record<string, string>>({});
  const [iframeString, setIframeString] = useState("");
  if (validateAircraft(aircraft)) return (<h2 style={{ margin: " 20px auto" }}>Invalid Config</h2>);

  function setTemplateSpecial(tempId: string) {
    localStorage.setItem("activeTemplate", tempId);
    setTemplate(tempId);
  }

  function setUserValuesSpecial(name: string, value: string) {
    const tmp = JSON.parse(JSON.stringify(userValues));
    tmp[name] = value;
    setUserValues(tmp);
    console.log(tmp, name, value);
  }

  useMemo(() => {
    const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
    const temp = templates.find(f => f.id === activeTemplate);
    if (!temp) return;

    globalData.current = generateScopeData(aircraft, loading, selectedOpsConfig, units);
    if (!globalData.current) return;
    globalData.current.user = userValues;
    setIframeString(generateTemplate(globalData.current, temp));
  }, [activeTemplate, loading, userValues]);

  return (
    <>
      <ExportHeader setTemplate={setTemplateSpecial} activeTemplate={activeTemplate} />

      <ManualInputs activeTemplate={activeTemplate} setUserValues={setUserValuesSpecial} />

      <CustomIframe
        ref={ref}
        id="exportPreview"
        srcDoc={iframeString}
      />
    </>
  );
}
