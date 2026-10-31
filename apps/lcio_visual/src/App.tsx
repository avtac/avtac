import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import './App.css'
import Visualizer from './Visualizer.tsx'
import { type objectData, type runwayIdentifier } from './types.ts'
import { getRunwayNumber } from './utilities.ts';
import { Region } from './Layout.tsx';
import { Header } from '@avtac/ui';

let airports: string[] = [];

function cleanup(text: string) {
  const headerRegex = /\d{2} [A-Z]{3}(?:\n|.)*?(?=[-A-Z\s\/\(\)\.]*, [A-Z]{2})\n/g
  const contRegex = /\n\s?CON’T(?:\n|.)*?\(CON’T\)(?:\n|.)*?\(CON’T\)/g
  const rwyContRegex = /Rwy \d{1,2}[LRC]? \(CON’T\) ?,/g


  text = text.replaceAll(headerRegex, "");
  text = text.replaceAll(contRegex, "");
  text = text.replaceAll(rwyContRegex, "");
  // console.log(text);
  return text;
}

function newVerbiage(airport: string) {
  const regex = /Low, Close-in Obstacles/;
  return regex.test(airport);
}

function getAirports(text: string): string[] {
  text = cleanup(text);
  const regex = /\n(?<SECTION>(?:[-A-Z\s\/\(\)\.’]* \([A-Z0-9]{3,4}\)\n)(?:.|\n)*?(?=(?:\n[-A-Z\s\/\(\)\.’]* \([A-Z0-9]{3,4}\)\n)|$))/g;
  const airports = [...text.matchAll(regex)]
  return airports.map(v => { if (v.groups) return v.groups["SECTION"]; }).filter(v => v !== undefined);
}

// Expects a string of just one airport data from title to end
function getObstacles(airport: string) {
  const regex = /OBSTACLE NOTES:$\n(?<SECTION>(?:.|\n)*)/gm;
  const obstacles = [...airport.matchAll(regex)]
  if (obstacles.length === 0 || obstacles[0].length < 2) return "";
  return obstacles[0][1];
}

// Expects a string of just one airport data from title to end
function getRunways(obstacles: string): string[][] {
  const regex = /(?<RWY>Rwy \d{1,2}[LRC]?) ?,? (?<DATA>(?:.|\n)+?(?=$|Rwy))/g;
  const runways = [...obstacles.matchAll(regex)].map(v => { if (v.groups) return [v.groups["RWY"], v.groups["DATA"]] }).filter(v => v !== undefined);
  return runways;
}

