import { Fragment, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import './Graph.css'
import { type aircraftLimitsT, type cargoAreaT, type aircraftT, type momentObjectT, type regionPointT, type regionT, type seatT, type weightLimitT, type setupT, baseLengthUnit, baseWeightUnit, type loadingT } from './Types';
import { calculateBalanceForLanding, calculateBalanceForOperationConfig, calculateBalanceForTakeoff, calculateBalancePointsForTanks, calculateEmptyBalanceForConfig, calculateMAC, calculateMaxBalanceForConfig, roundNumber, truncateNumber, validateAircraft } from './utility';
import { convertLengthUnit, convertWeightUnit, UnitContext } from './UnitsContext';

let width = 140;
let height = 90;
let padding = 12;
let graphInsetPadding = 5;

interface limitsT {
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  xRatio: number,
  yRatio: number
}

function calculatePointX(limits: limitsT, arm: number): number {
  return (arm - limits.minX) * limits.xRatio + padding + graphInsetPadding;
}

function reverseCalculateX(limits: limitsT, x: number): number {
  return (x - padding - graphInsetPadding) / limits.xRatio + limits.minX;
}

function calculatePointY(limits: limitsT, weight: number): number {
  return height - (weight - limits.minY) * limits.yRatio - padding - graphInsetPadding;
}
function reverseCalculateY(limits: limitsT, y: number): number {
  return -(y + padding + graphInsetPadding - height) / limits.yRatio + limits.minY;
}

function calculateArm(weight1: number, arm1: number, weight2: number, arm2: number): number {
  return (arm1 * weight1 + arm2 * weight2) / (weight1 + weight2);
}

interface cleanLimitsT {
  id: string;
  name: string;
  color: string;
  lineStyle: string;
  weight: number;
}

function cleanLimits(limits: weightLimitT[], graphLimits: limitsT): cleanLimitsT[][] {
  const ret: cleanLimitsT[][] = [];
  for (const i in limits) {
    let limit = limits[i];
    if (!limit.weight) continue;

    // Same number
    let groupIndex = ret.findIndex(v => v.some(v => v.weight === (limit.weight ?? 0)));
    if (groupIndex >= 0) {
      const index = ret[groupIndex].findIndex(v => v.weight === (limit.weight ?? 0));
      if (groupIndex >= 0 || index >= 0) {
        ret[groupIndex][index].name += ';' + limit.name;
        ret[groupIndex][index].color += ';' + limit.color;
      }
      continue;
    }

    // Close number
    groupIndex = ret.findIndex(v => v.some(w => Math.abs((limit.weight ?? 0) - w.weight) < (limit.name.split(";").length + v.reduce((sum, V) => sum + V.name.split(";").length, 0)) / graphLimits.yRatio * 4.0));
    if (groupIndex >= 0) {
      ret[groupIndex].push({
        id: limit.id,
        name: limit.name,
        weight: limit.weight,
        color: limit.color ?? 'white',
        lineStyle: limit.lineStyle ?? 'Solid'
      });
      continue;
    }

    ret.push([{
      id: limit.id,
      name: limit.name,
      weight: limit.weight,
      color: limit.color ?? "#fff",
      lineStyle: limit.lineStyle ?? "Solid"
    }]);
  }

  ret.forEach(v => v.sort((a, b) => b.weight - a.weight));
  return ret;
}

function generateConfigArea(aircraft: aircraftT, limits: limitsT, selectedConfig: string, units: setupT): string[] {
  const selectedConfigIndex: number = aircraft.aircraftConfigs.findIndex(v => v.id === selectedConfig);
  if (selectedConfigIndex < 0) return [];

  const [configEmptyWeight, configEmptyArm] = calculateEmptyBalanceForConfig(aircraft, selectedConfig);

  // Create list of used seats and cargoAreas from smallest to largest arm
  let positions: momentObjectT[] = [];

  const pointData: momentObjectT[] = [];
  aircraft.aircraftConfigs[selectedConfigIndex].seats.map((s: string) => {
    const seat = aircraft.seats.find((S: seatT) => S.id == s);
    if (!seat) return;
    pointData.push({ weight: seat.maxWeight * seat.seatCount, arm: seat.arm });
  })
    .filter(s => s != undefined)

  aircraft.aircraftConfigs[selectedConfigIndex].cargoAreas.map((c: string) => {
    const cargoArea = aircraft.cargoAreas.find((C: cargoAreaT) => C.id == c);
    if (!cargoArea) return;
    pointData.push({ weight: cargoArea.maxWeight, arm: cargoArea.arm });
  })
    .filter(s => s != undefined)

  aircraft.fuelTanks.map(
    (fuelTank) => {
      const usedTank = !fuelTank.removable || aircraft.aircraftConfigs[selectedConfigIndex].fuelTanks.includes(fuelTank.id);
      if (!usedTank) return;
      pointData.push({ weight: fuelTank.maxWeight, arm: fuelTank.arm });
    })
    .filter(s => s != undefined);

  // Generate bottom
  pointData.sort((a, b) => a.arm - b.arm);

  let totalWeight = configEmptyWeight;
  let totalArm = configEmptyArm;
  pointData.map((s: { weight: number, arm: number }) => {
    totalArm = calculateArm(totalWeight, totalArm, s.weight, s.arm);
    totalWeight += s.weight;
    positions.push({ weight: totalWeight, arm: totalArm })
  });

  let x = units.useMAC ? calculateMAC(configEmptyArm, aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, units.useMAC) : convertLengthUnit(configEmptyArm, baseLengthUnit, units.lengthUnits);
  x = calculatePointX(limits, x);
  let y = calculatePointY(limits, convertWeightUnit(configEmptyWeight, baseWeightUnit, units.weightUnits));
  const points: string[] = [`${x},${y}`];

  for (let i = 0; i < positions.length; i++) {
    x = units.useMAC ? calculateMAC(positions[i].arm, aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, units.useMAC) : convertLengthUnit(positions[i].arm, baseLengthUnit, units.lengthUnits);
    x = calculatePointX(limits, x);
    y = calculatePointY(limits, convertWeightUnit(positions[i].weight, baseWeightUnit, units.weightUnits));
    points.push(`${x},${y}`);
  }

  // Generate Top
  pointData.sort((a, b) => b.arm - a.arm);

  positions = [];
  totalWeight = configEmptyWeight;
  totalArm = configEmptyArm;

  pointData.map((s: { weight: number, arm: number }) => {
    totalArm = calculateArm(totalWeight, totalArm, s.weight, s.arm);
    totalWeight += s.weight;
    positions.push({ weight: totalWeight, arm: totalArm })
  });

  for (let i = positions.length - 1; i >= 0; i--) {
    x = units.useMAC ? calculateMAC(positions[i].arm, aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, units.useMAC) : convertLengthUnit(positions[i].arm, baseLengthUnit, units.lengthUnits);
    x = calculatePointX(limits, x);
    y = calculatePointY(limits, convertWeightUnit(positions[i].weight, baseWeightUnit, units.weightUnits));
    points.push(`${x},${y}`);
  }

  points.push(points[0]);
  return points;
}

interface plotAreaProps {
  width: number,
  height: number
}

function PlotArea({ width, height }: plotAreaProps): ReactNode {
  return (
    <rect
      className='background'
      width={width - padding * 2}
      height={height - padding * 2}
      x={padding}
      y={padding}
    />
  );
}

interface plotLimitProps {
  data: cleanLimitsT[],
  limits: limitsT
  options: graphOptionsT;
}

function PlotLimit({ data, limits, options }: plotLimitProps): ReactNode {
  let x1 = padding;
  let x2 = width - padding;
  let avgY = calculatePointY(limits, data.reduce((sum, v) => sum + v.weight, 0) / data.length);

  const charSize = 2.7;
  const gapSize = 1.1;
  const spacing = 1.5;

  // top position - (space used by spacing, number label and gap - space used by all names) / 2
  let topY = avgY - ((data.length - 1) * (spacing + charSize + gapSize) + (data.reduce((sum, v) => sum + v.name.split(";").length, 0)) * charSize) / 2;
  return (
    <>
      {data.map(v => {
        let y = calculatePointY(limits, v.weight);
        let points = `${x1},${y} ${x2},${y}`;
        return (
          <polyline
            points={points}
            stroke={v.color.split(";")[0]}
            strokeDasharray={v.lineStyle}
            strokeWidth='.3' />
        )
      })}
      {options.limitsLabels && data.map((v, i) => {
        if (i > 0)
          topY += data[i - 1].name.split(";").length * charSize + charSize + gapSize + spacing;
        // FIX assumption that previous names are 1 length
        return (
          <>
            <text
              x={x2 + 1}
              y={topY}
              alignmentBaseline={v.name != "" ? 'after-edge' : 'middle'}
              fill={v.color.split(";")[0] ?? 'white'}>
              {roundNumber(v.weight, 1)}
            </text>
            {v.name.split(';').map((name: string, j: number) => {
              return <text
                key={"weight" + i + "TEXT" + j}
                x={x2 + 1}
                y={topY + (j + 1) * charSize + gapSize}
                alignmentBaseline='after-edge'
                fill={v.color.split(';')[j]}>
                {name}
              </text>
            })}
          </>
        )
      })}
    </>
  );
}

interface plotRegionProps {
  data: regionT,
  limits: limitsT
  options: graphOptionsT;
}

function PlotRegion({ data, limits, options }: plotRegionProps): ReactNode {
  const withEnd = [...data.data, data.data[0]];
  let points = withEnd.map((point: regionPointT) => {
    let x = calculatePointX(limits, point.arm);
    let y = calculatePointY(limits, point.weight);
    return [x, y];
  })
  let pointsString = points.map((p: number[]) => `${p[0]},${p[1]}`).join(' ');
  let middleX = (
    Math.max(...points.map((p: number[]) => p[0]))
    + Math.min(...points.map((p: number[]) => p[0]))
  ) / 2;
  let middleY = (
    Math.max(...points.map((p: number[]) => p[1]))
    + Math.min(...points.map((p: number[]) => p[1]))
  ) / 2;

  return (
    <>
      <polyline
        className='region'
        points={pointsString}
        stroke={data.color ?? 'black'}
        strokeDasharray={data.lineStyle ?? ''}
        strokeWidth='.3'
        fill={options.regionShading ? ((data.color ?? 'black') + "33") : "none"} />
      {options.regionNames && <text
        x={middleX}
        y={middleY}
        fill={data.color}
        textAnchor='middle'
        alignmentBaseline='middle'>
        {data.name}
      </text>}
    </>
  );
}

interface plotRegionsProps {
  aircraft: aircraftLimitsT,
  aircraftLimits: cleanLimitsT[][],
  limits: limitsT
  options: graphOptionsT;
}

function PlotRegions({ aircraft, aircraftLimits, limits, options }: plotRegionsProps): ReactNode {
  return (
    <>
      {aircraft.regions.map((region: regionT) => <PlotRegion key={region.id} data={region} limits={limits} options={options} />)}
      {aircraftLimits.map((limit: cleanLimitsT[]) => <PlotLimit key={limit[0].id} data={limit} limits={limits} options={options} />)}
    </>
  );
}

const precision = 10000;

interface plotGridProps {
  limits: limitsT,
  gridSpacing: number,
  units: string
}

function PlotHorizontalGrid({ limits, gridSpacing, units }: plotGridProps): ReactNode {
  const gapBetweenGrid = gridSpacing * limits.xRatio;
  const smallestGridValue = Math.ceil((limits.minX - graphInsetPadding / limits.xRatio) / gridSpacing) * gridSpacing;
  const largestGridValue = Math.floor((limits.maxX + graphInsetPadding / limits.xRatio) / gridSpacing) * gridSpacing;
  const smallestGridPosition = calculatePointX(limits, smallestGridValue);
  const largestGridPosition = calculatePointX(limits, largestGridValue);
  const numGrid = Math.ceil(truncateNumber((largestGridPosition - smallestGridPosition) / gapBetweenGrid, precision)) + 1;
  if (!numGrid) return;
  const startValue = truncateNumber(smallestGridValue, precision);
  let positions: { pos: number, value: string }[] = Array(numGrid).fill(0).map((_, index) => {
    return {
      pos: gapBetweenGrid * index + smallestGridPosition,
      value: truncateNumber(startValue + index * gridSpacing, 1000) + units
    }
  });
  const longestString = positions.reduce((max, a) => Math.max(max, a.value.toString().length), 0);

  return (
    <>
      {positions.map((x, i) => (
        <Fragment key={i}>
          <polyline
            className={"gridLines"}
            points={`${x.pos},${padding} ${x.pos},${height - padding}`}
            strokeWidth='.2'
            strokeDasharray={".5"} />
          <text
            className={"gridLines"}
            x={x.pos}
            y={height - padding / 2}
            transform={`rotate(${longestString >= gapBetweenGrid / 2.5 ? 45 : 0}, ${x.pos}, ${height - padding / 2})`}
            textAnchor='middle'
            alignmentBaseline='after-edge'>
            {x.value}
          </text>
        </Fragment >
      ))};
    </>
  );
}

function PlotVerticalGrid({ limits, gridSpacing, units }: plotGridProps): ReactNode {
  const gapBetweenGrid = gridSpacing * limits.yRatio;
  const smallestGridValue = Math.ceil((limits.minY - graphInsetPadding / limits.yRatio) / gridSpacing) * gridSpacing;
  const largestGridValue = Math.floor((limits.maxY + graphInsetPadding / limits.yRatio) / gridSpacing) * gridSpacing;
  const smallestGridPosition = calculatePointY(limits, largestGridValue);
  const largestGridPosition = calculatePointY(limits, smallestGridValue);
  const numGrid = Math.ceil(truncateNumber((largestGridPosition - smallestGridPosition) / gapBetweenGrid, precision)) + 1;
  if (!numGrid) return;
  const startValue = truncateNumber(smallestGridValue, precision);
  let positions: { pos: number, value: string }[] = Array(numGrid).fill(0).map((_, index) => {
    return {
      pos: largestGridPosition - gapBetweenGrid * index,
      value: truncateNumber(startValue + index * gridSpacing, 1000) + units
    }
  });
  return (
    <>
      {positions.map((y, i) =>
      (
        <Fragment key={i}>
          <polyline
            className='gridLines'
            points={`${padding},${y.pos} ${width - padding},${y.pos}`}
            strokeWidth='.2'
            strokeDasharray={".5"} />)
          <text
            className='gridLines'
            x={10.5}
            y={y.pos}
            textAnchor='end'
            alignmentBaseline='middle'>
            {y.value}
          </text>
        </Fragment>
      )
      )};
    </>
  );
}

