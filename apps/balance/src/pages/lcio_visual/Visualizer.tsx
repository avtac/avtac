// TODO:
// [x] ICONS: Trees, Pole, General, Building, Fence, Road, Train, Vegetation, Lighting, Terrain
// [x] Fix overflow vertical with lots of objects
// [ ] More data fields
// [x] Move select button
// [ ] Make better airport search bar
//
import { type ReactNode, useMemo, useState } from 'react';
import './Visualizer.css'
import { type Controls, type SetControls } from './controls';
import Inputs from './Inputs';
import PlanView from './PlanView';
import { aboveClimbGradient, withinAngle, requiredShortening } from './utilities';
import TextDisplay from './TextDisplay';
import ProfileView from './ProfileView';
import { type objectData, type runwayIdentifier, type VisualizerData } from './types';
import { Region, Subregion } from '../../Layout';

interface DataFieldsProps {
  controls: Controls;
  data: VisualizerData[];
}

function DataFields({ controls, data }: DataFieldsProps): ReactNode {

  let safetyBuffer = 100000;
  for (const row of data) {
    safetyBuffer = Math.round(Math.min(safetyBuffer, Number(row.distance) * controls.climbGradient / 6070 - Number(row.agl) + controls.crossingHeight));
  }

  return (
    <Subregion id="data">
      <div>
        <p>Required Shortening:</p>
        <p>{Math.round(requiredShortening(controls))}ft</p>
        <p>Threshold Crossing:</p>
        <p>{controls.crossingHeight}ft</p>
      </div>
      <div>
        <p>Climb Gradient:</p>
        <p>{controls.climbGradient}ft</p>
        <p>Safety Buffer:</p>
        <p>{safetyBuffer}ft</p>
      </div>
    </Subregion>
  )
}

interface VisualizerProps {
  rwy: runwayIdentifier;
  objects: objectData[];
}
function Visualizer({ rwy, objects }: VisualizerProps): ReactNode {
  // Controls
  const [width, setWidth] = useState(6070);
  const [searchAngle, setSearchAngle] = useState(30);
  const [centerlineOffset, setCenterlineOffset] = useState(75);
  const [climbGradient, setClimbGradient] = useState(200);
  const [elevation, setElevation] = useState(0);
  const [crossingHeight, setCrossingHeight] = useState(0);
  const [runwayOffset, setRunwayOffset] = useState(100);
  const [view, setView] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [data, setData] = useState([] as VisualizerData[]);

  const [refresh, setRefresh] = useState(false);

  const aspect = 3.1;
  let controls: Controls = {
    width: width,
    searchAngle: searchAngle,
    centerlineOffset: centerlineOffset,
    climbGradient: climbGradient,
    elevation: elevation,
    crossingHeight: crossingHeight,
    runwayOffset: runwayOffset,
    view: view,
    showOriginal: showOriginal,

    height: width / aspect,
    aspect: aspect,
    profileScale: 5,
  }

  let setControls: SetControls = {
    width: setWidth,
    searchAngle: setSearchAngle,
    centerlineOffset: setCenterlineOffset,
    climbGradient: setClimbGradient,
    elevation: setElevation,
    crossingHeight: setCrossingHeight,
    runwayOffset: setRunwayOffset,
    view: setView,
    showOriginal: setShowOriginal,
  }

  useMemo(() => {
    const tmp: VisualizerData[] = [];

    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];
      const type: string = object.type.replace(" beginning", "");
      const beginning: boolean = object.type.includes("beginning");
      const distMatch = object.distance.match(/[0-9.]*/);
      const distance: number = Math.round(distMatch ? object.distance.includes("NM") ? Number(distMatch[0]) * 6070 : Number(distMatch[0]) : -1);
      const offsetMatch = object.offset.match(/[0-9]*/);
      const offset = offsetMatch && offsetMatch[0] != '' ? Number(offsetMatch[0]) : 0;
      const offsetDir = object.offset.includes('right') ? 'right' : (object.offset.includes('left') ? 'left' : 'on');
      const heightMatch = object.height.match(/(?:(?<AGL>[0-9]+).\sAGL\/)?(?:(?<MSL>[0-9]+).\sMSL)/);
      const msl = heightMatch ? Number(heightMatch[2]) : -1;
      const aglOriginal = heightMatch && heightMatch[1] ? Number(heightMatch[1]) : null;
      const agl = heightMatch && Math.round(msl - controls.elevation);
      tmp.push({
        type: type,
        beginning: beginning,
        distance: distance,
        offset: offset,
        offsetDir: offsetDir,
        msl: msl,
        aglOriginal: aglOriginal,
        agl: agl,
        danger: false,
        original: object.original,
        runway: rwy,
        selected: false
      } as VisualizerData);
    }

    let sum = 0, i = 0;
    tmp.forEach(row => {
      // Search within 500ft of DER for obstacles that provide AGL to average
      if (row.aglOriginal && row.distance < 500) {
        i += 1;
        sum += row.msl - row.aglOriginal;
      }
    });

    // Provides an estimate to the airfield elevation based on nearby obstacles
    if (i > 1) {
      const average = sum / i;
      setElevation(Math.round(average));
    }
    setData(tmp);
    setRefresh(!refresh);
  }, [objects])

  useMemo(() => {
    const tmp: VisualizerData[] = JSON.parse(JSON.stringify(data));
    tmp.forEach(row => {
      row.agl = Math.round(row.msl - controls.elevation);

      const x = row.distance as number;
      const y = row.offset as number;
      const z = row.agl as number;
      row.danger = withinAngle(controls, x, y) && aboveClimbGradient(controls, x, z);
    })
    setData(tmp);
  }, [refresh, elevation, searchAngle, climbGradient, crossingHeight, centerlineOffset])

  return (
    <div id="visualizer">
      <Region id="left">
        <TextDisplay data={data} setData={setData} controls={controls} />
      </Region>
      <Region id="middle">
        <DataFields data={data} controls={controls} />
        <div id="scrollRegion">
          <Subregion className="graphs">
            {controls.view ? <ProfileView controls={controls} data={data} setData={setData} /> : <PlanView controls={controls} data={data} setData={setData} />}
          </Subregion>
          <Subregion className="graphs">
            {!controls.view ? <ProfileView controls={controls} data={data} setData={setData} /> : <PlanView controls={controls} data={data} setData={setData} />}
          </Subregion>
        </div>
      </Region>
      <Region id='right'>
        <Inputs controls={controls} setControls={setControls} />
      </Region>
    </div>
  );
}

export default Visualizer;
