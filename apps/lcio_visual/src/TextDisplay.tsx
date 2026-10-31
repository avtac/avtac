import { type ReactNode } from "react";
import './TextDisplay.css'
import { type VisualizerData } from "./types";
import { type Controls } from "./controls";
import { Subregion } from "@avtac/ui/Layout";

interface DisplayProps {
  data: VisualizerData[];
  controls: Controls;
  setData: (arg0: VisualizerData[]) => void;
}

function TextDisplay({ data, setData, controls }: DisplayProps): ReactNode {
  // const filtered: VisualizerData[] = data.filter(d => d.danger || d.selected);
  const sorted: VisualizerData[] = data.sort((a, b) => a.distance - b.distance);
  let j = 0;
  const rows = data.map((d, i) => {
    if (!d.selected && !d.danger) return <></>;
    j++;

    function selectObject() {
      const tmp: VisualizerData[] = JSON.parse(JSON.stringify(sorted));
      tmp[i].selected = !tmp[i].selected;
      setData(tmp);
    }

    return (<div key={d.original} onClick={selectObject}>
      {controls.showOriginal ?
        <span className={d.selected ? "Pi" : "P" + ((j % 2) + 1)}>{d.original}</span>
        :
        <>
          <span className={d.selected ? "Pi" : "P1"}>{d.type}</span>
          <span className={d.selected ? "Pi" : "P2"}> {d.distance}ft from DER</span>
          <span className={d.selected ? "Pi" : "P3"}> {d.offset}ft {d.offsetDir},</span>
          <span className={d.selected ? "Pi" : "P4"}> {d.agl ? d.agl + "ft AGL/" : ""}{d.msl}ft MSL</span>
        </>
      }
    </div>)
  });

  function selectAll() {
    const tmp: VisualizerData[] = JSON.parse(JSON.stringify(data));
    tmp.forEach(d => {
      d.selected = true;
    });
    setData(tmp);
  }

  function deselectAll() {
    const tmp: VisualizerData[] = JSON.parse(JSON.stringify(data));
    tmp.forEach(d => {
      d.selected = false;
    });
    setData(tmp);
  }

  return (
    <>
      <Subregion id="textDisplayButtons">
        <button onClick={deselectAll} style={{ display: data.some(v => v.selected) ? 'block' : 'none' }}>Deselect All</button>
        <button onClick={selectAll} style={{ display: !data.some(v => v.selected) ? 'block' : 'none' }}>Select All</button>
      </Subregion>
      <Subregion id="displayText">
        {rows}
      </Subregion>
    </>
  )
}

export default TextDisplay;
