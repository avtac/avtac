import { type ReactNode } from 'react';
import { type Controls, type SetControls } from './controls';
import './Inputs.css'
import './Layout.css'
import { Subregion } from './Layout';

interface InputsProps {
  controls: Controls;
  setControls: SetControls;
}

function Inputs({ controls, setControls }: InputsProps): ReactNode {

  return (
    <>
      <Subregion>
        <div className='group'>
          <p>Show Original</p>
          <div style={{ display: "flex" }}>
            <input
              name='original'
              id='original'
              type="checkbox"
              checked={controls.showOriginal}
              onChange={(e) => setControls.showOriginal(e.target.checked)} />
          </div>
        </div>
        {/* <div className='group' style={{ width: "3rem" }}> */}
        {/*   <p>View</p> */}
        {/*   <div style={{ display: "flex" }}> */}
        {/*     <input */}
        {/*       name='view' */}
        {/*       id='view' */}
        {/*       type="checkbox" */}
        {/*       checked={controls.view} */}
        {/*       defaultChecked={false} */}
        {/*       onChange={(e) => setControls.view(e.target.checked)} /> */}
        {/*     <label htmlFor='view'>{!controls.view ? "Plan" : "Profile"}</label> */}
        {/*   </div> */}
        {/* </div> */}
        <div className='group'>
          <p>View Width (ft)</p>
          <div style={{ display: "flex" }}>
            <input
              name='widthSlider'
              id='widthSlider'
              type={"range"}
              value={controls.width}
              min={500}
              max={3 * 6070}
              step={100}
              onChange={(e) => setControls.width(Number(e.target.value))}></input>
            <label htmlFor='widthSlider'>{controls.width}ft</label>
          </div>
        </div>
        <div className='group'>
          <p>View Runway Offset (ft)</p>
          <div style={{ display: "flex" }}>
            <input
              name='runwayOffset'
              id='runwayOffset'
              type={"range"}
              value={controls.runwayOffset}
              min={-6000}
              max={6000}
              step={100}
              onChange={(e) => setControls.runwayOffset(Number(e.target.value))}></input>
            <label htmlFor='runwayOffset'>{controls.runwayOffset}ft</label>
          </div>
        </div>
        <div className='group'>
          <p>Elevation (ft)</p>
          <div style={{ display: "flex" }}>
            <input
              name='elevation'
              id='elevation'
              type={"number"}
              value={controls.elevation}
              onChange={(e) => setControls.elevation(Number(e.target.value))}></input>
          </div>
        </div>
      </Subregion>
      <Subregion>
        <div className='group'>
          <p>Safety Angle (deg)</p>
          <div style={{ display: "flex" }}>
            <input
              name='safeAngle'
              id='safeAngle'
              type={"range"}
              value={controls.searchAngle}
              min={1}
              max={90}
              onChange={(e) => setControls.searchAngle(Number(e.target.value))}></input>
            <label htmlFor='safeAngle'>{controls.searchAngle}deg</label>
          </div>
        </div>
        <div className='group'>
          <p>Centerline Offset (ft)</p>
          <div style={{ display: "flex" }}>
            <input
              name=''
              id='centerlineOffset'
              type={"range"}
              value={controls.centerlineOffset}
              min={0}
              max={200}
              onChange={(e) => setControls.centerlineOffset(Number(e.target.value))}></input>
            <label htmlFor='centerlineOffset'>{controls.centerlineOffset}ft</label>
          </div>
        </div>
      </Subregion>
      <Subregion>
        <div className='group'>
          <p>Climb Gradient (ft/NM)</p>
          <div style={{ display: "flex" }}>
            <input
              name='gradient'
              id='gradient'
              type={"range"}
              value={controls.climbGradient}
              min={50}
              max={600}
              onChange={(e) => setControls.climbGradient(Number(e.target.value))}></input>
            <label htmlFor='gradient'>{controls.climbGradient}ft/NM</label>
          </div>
        </div>
        <div className='group'>
          <p>Crossing Height (ft)</p>
          <div style={{ display: "flex" }}>
            <input
              name='crossHeight'
              id='crossHeight'
              type={"range"}
              value={controls.crossingHeight}
              min={0}
              max={1000}
              onChange={(e) => setControls.crossingHeight(Number(e.target.value))}></input>
            <label htmlFor='crossHeight'>{controls.crossingHeight}ft</label>
          </div>
        </div>
      </Subregion>
    </>
  );
}

export default Inputs;
