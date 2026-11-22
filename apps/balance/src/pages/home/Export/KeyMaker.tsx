import { Grouping, Subregion } from "@avtac/ui/Layout";
import { generateKey, regenerateKey, showStatus } from "./api";
import { useRef, useState, type RefObject } from "react";

interface KeyMakerProps {
  authenticated: boolean;
  exit: () => void;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) { }
}

function KeyMaker({ authenticated, exit }: KeyMakerProps) {
  const ref: RefObject<(null | HTMLParagraphElement)> = useRef(null)
  const [savedKey, setSavedKey] = useState(true);
  const [readWarning, setReadWarning] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(false);


  function genNewKey() {
    setSavedKey(false);
    setGeneratedKey(true);
    regenerateKey()
      .then(resp => { showStatus(resp); return resp.text(); })
      .then(key => { if (ref.current) ref.current.innerText = key });
    if (ref.current) ref.current.innerText = "Generating Key";
  }

  function genKey() {
    setSavedKey(false);
    setGeneratedKey(true);
    generateKey()
      .then(resp => { showStatus(resp); return resp.text(); })
      .then(key => { if (ref.current) ref.current.innerText = key });
    if (ref.current) ref.current.innerText = "Generating Key";
  }

  return (
    <Subregion id="key-gen">
      <h3>Generate an API key</h3>
      <p>This is where you generate an api key. It will give you access to uploading your own templates.
        You will need this key to tag and upload updates so be sure to save it somewhere safe.
        If you need to replace an old key enter your current key at the bottom.</p>
      {authenticated && <p><b>You are about to generate a key, replacing your current key.
        This will make the current key useless.
        This only needs to be done if your current key is compromised.</b></p>}
      <br />
      <p className="warn"><b>THIS IS THE ONLY TIME YOU WILL SEE THE KEY</b></p>
      <p className="warn"><b>SAVE THIS KEY SOMEWHERE SAFE</b></p>
      <p className="warn"><b>IF LOST, YOU WILL LOSE ALL ACCESS TO YOUR TEMPLATES</b></p>
      <Grouping><p id='key' ref={ref} onClick={e => copyText(e.currentTarget.innerText)}></p></Grouping>
      <div>
        {readWarning && !generatedKey && !authenticated && <button onClick={genKey}>Generate</button>}
        {readWarning && !generatedKey && authenticated && <button onClick={genNewKey}>Replace Key</button>}
        {!savedKey && <button onClick={() => setSavedKey(true)}>I have saved my key</button>}
        {savedKey && <button onClick={exit}>Exit</button>}
        {!readWarning && <button onClick={() => setReadWarning(true)}>I have read the warning</button>}
      </div>
    </Subregion>
  )
}

export default KeyMaker;
