import { useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import "./Diagram.css"
import { DiagramModes, type seatT, type cargoAreaT, type aircraftConfigT, type operationConfigT, type aircraftT, type loadingT, baseLengthUnit } from "./Types";
import { calculateMAC, roundNumber, validateAircraft } from "./utility";
import { convertLengthUnit, UnitContext } from "./UnitsContext";

// This is the assumed length of a seat (in arm units) where the arm is expected to be
// at the center of the seat
const seatSize = 21;
const cargoSize = seatSize;
const fontSize = 4;

interface cargoIconProps {
  name: string,
  offX: number,
  offY: number,
  width: number
  opsPercent?: number,
  loadedPercent?: number,
}

function CargoIcon({ name, offX = 0, offY = 0, width = cargoSize, opsPercent = 0, loadedPercent = 0 }: cargoIconProps): ReactNode {
  const left = offX - cargoSize / 2;
  const top = offY - width / 2;
  return (
    <>
      <rect
        className="loadingFill"
        strokeWidth={0}
        width={cargoSize}
        height={width * loadedPercent}
        x={left}
        y={top + width * (1 - opsPercent - loadedPercent)}
        ry={.4105551} />
      <rect
        className="cargoOpsFill"
        strokeWidth={0}
        width={cargoSize}
        height={width * opsPercent}
        x={left}
        y={top + width * (1 - opsPercent)}
        ry={.4105551} />
      <rect
        className="cargo"
        stroke={"black"}
        strokeWidth={0.5}
        width={cargoSize}
        height={width}
        x={left}
        y={top}
        ry={.4105551} />
      <text
        x={offX}
        y={-offY}
        transform={`rotate(${90} ${offX} ${-offY})`}
        alignmentBaseline={'middle'}
        textAnchor="middle"
        fontSize={fontSize}>
        {name}
      </text>
    </>
  );
}

interface seatIconProps {
  name: string,
  offX: number,
  offY: number,
  count: number,
  onClick: (arg0: React.MouseEvent) => void,
  opsCount?: number,
  loadedCount?: number,
}

// offX, offY are in canvas units
function SeatIcon({ count, name, onClick, offX = 0, offY = 0, opsCount = 0, loadedCount = 0 }: seatIconProps): ReactNode {
  const left = offX - seatSize / 2;
  return (
    <>
      {...Array(count).fill(0).map((_, i: number) => {
        const top = offY - (i - count / 2) * seatSize;
        const index = count - 1 - i;
        const opsFilled = opsCount > index;
        const loadFilled = loadedCount + opsCount > index;
        const fillClass = opsFilled ? " opsFilled" : (loadFilled ? " loadFilled" : "");
        return (
          <>
            <rect
              onClick={onClick}
              className={"seat" + fillClass}
              stroke={"#000000"}
              strokeWidth={0.5}
              width={seatSize}
              height={seatSize}
              x={left}
              y={-top}
              ry={2} />
            <rect
              onClick={onClick}
              className={"seat" + fillClass}
              stroke={"#000000"}
              strokeWidth={0.5}
              width={seatSize / 3}
              height={seatSize / 8}
              x={seatSize * 1 / 3 + left}
              y={-seatSize + top}
              ry={0.29849526}
              transform={"scale(1,-1)"} />
            <rect
              onClick={onClick}
              className={"seat" + fillClass}
              stroke={"#000000"}
              strokeWidth={0.5}
              width={seatSize / 3}
              height={seatSize / 8}
              x={seatSize * 1 / 3 + left}
              y={-seatSize / 8 + top}
              ry={0.29849526}
              transform={"scale(1,-1)"} />
            <rect
              onClick={onClick}
              className={"seat" + fillClass}
              stroke={"#000000"}
              strokeWidth={0.5}
              width={seatSize * 3 / 8}
              height={seatSize}
              x={left}
              y={-seatSize + top}
              ry={2}
              transform={"scale(1,-1)"} />
          </>
        )
      })}
      <text
        x={+left + seatSize / 2}
        y={-offY - (offY >= 0 ? 1 : -1) * (count / 2 + .13) * seatSize}
        alignmentBaseline={'middle'}
        textAnchor="middle"
        fontSize={fontSize}>
        {name}
      </text>
    </>
  );
}

interface diagramProps {
  aircraft: aircraftT;
  loading?: loadingT;
  setLoading?: (arg0: loadingT) => void;
  diagramMode: DiagramModes;
  selectedConfig: string;
  selectedOpsConfig: string;
}

function Diagram({ aircraft, loading, setLoading, diagramMode, selectedConfig, selectedOpsConfig }: diagramProps): ReactNode {
  const [scale, setScale] = useState(1);
  const units = useContext(UnitContext);
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

  if (validateAircraft(aircraft)) return (<></>);

  let seats = [...aircraft.seats]
  let cargoAreas = [...aircraft.cargoAreas]

  if (diagramMode === DiagramModes.Config || diagramMode === DiagramModes.Ops) {
    const configIndex: number = aircraft.aircraftConfigs.findIndex((c: aircraftConfigT) => c.id === selectedConfig);
    if (configIndex < 0) return;

    seats = aircraft.aircraftConfigs[configIndex].seats.map((seatId: string) => {
      const seatIndex: number = aircraft.seats.findIndex((s: seatT) => s.id === seatId);
      return aircraft.seats[seatIndex];
    }).filter(v => v != undefined);

    cargoAreas = aircraft.aircraftConfigs[configIndex].cargoAreas.map((cargoAreaId: string) => {
      const cargoAreaIndex: number = aircraft.cargoAreas.findIndex((s: cargoAreaT) => s.id === cargoAreaId);
      return aircraft.cargoAreas[cargoAreaIndex];
    }).filter(v => v != undefined);
  }
  if (seats.length === 0 && cargoAreas.length === 0) return (<></>);

  const planePadding = 6;
  let minArm = Infinity;
  let maxArm = 0;
  let minDisplacement = 0;
  let maxDisplacement = 0;
  if (seats.length !== 0) {
    minArm = seats.reduce((min, item) => Math.min(min, item.arm), seats[0].arm);
    maxArm = seats.reduce((max, item) => Math.max(max, item.arm), seats[0].arm);

    minDisplacement = seats.reduce((min, item) => Math.min(min, item.lateralDist - item.seatCount * seatSize / 2), seats[0].lateralDist - seats[0].seatCount * seatSize / 2);
    maxDisplacement = seats.reduce((max, item) => Math.max(max, item.lateralDist + item.seatCount * seatSize / 2), seats[0].lateralDist + seats[0].seatCount * seatSize / 2);
  }

  if (cargoAreas.length !== 0) {
    minArm = Math.min(minArm, cargoAreas.reduce((min, item) => Math.min(min, item.arm), cargoAreas[0].arm));
    maxArm = Math.max(maxArm, cargoAreas.reduce((max, item) => Math.max(max, item.arm), cargoAreas[0].arm));
  }

  const canvasPadding = 4;
  // Dimensions in inches of displayed aircraft
  const planeRight = maxDisplacement - minDisplacement >= seatSize ? maxDisplacement + planePadding : seatSize / 2 + planePadding;
  const planeLeft = maxDisplacement - minDisplacement >= seatSize ? minDisplacement - planePadding : -planeRight;
  const planeFront = minArm - planePadding - seatSize / 2;
  const planeBack = maxArm + planePadding + seatSize / 2;
  const planeLength = planeBack - planeFront;
  const planeWidth = planeRight - planeLeft;

  const left = -planeBack - canvasPadding;
  const right = -planeFront + canvasPadding + planeWidth / 2.65;
  const width = right - left;
  const bottom = planeRight + canvasPadding;
  const top = planeLeft - canvasPadding;
  const height = bottom - top;

  const opsIndex: number = aircraft.operationConfigs.findIndex((o: operationConfigT) => selectedOpsConfig == o.id);
  const seatItems = seats.map((seat: seatT): ReactNode => {
    const seatIndex = opsIndex < 0 ? -1 : aircraft.operationConfigs[opsIndex].seats.findIndex(
      (v: { id: string, weight: number }) => v.id == seat.id
    )

    const isOps = diagramMode === DiagramModes.Ops && opsIndex >= 0
      && selectedOpsConfig != undefined
      && seatIndex >= 0;

    const opsUsed = isOps ? Math.ceil(aircraft.operationConfigs[opsIndex].seats[seatIndex].weight / seat.maxWeight) : 0;
    let loadedPax = 0;
    if (loading) {
      const pax = loading.passengers.find(s => s.location === seat.id);
      loadedPax = pax ? pax.count : 0;
    }

    const onClick = (e: React.MouseEvent) => {
      if (!loading || !setLoading) return;
      const tmp = JSON.parse(JSON.stringify(loading));
      const index = loading.passengers.findIndex(p => p.location === seat.id);
      if (index < 0) {
        tmp.passengers.push({ location: seat.id, count: e.shiftKey ? seat.seatCount - opsUsed : Math.min(1, seat.seatCount - opsUsed), avgWeight: 200 })
      } else {
        const incCount = (loadedPax + 1) % (seat.seatCount - opsUsed + 1);
        const absCount = loadedPax === (seat.seatCount - opsUsed) ? 0 : (seat.seatCount - opsUsed);
        const newCount = e.shiftKey ? absCount : incCount;
        if (newCount === 0) tmp.passengers.splice(index, 1);
        else tmp.passengers[index].count = newCount;
      }
      setLoading(tmp);
    }

    return <SeatIcon
      key={seat.id}
      name={seat.name}
      onClick={e => onClick(e)}
      opsCount={opsUsed}
      loadedCount={loadedPax}
      offX={-seat.arm}
      offY={-seat.lateralDist}
      count={Math.max(Number(seat.seatCount), 0)} />
  });

  const cargoItems = cargoAreas.map((cargoArea: cargoAreaT): ReactNode => {
    const cargoIndex = opsIndex < 0 ? -1 : aircraft.operationConfigs[opsIndex].cargoAreas.findIndex(
      (v: { id: string, weight: number }) => v.id == cargoArea.id
    )
    const isOps = diagramMode === DiagramModes.Ops && opsIndex >= 0
      && selectedOpsConfig != undefined
      && cargoIndex >= 0;
    const opsPercentUsed = isOps ? aircraft.operationConfigs[opsIndex].cargoAreas[cargoIndex].weight / cargoArea.maxWeight : 0;
    let loadedPercent = 0;
    if (loading) {
      const load = loading.cargo.find(c => c.location === cargoArea.id)
      loadedPercent = load ? load.weight / cargoArea.maxWeight : 0;
    }
    return <CargoIcon
      key={cargoArea.id}
      name={cargoArea.name}
      opsPercent={opsPercentUsed}
      loadedPercent={loadedPercent}
      offX={-cargoArea.arm}
      offY={(planeRight - planeLeft) / 2 + planeLeft}
      width={planeWidth - planePadding * 2} />
  });

  function setMouse(e: React.MouseEvent<SVGSVGElement, globalThis.MouseEvent>) {
    const diagram = document.getElementById("aircraft");
    if (!diagram) return;
    const box = diagram.getBoundingClientRect();
    const mousePos = { x: planeBack - (e.pageX - box.x) * (planeLength + planeWidth / 2.65) / box.width, y: (e.pageY - box.y) * planeWidth / box.height + planeLeft }
    setMouseIn(mousePos.x > planeFront && mousePos.x < planeBack && mousePos.y < planeRight && mousePos.y > planeLeft);
    setMousePos(mousePos);
  }

  const mouseText = () => {
    const string = roundNumber(units.useMAC ? calculateMAC(mousePos.x, aircraft.properties.mac, aircraft.properties.leadingEdgeMAC, units.useMAC) : convertLengthUnit(mousePos.x, baseLengthUnit, units.lengthUnits), 100) + (units.useMAC ? "%" : units.lengthUnits);
    return (
      <>
        <line
          x1={-mousePos.x}
          x2={-mousePos.x}
          y1={planeLeft}
          y2={planeRight}
          pointerEvents={'none'}
          fill='grey'
          stroke='white'
          rx={.3}
          strokeWidth={width * .001} />
        <text
          x={-mousePos.x}
          y={planeRight - 1}
          textAnchor="start"
          dominantBaseline='alphabetic'
          fontSize={width * .025 / scale}
          fill='white'>
          {string}
        </text>
      </>
    )
  }

  function handleMouse(e: React.MouseEvent<SVGSVGElement, globalThis.MouseEvent>) {
    if (e.button === 2)
      setShowCoords(!showCoords);
  }

  function setDiagramScale(e: React.WheelEvent<SVGSVGElement>) {
    if (e.ctrlKey || e.shiftKey) return;
    const diagram = document.getElementById("aircraft");
    if (!diagram) return;
    setScale(Math.min(Math.max(scale + -Math.sign(e.deltaY) * 0.1 * scale, 1), 10));
    // TODO: Zoom to where the mouse is not just start of scroll area
    if (ref.current) {
      ref.current.style.transform = `scale(${scale})`;
    }
  }

  return (
    <svg
      ref={ref}
      onContextMenu={(e) => e.preventDefault()}
      onPointerUp={e => handleMouse(e)}
      onMouseMove={e => setMouse(e)}
      onWheel={e => setDiagramScale(e)}
      viewBox={`${left} ${top} ${width} ${height}`}
      id="diagram">
      <path
        id="aircraft"
        d={`M ${-planeBack} ${planeLeft} L ${-planeFront} ${planeLeft} C ${-planeFront + planeWidth / 2} ${planeWidth / 3 + planeLeft}, ${-planeFront + planeWidth / 2} ${planeWidth * 2 / 3 - planeRight} ${-planeFront} ${planeRight} L ${-planeBack} ${planeRight} L ${-planeBack} ${planeLeft}`}
        stroke={'none'} />
      {cargoItems}
      {seatItems}
      {showCoords && mouseIn && mouseText()}
    </svg>
  );
}

export default Diagram;
