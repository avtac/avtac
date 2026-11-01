import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { type Controls, type SetControls } from './controls';
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
  setControls: SetControls;
}

let dragging = false;
let pinching = false;
let dragStart = 0;
let dragStartDistance = 0;
let dragStartWidth = 0;

function ProfileView({ data, controls, setData, setControls }: DisplayProps): ReactNode {
  // 1ft is 1 unit on the svg
  // with centerline being 0
  const diagram: RefObject<(SVGSVGElement | null)> = useRef(null);

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

  function onDrag(e: React.MouseEvent<SVGElement>) {
    if (e.buttons === 1) {
      const movement = e.movementX;
      const newOffset = controls.runwayOffset + Math.round(movement * controls.width / e.currentTarget.clientWidth);
      move(newOffset, 0);
    }
  }

  function onWheel(e: React.WheelEvent<SVGElement>) {
    const widthChange = (e.deltaY * controls.width / 1000);
    const newWidth = controls.width + widthChange;

    const pos = (e.clientX - e.currentTarget.getBoundingClientRect().left) * controls.width / e.currentTarget.clientWidth;
    const newPos = pos * newWidth / controls.width;
    const dPos = newPos - pos;

    const newOffset = controls.runwayOffset + Math.round(dPos);
    setControls.width(Math.min(Math.max(newWidth, 500), 20000));
    move(newOffset, 0);
  }

  function onTouchStart(e: React.TouchEvent<SVGElement>) {
    console.log(e.touches.length);
    if (!dragging && e.touches.length === 1) {
      dragging = true;
      const scale = controls.width / e.currentTarget.clientWidth
      dragStart = (e.touches[0].clientX - e.currentTarget.getBoundingClientRect().left) * scale - controls.runwayOffset;
    } else if (!pinching && e.touches.length === 2) {
      pinching = true;
      dragging = false;
      const dragStart1 = (e.touches[0].clientX - e.currentTarget.getBoundingClientRect().left);
      const dragStart2 = (e.touches[1].clientX - e.currentTarget.getBoundingClientRect().left);
      const scale = controls.width / e.currentTarget.clientWidth
      dragStartDistance = Math.abs(dragStart2 - dragStart1) * scale;
      dragStartWidth = controls.width;
    }
  }

  function onTouchEnd(e: React.TouchEvent<SVGElement>) {
    if (e.touches.length === 0) {
      dragging = false;
      pinching = false;
    } else if (e.touches.length === 1) {
      pinching = false;
    }
  }

  function onTouchDrag(e: TouchEvent) {
    if (e.currentTarget === null) return;
    const target = e.currentTarget as Element;
    e.preventDefault();
    if (dragging && e.touches.length === 1) {
      const position = e.touches[0].clientX - target.getBoundingClientRect().left;
      const scale = controls.width / target.clientWidth;

      const newOffset = Math.round(position * scale - dragStart);
      move(newOffset, 0);
    } else if (pinching && e.touches.length === 2) {
      const scale = controls.width / target.clientWidth;

      const dragStart1 = (e.touches[0].clientX - target.getBoundingClientRect().left);
      const dragStart2 = (e.touches[1].clientX - target.getBoundingClientRect().left);
      const distance = Math.abs(dragStart2 - dragStart1) * scale;

      let newWidth = dragStartWidth - (distance - dragStartDistance) * 1;
      newWidth = Math.min(Math.max(newWidth, 500), 20000)

      const pos = dragStart1 * scale - controls.runwayOffset;
      const newPos = pos * newWidth / controls.width;
      const dPos = newPos - pos;

      const newOffset = controls.runwayOffset + Math.round(dPos);
      setControls.width(newWidth);
      move(newOffset, 0);
    }
  }

  function move(dx: number, _: number) {
    setControls.runwayOffset(Math.max(Math.min(dx, controls.width), -20000));
  }

  useEffect(() => {
    const e = diagram?.current;
    e?.addEventListener("touchmove", onTouchDrag, { passive: false });
  }, [])

  return (
    <svg
      id='profileView'
      ref={diagram}
      onMouseMove={onDrag}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      viewBox={`${-controls.runwayOffset} ${0} ${controls.width} ${controls.height}`}
      transform="scale(1, -1)"
    >
      <PlotArea controls={controls} />
      <PlotSearchRegion controls={controls} />

      <rect x={-controls.runwayOffset} y={0} width={Math.max(controls.runwayOffset, 0)} height={40} fill={"darkgrey"}></rect> // Runway
      <rect x={0} y={0} width={Math.max(controls.width - controls.runwayOffset, 0)} height={20} fill={"white"}></rect>

      <Scale controls={controls} />
      {points}
    </svg>
  )
}

export default ProfileView;