interface plotTitleProps {
  title: string
}

function PlotTitle({ title }: plotTitleProps): ReactNode {
  return (
    <text
      className='title'
      x={width / 2}
      y={4}
      fill='white'
      textAnchor='middle'
      alignmentBaseline='middle'>
      {title}
    </text>
  )
}

interface plotPointT {
  weight: number,
  arm: number,
  style: string,
  size: number,
  label?: string
}

interface plotPointProps {
  aircraft: aircraftT;
  pointFunction: (arg0: aircraftT) => plotPointT;
  limits: limitsT
}

function PlotPoint({ aircraft, pointFunction, limits }: plotPointProps): ReactNode {
  const units = useContext(UnitContext);
  const [highlight, setHighlight] = useState(false);
  const point = pointFunction(aircraft);
  const x = calculatePointX(limits, point.arm)
  const y = calculatePointY(limits, point.weight)

  function onClick() {
    setHighlight(!highlight);
  }

  let shape = <circle
    onClick={onClick}
    className={'point' + (highlight ? ' highlight' : "")}
    cx={x}
    cy={y}
    r={point.size}
    fill='#59C' />

  if (point.style == 'square') {
    shape = <rect
      onClick={onClick}
      className={'point' + (highlight ? ' highlight' : "")}
      x={x - point.size / 2}
      y={y - point.size / 2}
      width={point.size}
      height={point.size}
      fill='#59C' />;
  }

  return (
    <>
      {shape}
      {highlight && point.label != undefined &&
        <>
          <text
            onClick={onClick}
            className='point'
            x={x}
            y={y + point.size / 2 + 1.2}
            dominantBaseline='hanging'
            textAnchor='middle'>
            {point.label}
          </text>
          <text
            onClick={onClick}
            className='point'
            x={x}
            y={y + point.size / 2 + 4.2}
            dominantBaseline='hanging'
            textAnchor='middle'>
            {roundNumber(reverseCalculateX(limits, x), 100)}{units.useMAC ? "%" : units.lengthUnits}, {Math.round(reverseCalculateY(limits, y))}{units.weightUnits}
          </text>
        </>
      }
    </>
  );
}

