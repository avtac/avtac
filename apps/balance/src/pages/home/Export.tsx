import './Export.css'
import mainStyle from '@avtac/ui/global.css?inline'
import diagramStyle from '../../Diagram.css?inline'
import graphStyle from '../../Graph.css?inline'
import Handlebars from "handlebars"
import { useMemo, useContext, useEffect, useRef, useState, type ReactNode, type RefObject, useTransition } from "react";
import { renderToString } from 'react-dom/server';
import { baseFuelUnit, baseLengthUnit, baseWeightUnit, DiagramModes, type aircraftT, type fuelUnitsT, type lengthUnitsT, type loadingT, type nameProps, type setupT, type weightUnitsT } from "../../Types";
import { calculateBalanceForLanding, calculateBalanceForOperationConfig, calculateBalanceForTakeoff, calculateBalanceForZeroFuel, calculateEmptyBalanceForConfig, calculateMAC, roundNumber, validateAircraft, withinRegion } from '../../utility';
import { convertFuelUnits, convertLengthUnit, convertWeightUnit, UnitContext, unitPrecision } from '../../UnitsContext';
import Graph, { type graphOptionsT } from '../../Graph';
import Diagram from '../../Diagram';
import { Subregion } from '@avtac/ui/Layout';
import dayjs from 'dayjs';

declare module 'react' {
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    command?: 'toggle-popover' | 'show-popover' | 'hide-popover' | 'show-modal' | 'close' | 'request-close' | (string & {});
    commandfor?: string;
  }
}

interface templateInputPropertiesT {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  default?: string | number;
  options?: string[]; // for "select"
}

interface templatePropertiesT {
  fileName: string;
  name: string;
  description: string;
  size: ("Letter" | "A4" | "Legal");
  inputs: templateInputPropertiesT[];
  uses: string;
  limits: string[]; // List of names of limits that are used
  regions: string[]; // List of names of regions that are used
}

const defaultProperties: templatePropertiesT = {
  fileName: "",
  name: "",
  description: "",
  size: "Letter",
  uses: "",
  inputs: [],
  limits: [],
  regions: []
}

