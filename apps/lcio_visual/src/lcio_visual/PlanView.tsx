import { type ReactNode } from 'react';
import { type Controls } from './controls';
import { directionToSign, getCleanInterval, inverseRunwayNumber } from './utilities';
import { type VisualizerData } from './types';
import './View.css'
import { getObstacleIcon, type IconProps } from './icons';

interface ScaleProps {
  controls: Controls,
}

function Scale({ controls }: ScaleProps): ReactNode {
  const intervalX = getCleanInterval(controls.width, 10);
  const intervalY = getCleanInterval(controls.height / 2, 4);
  const fontSize = controls.height / 30;

  const lines = [];
  const numbers = [];
  for (let i = intervalX; i < controls.width - controls.runwayOffset; i += intervalX) {
    lines.push(
      <line
        className='gridLines'
        opacity={.4}
        strokeWidth={controls.width / 700}
        x1={i}
        y1={-controls.height * 0.45}
        x2={i}
        y2={controls.height * 0.45}></line>
    );
    numbers.push(
      <text
        className='gridLines'
        textAnchor='middle'
        x={i} y={controls.height / 70 + 1 * fontSize}
        fontSize={fontSize}>
        {i}
      </text>
    );
  }
  let ends = (controls.height - controls.height % intervalY);
  ends = ends / 2 - (ends / 2) % intervalY;
  for (let i = -ends; i <= ends; i += intervalY) {
    if (i === 0) continue;
    lines.push(
      <line
        className='gridLines'
        opacity={.4}
        strokeWidth={controls.width / 700}
        x1={(controls.width - controls.runwayOffset) * 0.04}
        y1={i}
        x2={(controls.width - controls.runwayOffset) * 0.97}
        y2={i}></line>
    );
    numbers.push(
      <text
        className='gridLines'
        x={(controls.width - controls.runwayOffset) * 0.04} y={i + fontSize / 3}
        textAnchor='end'
        fontSize={fontSize}>
        {Math.abs(i)}
      </text>
    );
  }
  return (
    <>{lines}{numbers}</>
  )
}

interface PlotControlsProps {
  controls: Controls;
}

function PlotArea({ controls }: PlotControlsProps): ReactNode {
  return (
    <rect
      className='background'
      width={controls.width}
      height={controls.height}
      x={0}
      y={-controls.height / 2}
    />
  );
}

function PlotSearchRegion({ controls }: PlotControlsProps): ReactNode {
  const height = controls.height / 2;
  const width = (height - controls.centerlineOffset) / Math.tan(controls.searchAngle / 180 * Math.PI);
  return (
    <polygon
      points={`0,${-controls.centerlineOffset} 0,${controls.centerlineOffset} ${width},${height} ${controls.width - controls.runwayOffset},${height} ${controls.width - controls.runwayOffset},${-height} ${width},${-height}`}
      fill="#F002"
    />
  );
}

interface DisplayProps {
  data: VisualizerData[];
  controls: Controls;
  setData: (arg0: VisualizerData[]) => void;
}

function PlanView({ data, controls, setData }: DisplayProps): ReactNode {
  // 1ft is 1 unit on the svg
  // with centerline being 0
  data.sort((a, b) => a.distance - b.distance);
  const points: ReactNode[] = data.map((d, i) => {
    const x = d.distance as number;
    const y = d.offset as number * directionToSign(d.offsetDir as string);

    function selectObject() {
      const tmp: VisualizerData[] = JSON.parse(JSON.stringify(data));
      tmp[i].selected = !tmp[i].selected;
      setData(tmp);
    }

    const classes = (d.selected ? ' selected' : "") + (d.danger ? ' danger' : '')
    const size = 4;

    const props: IconProps = {
      x: x,
      y: y,
      classes: classes,
      size: size,
      flip: false,
      effect: selectObject
    }

    const icon = getObstacleIcon(d, props);

    return (
      <>
        {icon}
        {d.selected ? <text
          className={'point'}
          x={x + 40 * controls.width / 6000}
          y={y - 40 * controls.width / 6000}
          fontSize={100 * controls.width / 6000}>{d.msl + " MSL"}</text>
          : <></>}
      </>
    );
  });

  const runwayId = data.length > 0 ? inverseRunwayNumber(data[0].runway) : "";

  return (
    <svg
      id='planView'
      viewBox={`${-controls.runwayOffset} -${controls.height / 2} ${controls.width} ${controls.height}`}>
      <PlotArea controls={controls} />
      <Scale controls={controls} />
      <PlotSearchRegion controls={controls} />

      <rect x={-controls.runwayOffset} y={-75} width={controls.runwayOffset} height={150} fill={"darkgrey"}></rect>
      <text x={-100} y={0} transform="rotate(-90, -100, 0)" fontSize={80} textAnchor='middle' dominantBaseline='middle' fontFamily='serif'>{runwayId}</text>

      <rect x={0} y={-10} width={controls.width - controls.runwayOffset} height={20} fill={"white"}></rect>

      {points}
    </svg>
  )
}

export default PlanView;
