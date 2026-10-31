import { type ReactNode } from 'react';
import { type Controls } from './controls';
import { directionToSign, getCleanInterval, requiredShortening } from './utilities';
import { type VisualizerData } from './types';
import './View.css'
import { getObstacleIcon, type IconProps } from './icons';

interface ScaleProps {
  controls: Controls,
}

function Scale({ controls }: ScaleProps): ReactNode {
  const intervalX = getCleanInterval(controls.width, 10);
  const intervalY = getCleanInterval(controls.height / 2, 4) / controls.profileScale;
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
        y1={controls.height * 0.05}
        x2={i}
        y2={controls.height * 0.95}></line>
    );
    numbers.push(
      <text
        className='gridLines'
        transform='scale(1, -1)'
        textAnchor='middle'
        x={i}
        y={-controls.height * 0.02}
        fontSize={fontSize}>
        {i}
      </text>
    );
  }
  for (let i = 0; i <= controls.height; i += intervalY) {
    if (i === 0) continue;
    lines.push(
      <line
        className='gridLines'
        opacity={.4}
        strokeWidth={controls.width / 900}
        x1={(controls.width - controls.runwayOffset) * 0.04}
        y1={i * controls.profileScale}
        x2={(controls.width - controls.runwayOffset) * 0.97}
        y2={i * controls.profileScale}></line>
    );
    numbers.push(
      <text
        className='gridLines'
        transform='scale(1, -1)'
        x={(controls.width - controls.runwayOffset) * 0.04}
        y={-i * controls.profileScale + fontSize / 3}
        textAnchor='end'
        fontSize={fontSize}>
        {i}
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
      y={0}
    />
  );
}
// Trying to get the scaling of the y axis to work right

function PlotSearchRegion({ controls }: PlotControlsProps): ReactNode {
  const startHeight = controls.crossingHeight;
  const height = controls.height;
  const width = (height - startHeight) / controls.climbGradient * 6070;
  return (
    <polygon
      points={`${-requiredShortening(controls)},0 0,${startHeight * controls.profileScale} ${width},${height * controls.profileScale} ${controls.width - controls.runwayOffset},${height * controls.profileScale} ${controls.width - controls.runwayOffset},${0}`}
      fill="#0F02"
    />
  );
}

interface DisplayProps {
  data: VisualizerData[];
  controls: Controls;
  setData: (arg0: VisualizerData[]) => void;
}

function ProfileView({ data, controls, setData }: DisplayProps): ReactNode {
  // 1ft is 1 unit on the svg
  // with centerline being 0
  data.sort((a, b) => a.distance - b.distance);
  const points: ReactNode[] = data.map((d, i) => {
    const x = d.distance as number;
    const y = d.offset as number * directionToSign(d.offsetDir as string);
    const height = ((d.msl as number) - controls.elevation) * controls.profileScale;

    function selectObject() {
      const tmp: VisualizerData[] = JSON.parse(JSON.stringify(data));
      tmp[i].selected = !tmp[i].selected;
      setData(tmp);
    }

    const classes = (d.selected ? ' selected' : "") + (d.danger ? ' danger' : '')
    const size = controls.height / 500;

    const props: IconProps = {
      x: x,
      y: height + size * 50,
      classes: classes,
      size: size,
      flip: true,
      effect: selectObject
    }

    const icon = getObstacleIcon(d, props);

    return (
      <>
        {icon}
        <line
          className={'point' + (d.selected ? ' selected' : "") + (d.danger ? ' danger' : '')}
          onClick={selectObject}
          cursor={"pointer"}
          key={`${x} ${y}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          strokeWidth={controls.width / 200} />
        {d.selected ? <text
          className={'point'}
          transform="scale(1, -1)"
          x={x + 40 * controls.width / 6000}
          y={-height - 40 * controls.width / 6000}
          fontSize={100 * controls.width / 6000}>{d.msl + " MSL"}</text >
          : <></>
        }
      </>
    );
  });

  return (
    <svg
      id='profileView'
      viewBox={`${-controls.runwayOffset} ${0} ${controls.width} ${controls.height}`}
      transform="scale(1, -1)"
    >
      <PlotArea controls={controls} />
      <PlotSearchRegion controls={controls} />
      <rect x={-controls.runwayOffset} y={0} width={controls.runwayOffset} height={40} fill={"darkgrey"}></rect> // Runway
      <rect x={0} y={0} width={controls.width - controls.runwayOffset} height={20} fill={"white"}></rect>
      <Scale controls={controls} />
      {points}
    </svg>
  )
}

export default ProfileView;