interface templateT {
  id?: string;
  data: fileDatabaseDataT;
  body: string;
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

interface fileDatabaseListT {
  data: fileDatabaseDataT[];
  maxOffset: number;
  pageSize: number;
}

function defaultFileDatabaseList(): fileDatabaseListT {
  return { data: [], maxOffset: 0, pageSize: 0 }
}

interface fileDatabaseDataT {
  name: string;
  id: number;
  uuid: string;
  version: number;
  downloads: number;
  likes: number;
  dateCreated: number;
  properties: templatePropertiesT;
}

const defaultDatabaseData: fileDatabaseDataT = {
  name: "",
  id: -1,
  uuid: "",
  version: -1,
  downloads: -1,
  likes: -1,
  dateCreated: -1,
  properties: defaultProperties,
}

function createDatabaseData(options?: Partial<fileDatabaseDataT>): fileDatabaseDataT {
  return {
    ...defaultDatabaseData,
    ...options,
  };
}

async function addFile(setTemplate: (arv0: string) => void, fileInfo: fileDatabaseDataT) {
  function downloadRequest(id: number): Promise<string> {
    return fetch(`http://10.0.1.140/api/files/${id}/content`).then(resp => resp.text())
  }

  const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");

  // Determine if the file has already been downloaded
  const index = templates.findIndex(t => t.data.id === fileInfo.id);
  if (index < 0) {
    const fileString = await downloadRequest(fileInfo.id)

    let newTemplate: templateT = extractVariables(fileString);
    newTemplate.data = fileInfo;
    if (newTemplate.data.name == "") return;
    newTemplate.id = crypto.randomUUID(); // Client unique id for every template

    templates.push(newTemplate);
    setTemplate(newTemplate.id);
    localStorage.setItem("savedTemplates", JSON.stringify(templates));
  } else {
    // TODO: Should this be done if there is an update
    // templates[index] = newTemplate;
    templates[index].id && setTemplate(templates[index].id);
  }
}

function detailsRequest(id: number): Promise<any> {
  // Check local storage first before making the request
  // Determine if the file has already been downloaded
  const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
  const index = templates.findIndex(t => t.data.id === id);
  if (index < 0)
    // Expects a json of fileDatabaseDataT
    return fetch(`http://10.0.1.140/api/files/${id}`)
      .then(resp => resp.json());
  else {
    return new Promise((resolve) => {
      resolve(templates[index].data);
    })
  }
}

function likeRequest(id: number): Promise<Response> {
  return fetch(`http://10.0.1.140/api/files/${id}/like`, {
    method: 'PATCH'
  })
}

async function getListRequest(offset: number): Promise<any> {
  // TODO: Limit request rate
  const resp = await fetch(`http://10.0.1.140/api/files?offset=${offset}&count=5`);
  const json = await resp.json();
  return json;
}

interface TemplateDetailsProps {
  closeDetails: () => void;
  setTemplate: (argv: string) => void, templateId: number;
  ref: RefObject<(null | HTMLDialogElement)>;
}

function TemplateDetails({ closeDetails, setTemplate, templateId, ref }: TemplateDetailsProps): ReactNode {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(undefined as (fileDatabaseDataT | undefined));

  useEffect(() => {
    if (templateId < 0) {
      setData(defaultDatabaseData);
      return;
    }
    if (!isDownloaded(templateId))
      startTransition(async () => {
        const d = await detailsRequest(templateId);
        setData(createDatabaseData(d));
      })
    else {
      const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
      const index = templates.findIndex(t => t.data.id === templateId);
      setData(templates[index].data);
    }
  }, [templateId]);

  return (
    <dialog
      ref={ref}
      className="templateDetails"
      closedby='any'
      onCancel={closeDetails}>
      {templateId > 0 && isPending && <div>Loading...</div>}
      {templateId > 0 && !isPending && data &&
        <>
          <h3>{data.properties.name}</h3>
          {data.properties.description !== "" && <p className='description'>{data.properties.description}</p>}
          {data.dateCreated > 0 && <p>Last Updated: {dayjs(data.dateCreated).format("MM/DD/YYYY HH:MM:ss")}</p>}
          {data.version >= 0 && <p>Version: {data.version}</p>}
          {data.properties.inputs && data.properties.inputs.length > 0 &&
            <div>
              <h4>Inputs</h4>
              {data.properties.inputs.map(v => {
                return (<>
                  <p style={{ paddingLeft: "1rem" }}>{v.label}: {v.type} {v.options && v.options.join(", ")}</p>
                </>)
              })}
            </div>
          }
          {data.properties.limits && data.properties.limits.length > 0 &&
            <div>
              <h4>Limits</h4>
              {data.properties.limits.map(v => <p style={{ paddingLeft: "1rem" }}>{v}</p>)}
            </div>
          }
          {data.properties.regions && data.properties.regions.length > 0 &&
            <div>
              <h4>Regions</h4>
              {data.properties.regions.map(v => <p style={{ paddingLeft: "1rem" }}>{v}</p>)}
            </div>
          }
          <div className='buttons'>
            <button onClick={() => { addFile(setTemplate, data); closeDetails(); }}>Get</button>
            <button onClick={() => { likeRequest(templateId); }}>Like</button>
          </div>
        </>
      }
    </dialog>
  )
}

interface templateBrowserProps {
  setTemplate: (argv: string) => void;
}

function isDownloaded(id: number): boolean {
  const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
  const found = templates.some(t => t.data.id === id);
  return found;
}

// State
// -1: not downloaded
// >=0: version
function newestVersion(uuid: string): number {
  const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
  const found = templates.some(t => t.data.uuid === uuid);
  if (!found) return -1;
  const newest = templates.reduce((m, t) => t.data.uuid === uuid ? Math.max(t.data.version, m) : m, 0);
  return newest;
}

function TemplateBrowser({ setTemplate }: templateBrowserProps) {
  const dialogRef: RefObject<null | HTMLDialogElement> = useRef(null);
  const isMounted = useRef(false);
  const [isPending, startTransition] = useTransition()
  const [databaseData, setDatabaseData] = useState(defaultFileDatabaseList());
  const [offset, setOffset] = useState(0);
  const [showDetails, setShowDetails] = useState(-1)

  const totalPages = databaseData.pageSize != 0 ? Math.floor(databaseData.maxOffset / databaseData.pageSize) + 1 : 1;
  function nextPage() {
    const newOffset = Math.min(offset + databaseData.pageSize, Math.max((totalPages - 1) * databaseData.pageSize, 0));
    if (newOffset === offset) return;
    setOffset(newOffset);
  }

  function prevPage() {
    const newOffset = Math.max(offset - databaseData.pageSize, 0);
    if (newOffset === offset) return;
    setOffset(newOffset);
  }

  function getListData() {
    startTransition(async () => {
      try {
        const d: fileDatabaseListT = await getListRequest(offset);
        setDatabaseData(d);
      } catch (err) {
        setDatabaseData({ maxOffset: databaseData.maxOffset, pageSize: databaseData.pageSize, data: [] });
      }
    })
  };

  useEffect(() => {
    if (isMounted.current) getListData();
    else isMounted.current = true;
  }, [offset]);

  function handleDetails(id: number) {
    setShowDetails(id);
    if (id >= 0)
      dialogRef.current?.showModal();
    else
      dialogRef.current?.close();
  }

  const blocks = databaseData.data ? databaseData.data.map(v => {
    const foundVersion = newestVersion(v.uuid);
    const downloaded = foundVersion > 0;
    const newest = foundVersion === v.version;
    return (
      <Subregion className={'exportStoreEntry' + (downloaded ? ' downloaded' : '')} onClick={() => handleDetails(v.id)} >
        <div>
          <h5>Name{downloaded && ": Saved"}{downloaded && !newest && " v" + foundVersion}</h5>
          <p>{v.name} v{v.version}</p>
        </div>
        <div className='counts'>
          <h5>Downloads</h5>
          <p>{v.downloads}</p>
          <h5>Likes</h5>
          <p>{v.likes}</p>
        </div>
      </Subregion>
    )
  }) : <></>;

  // TODO: Cache a few template details to reduce requests
  return (
    <>
      <dialog
        id='templateDownload'
        closedby='any'>
        <div id='templateDownloadDialog'>
          <div id='templateDownloadDialogTop'>
            <button onClick={getListData}>Refresh</button>
          </div>
          <div id='templateDownloadDialogMiddle'>
            {isPending && <h3>Loading data...</h3>}
            {!isPending && blocks}
          </div>
          <div id='templateDownloadDialogBottom'>
            <button disabled={offset === 0} onClick={prevPage}>&lt;-</button>
            <span>{offset / databaseData.pageSize + 1} / {totalPages}</span>
            <button disabled={offset / databaseData.pageSize >= totalPages - 1} onClick={nextPage}>-&gt;</button>
          </div>
        </div>
      </dialog>
      <TemplateDetails ref={dialogRef} closeDetails={() => handleDetails(-1)} templateId={showDetails} setTemplate={setTemplate} />
    </>
  )
}

function extractVariables(source: string): templateT {
  // If using the comment-header approach:
  const match = source.match(/^<!--\s*(\{[\s\S]*?\})\s*-->/m);
  if (!match) return { body: "", data: createDatabaseData() };
  const props = JSON.parse(match[1]);
  const template: templateT = { body: source, data: createDatabaseData({ properties: props }) };
  console.log(template);
  return template;
}

function ExportHeader({ setTemplate, activeTemplate }: { setTemplate: (arg: string) => void, activeTemplate: string }): ReactNode {
  const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
  const options = templates
    .sort((a, b) => a.data.uuid?.localeCompare(b.data.uuid ?? "") ?? -1)
    .map(t => {
      const duplicated = templates.some(v => v.data.uuid === t.data.uuid && v.data.id !== t.data.id);
      return <option key={t.id} value={t.id}>{t.data.properties.name}{duplicated && ` v${t.data.version}`}</option>
    });
  const [showDialog, setShowDialog] = useState(false);

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
        {showDialog && <TemplateBrowser setTemplate={setTemplate} />}
        <button onClick={() => { setShowDialog(true) }} command="show-modal" commandfor="templateDownload">Browse Templates</button>
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
    return (pax ? pax.avgWeight * pax.count : 0);
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

Handlebars.registerHelper("math", (a: number, opr: string, b: number): number => {
  var values: Record<string, number> = {
    "+": a + b,
    "-": a - b,
    "*": a * b,
    "/": b !== 0 ? a / b : 0
  }
  return values[opr] ?? 0;
});
Handlebars.registerHelper("let", function(name: string, value: any, options: any) {
  options.data.root[name] = value;
  return options.fn(options.data.root);
});
Handlebars.registerHelper("object", function({ hash }) {
  return hash;
});
Handlebars.registerHelper("min", (a: number, b: number) => a < b ? a : b);
Handlebars.registerHelper("max", (a: number, b: number) => a > b ? a : b);
Handlebars.registerHelper("equal", (a: number, b: number) => a === b);
Handlebars.registerHelper("lessThan", (a: number, b: number) => a < b);
Handlebars.registerHelper("greaterThan", (a: number, b: number) => a > b);
Handlebars.registerHelper("lessThanEqual", (a: number, b: number) => a <= b);
Handlebars.registerHelper("greaterThanEqual", (a: number, b: number) => a >= b);
function generateTemplate(globalData: globalsT, template: templateT): string {
  const T = Handlebars.compile(template.body);

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
  if (!temp || !temp.data.properties.inputs) return <></>
  let inputs = temp.data.properties.inputs;

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
