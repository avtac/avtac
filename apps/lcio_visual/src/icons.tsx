import type { ReactNode } from "react"
import type { VisualizerData } from "./types"

export interface IconProps {
  x: number
  y: number
  classes: string
  size: number
  flip: boolean
  effect: () => void
}

export function getObstacleIcon(row: VisualizerData, props: IconProps): ReactNode {

  interface types {
    searchTerm: string[];
    function: (arg0: IconProps) => ReactNode;
  }

  const obstacleTypes: types[] = [
    { searchTerm: ["tree"], function: TreeIcon },
    { searchTerm: ["building"], function: BuildingIcon },
    { searchTerm: ["roadway", "vehicle"], function: RoadIcon },
    { searchTerm: ["train", 'tracks', 'railway', 'railroad'], function: TrainIcon },
    { searchTerm: ["terrain"], function: TerrainIcon },
    { searchTerm: ["vegetation"], function: VegetationIcon },
    { searchTerm: ["fence"], function: FenceIcon },
  ]

  const type = row.type.toLowerCase();
  for (const t of obstacleTypes) {
    if (t.searchTerm.some(v => type.includes(v)))
      return t.function(props);
  }
  console.log(row.original);

  return DefaultIcon(props);
}

const TreeIcon = ({ x, y, classes, size, flip, effect }: IconProps) => (
  <path
    className={"point" + classes}
    onClick={effect}
    key={`${x} ${y}`}
    x={x}
    y={y}
    transform={`translate(${x}, ${y}) translate(${-12 * size}, ${-12 * size}) scale(${size} ${flip ? -size : size})`}
    strokeWidth={size / 5}
    d="M13.95,22h-3.9V18H3l4-6H5L12,2l7,10H17l4,6H13.95v4Z" />
);

const BuildingIcon = ({ x, y, classes, size, flip, effect }: IconProps) => (
  <path
    className={"point" + classes}
    onClick={effect}
    key={`${x} ${y}`}
    transform={`translate(${x}, ${y}) translate(${-12 * size}, ${-12 * size}) scale(${size} ${flip ? -size : size})`}
    strokeWidth={size / 5}
    d="M2,21V3H12V7H22V21H2Zm2-2H6V17H4v2Zm0-4H6V13H4v2Zm0-4H6V9H4v2ZM4,7H6V5H4V7ZM8,19h2V17H8v2Zm0-4h2V13H8v2Zm0-4h2V9H8v2ZM8,7h2V5H8V7Zm4,12h8V9H12v2h2v2H12v2h2v2H12v2Zm4-6V11h2v2H16Zm0,4V15h2v2H16Z" />
);

const TrainIcon = ({ x, y, classes, size, flip, effect }: IconProps) => (
  <path
    className={"point" + classes}
    onClick={effect}
    key={`${x} ${y}`}
    transform={`translate(${x}, ${y}) translate(${-12 * size}, ${-12 * size}) scale(${size} ${flip ? -size : size})`}
    strokeWidth={size / 5}
    d="M4,15.5V6Q4,4.67 4.69,3.89T6.5,2.69Q7.63,2.27 9.06,2.14T12,2q1.65,0 3.11,0.14t2.55,0.55t1.71,1.2Q20,4.67 20,6v9.5q0,1.48-1.01,2.49T16.5,19L18,20.5V21H16l-2-2H10L8,21H6V20.5L7.5,19q-1.47,0-2.49-1.01T4,15.5ZM12,4Q9.35,4 8.13,4.31T6.45,5h11.2q-0.38-0.43-1.61-0.71T12,4ZM6,10h5V7H6v3Zm10.5,2h-9q-0.65,0-1.07,0T6,12H18q0,0-0.43,0T16.5,12ZM13,10h5V7H13v3ZM9.58,15.58Q10,15.15 10,14.5T9.58,13.43T8.5,13T7.43,13.43T7,14.5t0.43,1.07T8.5,16t1.08-0.43Zm7,0Q17,15.15 17,14.5t-0.43-1.08T15.5,13t-1.07,0.42T14,14.5t0.43,1.07T15.5,16t1.07-0.43ZM7.5,17h9q0.65,0 1.07-0.43T18,15.5V12H6v3.5q0,0.65 0.43,1.07T7.5,17ZM12,5q2.8,0 4.04,0t1.61,0H6.45Q6.9,5 8.13,5T12,5Z" />
);