function getObjects(runwayData: string): objectData[] {
  const regex = /^(?<type>.+?)\s+(?<distance>(?:[0-9.]+\s*(?:['‘’]|NM|)|at))\s+(?:from\s+)?DER[,.]\s+(?<offset>[^,]+),\s+(?<height>(?:.|\n)+?)\.\s*$/gm;
  const objects = [...runwayData.matchAll(regex)]
    .map(v => v.groups ? {
      type: v.groups["type"].replace('\n', ''),
      distance: v.groups["distance"].replace('\n', ''),
      offset: v.groups["offset"].replace('\n', ''),
      height: v.groups["height"].replace('\n', ''),
      original: v[0]
    } as objectData : undefined)
    .filter(v => v != undefined);
  return objects;
}

interface AirportSelectOptions {
  text: string;
  selectedAirport: number;
  setSelectedAirport: (arg0: number) => void;
  setSelectedRunway: (arg0: number) => void;
}

function AirportSelect({ text, selectedAirport, setSelectedAirport, setSelectedRunway }: AirportSelectOptions) {
  // Match airport ID;
  const regex = /\((?<FAA_CODE>[0-9A-Z]{3,4})\)$/m;

  const ids = airports.map((a, i) => {
    let search = a.match(regex)
    if (!search) return undefined;

    const obstacles = getObstacles(a)
    const runways = getRunways(obstacles);
    if (runways.length === 0) {
      //console.log("NO RUNWAYS\n", search[1]);
      return undefined
    };

    return [i, search[1]];
  })
    .filter(v => v != undefined)
    .sort((a, b) => (a[1] as string).localeCompare(b[1] as string));

  const options: ReactElement[] = [];
  for (let i = 0; i < ids.length; i++) {
    options.push(<option key={ids[i][1]} value={ids[i][0]}>{ids[i][1]}</option>);
  }

  useEffect(() => {
    if (options.length !== 0) setSelectedAirport(0);
    setSelectedRunway(0);
  }, [text])

  return (<select id='airportSelect' onChange={(e) => { setSelectedAirport(Number(e.target.value)); setSelectedRunway(0) }} value={selectedAirport}>{options}</select>)
}

interface RunwayOptionsProps {
  activeAirport: number
  setSelectedRunway: (arg0: number) => void;
}

function RunwayOptions({ activeAirport, setSelectedRunway }: RunwayOptionsProps): ReactNode {

  function setActive(target: HTMLButtonElement) {
    document.querySelector("button.active")?.classList.remove("active");
    target.classList.add("active");
  }

  const selectedAirport = airports[activeAirport];
  if (selectedAirport == null) return;

  if (newVerbiage(selectedAirport)) return (<div></div>);
  const runwayOptions: ReactElement[] = [];

  const runways = getRunways(getObstacles(selectedAirport));
  for (let i = 0; i < runways.length; i++) {
    const first = i === 0 ? "active" : "";
    const set = (e) => { setActive(e.target); ((v) => setSelectedRunway(v))(i); };
    const runwaySplit = runways[i][0].split(" ");
    runwayOptions.push(<button
      key={runways[i][0]}
      onClick={set}
      className={first}>
      <span className='rwyButtonExtra'>
        {runwaySplit[0] + ' '}
      </span>
      <span>
        {runwaySplit[1]}
      </span>
    </button>);
  }

  return (<div id='runwayButtons'>{runwayOptions}</div>);
}

function App() {
  const [text, setText] = useState("");
  const [objects, setObjects] = useState([] as objectData[]);
  const [selectedAirport, setSelectedAirport] = useState(-1);
  const [selectedRunwayId, setSelectedRunwayId] = useState(0);
  const [selectedRunway, setSelectedRunway] = useState({} as runwayIdentifier);

  useMemo(() => {
    airports = getAirports(text);
  }, [text]);

  useEffect(() => {
    const airport = airports[selectedAirport];
    if (newVerbiage(airport)) {
      // setDisplayText("See original for new verbiage");
      return;
    }

    if (selectedAirport < 0) return;

    const obstacles = getObstacles(airport)
    if (obstacles === undefined) { console.log("NO OBSTACLE"); return };
    const runways = getRunways(obstacles);
    // console.log(airport, obstacles, runways);
    if (runways.length === 0) { console.log("NO RUNWAYS\n", airport, "\n\n", obstacles, "\n\n", runways); return };
    const runway = runways[selectedRunwayId][1];
    if (selectedRunwayId < 0) setObjects([]);

    const objects = getObjects(runway);
    setObjects(objects);
    setSelectedRunway(getRunwayNumber(runways[selectedRunwayId][0]));

  }, [selectedRunwayId, selectedAirport])

  return (
    <>
      <Header title="LCIO Visualizer" />
      <div id='body'>
        <Region id="overview">
          <div id="inputHolder">
            <textarea value={text} onChange={e => setText(e.target.value)} id="input"></textarea>
            <div id="selection">
              <AirportSelect text={text} selectedAirport={selectedAirport} setSelectedAirport={setSelectedAirport} setSelectedRunway={setSelectedRunwayId}></AirportSelect>
              <RunwayOptions activeAirport={selectedAirport} setSelectedRunway={setSelectedRunwayId}></RunwayOptions>
            </div>
          </div>
        </Region>
        <Visualizer rwy={selectedRunway} objects={objects}></Visualizer>
      </div>
    </>
  )
}

export default App
