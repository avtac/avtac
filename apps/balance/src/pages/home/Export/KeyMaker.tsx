import { Grouping, Subregion } from "@avtac/ui/Layout";
import { generateKey } from "./api";
import { useRef, useState, type RefObject } from "react";

interface KeyMakerProps {
  exit: () => void;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) { }
}

function KeyMaker({ exit }: KeyMakerProps) {
  const ref: RefObject<(null | HTMLParagraphElement)> = useRef(null)
  const [confirmed, setConfirmed] = useState(true)

  function genKey() {
    setConfirmed(false)
    generateKey()
      .then(resp => resp.text())
      .then(key => { if (ref.current) ref.current.innerText = key })
    if (ref.current) ref.current.innerText = "Generating Key"
  }

  return (
    <Subregion id="key-gen">
      <h3>Generate an API key</h3>
      <p>This is where you generate an api key. It will give you access to uploading your own templates.
        You will need this key to tag and upload updates so be sure to save it somewhere safe.</p>
      <br />
      <p className="warn"><b>THIS IS THE ONLY TIME YOU WILL SEE THE KEY</b></p>
      <p className="warn"><b>SAVE THIS KEY SOMEWHERE SAFE</b></p>
      <p className="warn"><b>IF LOST YOU WILL LOSE ALL ACCESS TO YOUR TEMPLATES</b></p>
      <Grouping><p id='key' ref={ref} onClick={e => copyText(e.currentTarget.innerText)}></p></Grouping>
      <div>
        <button onClick={genKey}>Generate</button>
        <button hidden={confirmed} onClick={() => setConfirmed(true)}>I have saved my key</button>
        <button hidden={!confirmed} onClick={exit}>Exit</button>
      </div>
    </Subregion>
  )
}

export default KeyMaker;