const FenceIcon = ({ x, y, classes, size, flip, effect }: IconProps) => (
  <path
    className={"point" + classes}
    onClick={effect}
    key={`${x} ${y}`}
    transform={`translate(${x}, ${y}) translate(${-12 * size}, ${-12 * size}) scale(${size} ${flip ? -size : size})`}
    strokeWidth={size / 5}
    d="M5,20V16H3V14H5V12H3V10H5V7L8,4l2,2l2.03-2l2,2l2-2l3,3v3H21v2H19.03v2H21v2H19.03v4H5ZM7,10H9V7.82l-1-1l-1,1V10Zm4,0h2V7.82l-1-1l-1,1V10Zm4.03,0H17V7.82l-1-1L15.03,7.8V10ZM7,14H9V12H7v2Zm4,0h2V12H11v2Zm4.03,0H17V12H15.03v2ZM7,18H9V16H7v2Zm4,0h2V16H11v2Zm4.03,0H17V16H15.03v2Z" />
);

const VegetationIcon = ({ x, y, classes, size, flip, effect }: IconProps) => (
  <path
    className={"point" + classes}
    onClick={effect}
    key={`${x} ${y}`}
    transform={`translate(${x}, ${y}) translate(${-12 * size}, ${-12 * size}) scale(${size} ${flip ? -size : size})`}
    strokeWidth={size / 5}
    d="M2,20V18H7.75Q7.2,15.88 5.66,14.34T2,12.25q0.5-0.13 0.99-0.19T4,12q3.35,0 5.68,2.32T12,20H2Zm12,0q0-1.05-0.22-2.09t-0.65-1.99q1.05-1.78 2.86-2.85T20,12q0.53,0 1.01,0.06T22,12.25q-2.13,0.55-3.65,2.09q-1.53,1.54-2.1,3.66H22v2H14Zm-2-5.98q0-1.63 0.6-3.05t1.65-2.51q1.05-1.09 2.46-1.74t3.01-0.7q-1.4,0.88-2.45,2.15t-1.63,2.85q-1.1,0.53-2.01,1.29T12,14.02Zm-1.82-1.88q-0.3-0.22-0.6-0.42q-0.3-0.2-0.63-0.4q0-0.15 0.02-0.31T9,10.7Q9,8.8 8.4,7.1T6.7,4Q8.35,4.67 9.56,5.94t1.86,2.91q-0.45,0.75-0.78,1.59q-0.32,0.84-0.47,1.71Z" />
);

const RoadIcon = ({ x, y, classes, size, flip, effect }: IconProps) => (
  <path
    className={"point" + classes}
    onClick={effect}
    key={`${x} ${y}`}
    transform={`translate(${x}, ${y}) translate(${-12 * size}, ${-12 * size}) scale(${size} ${flip ? -size : size})`}
    strokeWidth={size / 5}
    d="M4,20V4H6V20H4Zm7,0V16h2v4H11Zm7,0V4h2V20H18Zm-7-6V10h2v4H11Zm0-6V4h2V8H11Z" />
);

const TerrainIcon = ({ x, y, classes, size, flip, effect }: IconProps) => (
  <path
    className={"point" + classes}
    onClick={effect}
    key={`${x} ${y}`}
    transform={`translate(${x}, ${y}) translate(${-12 * size}, ${-12 * size}) scale(${size} ${flip ? -size : size})`}
    strokeWidth={size / 5}
    d="M1,18l6-8l4.5,6H19L14,9.35l-2.5,3.3L10.25,11L14,6l9,12H1Zm13.03-2ZM5,16H9L7,13.33L5,16Zm0,0H7H9H5Z" />
);

const DefaultIcon = ({ x, y, classes, size, effect }: IconProps) => (
  <circle
    className={"point" + classes}
    onClick={effect}
    key={`${x} ${y}`}
    cx={x}
    cy={y}
    r={size * 6}
    strokeWidth={size / 5} />
);