export interface graphOptionsT {
  title?: boolean;
  background?: boolean;
  regionShading?: boolean;
  regionNames?: boolean;
  limitsLabels?: boolean;
  emptyPoint?: boolean;
  configPoint?: boolean;
  opsPoint?: boolean;
  landingPoint?: boolean;
  takeoffPoint?: boolean;
  maxConfigPoint?: boolean;
  configRegion?: boolean;
}

interface graphProps {
  aircraft: aircraftT;
  loading?: loadingT;
  selectedConfig: string;
  selectedOpsConfig: string;
  _options?: graphOptionsT;
}

interface lineProps {
  weight1: number;
  arm1: number;
  weight2: number;
  arm2: number;
  color: string;
  style?: string;
}


function Graph({ aircraft, loading, selectedConfig, selectedOpsConfig, _options }: graphProps): ReactNode {
  const options: graphOptionsT = {
    title: true,
    background: true,
    regionShading: true,
    regionNames: true,
    limitsLabels: true,
    emptyPoint: true,
    configPoint: true,
    opsPoint: true,
    landingPoint: true,
    takeoffPoint: true,
    maxConfigPoint: false,
    configRegion: false
  }

  if (_options !== undefined)
    Object.entries(options).forEach(([key, _]) => {
      if (Object.hasOwn(_options, key)) {
        const typedKey = key as keyof graphOptionsT;
        options[typedKey] = _options[typedKey];
      }
    });

  const units = useContext(UnitContext);
  const configAreaPoints = useRef("");

  let limits: limitsT = {
    minX: 0,
    maxX: 1,
    minY: 0,
    maxY: 1,
    xRatio: 1,
    yRatio: 1
  };

  useMemo(() => {
    if (!validateAircraft(aircraft) && selectedConfig)
      configAreaPoints.current = generateConfigArea(aircraft, limits, selectedConfig, units).join(" ");
  }, [aircraft, selectedConfig, limits]);

  const [mousePos, setMousePos] = useState({ x: -1, y: -1 });
  const [mouseIn, setMouseIn] = useState(false);
  const [showCoords, setShowCoords] = useState(false);
  const ref: RefObject<(SVGSVGElement | null)> = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    let timerId: number;

    const handleKey = () => {
      timerId = setTimeout(() => {
        setShowCoords(!showCoords);
      }, 500); // 500ms threshold
    };
    ref.current.addEventListener('touchstart', handleKey, { passive: true });

    const clearID = () => clearTimeout(timerId);
    ref.current.addEventListener('touchend', clearID);
    return () => {
      document.removeEventListener('touchstart', handleKey);
      document.removeEventListener('touchend', clearID);
    }
  }, [ref, showCoords]);

  if (validateAircraft(aircraft)) return;

  let data: aircraftLimitsT = JSON.parse(JSON.stringify(aircraft.limits));

  // Ensure that the arm is in MAC or distance units
  data.regions = [...data.regions.map(a => {
    const newData = a.data.map(d => ({ ...d, weight: convertWeightUnit(d.weight, baseWeightUnit, units.weightUnits), arm: units.useMAC ? calculateMAC(d.arm, aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, units.useMAC) : convertLengthUnit(d.arm, baseLengthUnit, units.lengthUnits) }));
    return { ...a, data: newData };
  })];

  data.limits = [...data.limits.map(a => {
    return { ...a, weight: convertWeightUnit(a.weight ?? 0, baseWeightUnit, units.weightUnits) }
  })];

  // Add any desired points to graph
  const points: { name: string, func: (arg0: aircraftT) => plotPointT }[] = []
  // Add any desired lines to graph
  const lines: lineProps[] = []

  if (options.emptyPoint)
    points.push({
      name: "emptyWeight", func: (aircraft: aircraftT): plotPointT => ({
        weight: convertWeightUnit(aircraft.properties.emptyWeight, baseWeightUnit, units.weightUnits),
        arm: units.useMAC ? calculateMAC(aircraft.properties.emptyArm, aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, units.useMAC) : convertLengthUnit(aircraft.properties.emptyArm, baseLengthUnit, units.lengthUnits),
        style: 'circle',
        size: 1,
        label: "Empty Aircraft"
      })
    });

  if (selectedConfig) {
    if (options.configPoint)
      points.push({
        name: "emptyConfig", func: (aircraft: aircraftT): plotPointT => {
          const [weight, arm] = calculateEmptyBalanceForConfig(aircraft, selectedConfig);
          return {
            weight: convertWeightUnit(weight, baseWeightUnit, units.weightUnits),
            arm: units.useMAC ? calculateMAC(arm, aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, units.useMAC) : convertLengthUnit(arm, baseLengthUnit, units.lengthUnits),
            style: 'circle',
            size: 1,
            label: "Empty Config"
          }
        }
      });
    if (options.maxConfigPoint)
      points.push({
        name: "maxPoint", func: (aircraft: aircraftT): plotPointT => {
          const [weightFull, armFull] = calculateMaxBalanceForConfig(aircraft, selectedConfig);
          return {
            weight: convertWeightUnit(weightFull, baseWeightUnit, units.weightUnits),
            arm: units.useMAC ? calculateMAC(armFull, aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, units.useMAC) : convertLengthUnit(armFull, baseLengthUnit, units.lengthUnits),
            style: 'circle',
            size: 1,
            label: "Max Config"
          }
        }
      });
  }

  if (selectedOpsConfig) {
    if (options.opsPoint)
      points.push({
        name: "opsConfig", func: (aircraft: aircraftT): plotPointT => {
          const [weight, arm] = calculateBalanceForOperationConfig(aircraft, selectedOpsConfig);
          return {
            weight: convertWeightUnit(weight, baseWeightUnit, units.weightUnits),
            arm: units.useMAC ? calculateMAC(arm, aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, units.useMAC) : convertLengthUnit(arm, baseLengthUnit, units.lengthUnits),
            style: 'circle',
            size: 1,
            label: "Ops Config"
          }
        }
      });
    if (loading) {
      const fuelTankPoints = calculateBalancePointsForTanks(aircraft, selectedOpsConfig, loading);

      let lastWeight, lastArm;
      ({ weight: lastWeight, arm: lastArm } = fuelTankPoints[0]);
      lastWeight = convertWeightUnit(lastWeight, baseWeightUnit, units.weightUnits);
      lastArm = units.useMAC ? calculateMAC(lastArm, aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, units.useMAC) : convertLengthUnit(lastArm, baseLengthUnit, units.lengthUnits);

      for (let i = 1; i < fuelTankPoints.length; i++) {
        let currentWeight, currentArm;
        ({ weight: currentWeight, arm: currentArm } = fuelTankPoints[i]);
        currentWeight = convertWeightUnit(currentWeight, baseWeightUnit, units.weightUnits);
        currentArm = units.useMAC ? calculateMAC(currentArm, aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, units.useMAC) : convertLengthUnit(currentArm, baseLengthUnit, units.lengthUnits);
        lines.push({
          weight1: lastWeight,
          arm1: lastArm,
          weight2: currentWeight,
          arm2: currentArm,
          color: 'red'
        })
        lastWeight = currentWeight;
        lastArm = currentArm;
      }
    }
  }

  if (loading) {
    if (options.landingPoint)
      points.push({
        name: "land", func: (aircraft: aircraftT): plotPointT => {
          let [weight, arm] = calculateBalanceForLanding(aircraft, selectedOpsConfig, loading);
          return {
            weight: convertWeightUnit(weight, baseWeightUnit, units.weightUnits),
            arm: units.useMAC ? calculateMAC(arm, aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, units.useMAC) : convertLengthUnit(arm, baseLengthUnit, units.lengthUnits),
            style: 'square',
            size: 2,
            label: "Land"
          }
        }
      });

    if (options.takeoffPoint)
      points.push({
        name: "takeoff", func: (aircraft: aircraftT): plotPointT => {
          let [weight, arm] = calculateBalanceForTakeoff(aircraft, selectedOpsConfig, loading);
          return {
            weight: convertWeightUnit(weight, baseWeightUnit, units.weightUnits),
            arm: units.useMAC ? calculateMAC(arm, aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, units.useMAC) : convertLengthUnit(arm, baseLengthUnit, units.lengthUnits),
            style: 'square',
            size: 2,
            label: "Takeoff"
          }
        }
      });
  }

  // Calculate graph bounding box

  let minX: number = NaN;
  let maxX: number = NaN;
  let minY: number = NaN;
  let maxY: number = NaN;

  if (data.regions.length > 0) {
    minX = Math.min(...data.regions.map((r: regionT) => Math.min(...r.data.filter((v: regionPointT) => v.arm !== null).map(p => p.arm))));
    maxX = Math.max(...data.regions.map((r: regionT) => Math.max(...r.data.filter((v: regionPointT) => v.arm !== null).map(p => p.arm))));
    minY = Math.min(...data.regions.map((r: regionT) => Math.min(...r.data.filter((v: regionPointT) => v.weight !== null).map(p => p.weight))));
    maxY = Math.max(...data.regions.map((r: regionT) => Math.max(...r.data.filter((v: regionPointT) => v.weight !== null).map(p => p.weight))));
  }

  if (data.limits.length > 0) {
    maxY = Math.max(...data.limits.map((lim: weightLimitT) => lim.weight).filter((v: (number | undefined)) => v !== undefined), maxY) ?? maxY;
    minY = Math.min(...data.limits.map((lim: weightLimitT) => lim.weight).filter((v: (number | undefined)) => v !== undefined), minY) ?? minY;
  }

  if (points.length > 0) {
    const tmpPoints = points
      .map((lim) => lim.func(aircraft))
      .filter((v) => v.arm !== null && v.weight !== null);
    maxX = Math.max(...tmpPoints.map(p => p.arm), maxX) ?? maxX;
    minX = Math.min(...tmpPoints.map(p => p.arm), minX) ?? minX;
    maxY = Math.max(...tmpPoints.map(p => p.weight), maxY) ?? maxY;
    minY = Math.min(...tmpPoints.map(p => p.weight), minY) ?? minY;
  }

  limits = {
    minX: minX,
    maxX: maxX,
    minY: minY,
    maxY: maxY,
    xRatio: (width - graphInsetPadding * 2 - padding * 2) / (maxX - minX),
    yRatio: (height - graphInsetPadding * 2 - padding * 2) / (maxY - minY)
  };

  // Convert interval to spacing of 1, 2, or 5 * 10^x
  function getCleanInterval(width: number, desiredTicks: number): number {
    const desiredInterval = (width / desiredTicks);
    const power = Math.ceil(Math.log10(desiredInterval))
    const spacing = desiredInterval / Math.pow(10, power - 1);
    const number = (spacing < 5 ? (spacing < 2 ? 1 : 2) : 5) * Math.pow(10, power - 1);
    return number;
  }

  // Unit spacing for grid lines
  const desiredTicks = 10;
  const horSpacing = getCleanInterval(maxX - minX, desiredTicks);
  const verSpacing = getCleanInterval(maxY - minY, desiredTicks * height / width);

  // Gird base components
  const title = <PlotTitle title={`Weight (${units.weightUnits}) vs Arm (${units.useMAC ? "% MAC" : units.lengthUnits})`} />;
  const horizontalBars = <PlotHorizontalGrid
    limits={limits}
    gridSpacing={horSpacing}
    units={units.useMAC && (aircraft.properties.mac && aircraft.properties.leadingEdgeMAC) ? "%" : ""} />;
  const verticalBars = <PlotVerticalGrid
    limits={limits}
    gridSpacing={verSpacing}
    units='' />;

  const dataAvailable = isFinite(limits.xRatio) && isFinite(limits.yRatio);

  // lines
  const lineComponents = lines.map((l, i) => {
    return <line
      key={[l.arm1, l.weight2, i].join(" ")}
      x1={calculatePointX(limits, l.arm1)}
      y1={calculatePointY(limits, l.weight1)}
      x2={calculatePointX(limits, l.arm2)}
      y2={calculatePointY(limits, l.weight2)}
      stroke={l.color}
      strokeWidth={.3}
      strokeDasharray={l.style}
    />
  })

  // points
  const pointComponents = points.map(p => {
    return <PlotPoint
      key={p.name}
      aircraft={aircraft}
      pointFunction={p.func}
      limits={limits}
    />
  })

  const cleanLimit: cleanLimitsT[][] = cleanLimits(data.limits, limits);

  function setMouse(e: React.MouseEvent<SVGSVGElement, globalThis.MouseEvent>) {
    const graph = document.getElementById("graph");
    if (!graph) return;
    const box = graph.getBoundingClientRect();
    const mousePos = { x: (e.pageX - box.x) * width / box.width, y: (e.pageY - box.y) * height / box.height }
    setMouseIn(mousePos.x > padding && mousePos.x < width - padding && mousePos.y > padding && mousePos.y < height - padding);
    setMousePos(mousePos);
  }

  const mouseText = () => {
    const string = roundNumber(reverseCalculateX(limits, mousePos.x), 100) + (units.useMAC ? "%" : units.lengthUnits) + ", " + Math.round(reverseCalculateY(limits, mousePos.y)) + units.weightUnits;
    return (
      <>
        <rect
          x={mousePos.x + 1}
          y={mousePos.y - 2 - 2}
          fill='grey'
          stroke='white'
          rx={.3}
          strokeWidth={.2}
          width={string.length * .1 + 0.08 + "rem"}
          height={4} />
        <text
          x={mousePos.x + 2}
          y={mousePos.y - 2}
          dominantBaseline='central'
          fill='white'>
          {string}
        </text>
      </>
    )
  }

  function handleMouse(e: React.MouseEvent<SVGSVGElement, globalThis.MouseEvent>) {
    if (e.button === 2) {
      setShowCoords(!showCoords);
    }
  }

  return (
    <svg
      ref={ref}
      onContextMenu={(e) => e.preventDefault()}
      onPointerUp={e => handleMouse(e)}
      onMouseMove={e => setMouse(e)}
      id='graph'
      preserveAspectRatio='none'
      viewBox={`0 ${options.title ? 0 : 6} ${width - (options.limitsLabels ? 0 : 6)} ${height - (options.title ? 0 : 9)}`}>
      {options.background && <PlotArea width={width} height={height} />}
      {options.title && title}
      {dataAvailable && horizontalBars}
      {dataAvailable && verticalBars}
      {options.configRegion && dataAvailable && selectedConfig && <polyline className="configArea" points={configAreaPoints.current} />}
      {dataAvailable && <PlotRegions aircraft={data} aircraftLimits={cleanLimit} limits={limits} options={options} />}
      {dataAvailable && lineComponents}
      {dataAvailable && pointComponents}
      {mouseIn && showCoords && mouseText()}
    </svg>
  );
}

export default Graph;
