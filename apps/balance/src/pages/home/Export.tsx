import './Export.css'
import diagramStyle from '../../Diagram.css?inline'
import graphStyle from '../../Graph.css?inline'
import colorStyle from '@avtac/ui/colors.css?inline'
import { useMemo, useContext, useEffect, useState, type ReactNode } from "react";
import { type aircraftT, type loadingT, type nameProps } from "../../Types";
import { validateAircraft } from '../../utility';
import { UnitContext } from '../../UnitsContext';
import { Subregion } from '@avtac/ui/Layout';
import TemplateBrowser, { extractVariables } from './Export/TemplateBrowser'
import type { templateT } from './Export/apiStructs'
import { generateScopeData, generateTemplate } from './Export/templateParser';

declare module 'react' {
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    command?: 'toggle-popover' | 'show-popover' | 'hide-popover' | 'show-modal' | 'close' | 'request-close' | (string & {});
    commandfor?: string;
  }
}

function ExportHeader({ setTemplate, activeTemplate }: { setTemplate: (arg: string) => void, activeTemplate: string }): ReactNode {
  const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
  const options = templates
    .sort((a, b) => a.data.uuid?.localeCompare(b.data.uuid ?? "") ?? -1)
    .map(t => {
      const duplicated = templates.some(v => v.data.uuid === t.data.uuid && v.data.id !== t.data.id);
      return <option key={t.id} value={t.id}>{t.data.properties.name}{duplicated && ` v${t.data.version}`}</option>
    });
  const [showDialog, setShowDialog] = useState(false);

  function openFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ".hbs";
    input.onchange = function(event) {
      const target = event.target as HTMLInputElement;
      if (!target) return;
      const files = target.files;
      if (!files || files.length > 1) return;
      const fileReader = new FileReader();
      fileReader.readAsText(files[0]);
      fileReader.onload = () => {
        const data: string = fileReader.result as string;
        if (!data) return;

        let newTemplate: templateT = extractVariables(data);
        newTemplate.body = data;

        newTemplate.id = crypto.randomUUID();
        setTemplate(newTemplate.id);
        const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
        const index = templates.findIndex(t => t.id === newTemplate.id);
        if (index < 0) templates.push(newTemplate);
        else templates[index] = newTemplate;
        localStorage.setItem("savedTemplates", JSON.stringify(templates));
      };
    };
    input.click();
    input.remove();
  }

  const deleteButton = () => {
    const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
    const index = templates.findIndex(t => t.id === activeTemplate);
    if (index >= 0) {
      templates.splice(index, 1);
      setTemplate(templates.length > 0 ? (templates[0].id ?? "") : "");
      localStorage.setItem("savedTemplates", JSON.stringify(templates));
    }
  }

  return (
    <Subregion id='exportTitle'>
      <div>
        <h3>Export</h3>
        <select
          id="templateSelect"
          value={activeTemplate}
          onChange={(e) => {
            setTemplate(e.target.value);
          }}>{options}</select>
      </div>
      <div id='exportButtonHolder'>
        {showDialog && <TemplateBrowser setTemplate={setTemplate} />}
        <button onClick={() => { setShowDialog(true) }} command="show-modal" commandfor="templateDownload">Browse Templates</button>
        <button
          id="openFile"
          onClick={openFile}>Upload Template</button>
        <button
          id="deleteButton"
          onClick={deleteButton}>Delete Template</button>
      </div>
    </Subregion>
  )
}

function ManualInputs({ activeTemplate, setUserValues }: { activeTemplate: string, setUserValues: (name: string, value: (string | number | undefined)) => void }): ReactNode {
  const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
  const temp = templates.find(f => f.id === activeTemplate);
  if (!temp || !temp.data.properties.inputs) return <></>
  let inputs = temp.data.properties.inputs;

  if (inputs.length === 0) return <></>;
  return (
    <Subregion>
      <details>
        <summary>Manual Entries</summary>
        <div id='inputsHolder'>
          {inputs.map(input => [
            <div key={input.name + "-manual-input-holder"}>
              <label
                style={{ paddingRight: "4px" }}
                htmlFor={input.name + "-manual-input"}>{input.label}</label>
              {input.type === "select" ?
                <select
                  className="manualInput"
                  id={input.name + "-manual-input"}
                  defaultValue={input.default}
                  onChange={(e) => setUserValues(input.name, e.target.value)} >
                  {input.options?.map(o => <option key={o} value={o}>{o}</option>)})
                </select>
                :
                <input
                  className="manualInput"
                  id={input.name + "-manual-input"}
                  type={input.type}
                  defaultValue={input.default}
                  placeholder={input.label}
                  onChange={(e) => setUserValues(input.name, e.target.value)} />
              }
            </div>
          ])}
        </div>
      </details>
    </Subregion>
  )
}

const styleBase = `
${colorStyle}
${graphStyle}
${diagramStyle}
  :root {
    background-color: grey;
    margin: auto;
    width: fit-content;
    display: grid;
  }
  @media screen {
    :root {
      padding: 1rem;
    }
  }
  body {
    box-sizing: border-box;
    background-color: white;
  }
  #diagram #aircraft {
    fill: none !important;
    stroke: black !important;
    stroke-width: .5% !important;
  }
`

function sanitizeTemplateHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Remove script elements (including sneaky ones inside svg/math)
  doc.querySelectorAll("script").forEach((el) => el.remove());

  // Remove meta elements that contain refresh
  doc.querySelectorAll("meta").forEach((el) => { if (el.getAttribute("http-equiv") && el.getAttribute("http-equiv")?.toLowerCase() === "refresh") el.remove() });

  // Remove inline event handlers (onclick=, onerror=, ...) — these don't
  // cause warnings by themselves, but stripping them closes the door
  doc.body.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
    });
  });

  const meta = doc.createElement("meta");
  meta.setAttribute("http-equiv", "Content-Security-Policy");
  meta.setAttribute("content", "default-src 'none'; connect-src 'self'; style-src 'unsafe-inline' data:; script-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none'; img-src 'none';");
  doc.head.insertBefore(meta, doc.head.firstChild);

  const meta2 = doc.createElement("meta");
  meta2.setAttribute("http-equiv", "Referrer-Policy");
  meta2.setAttribute("content", "no-referrer");
  doc.head.insertBefore(meta2, doc.head.firstChild);

  const style = doc.createElement("style");
  style.innerHTML = styleBase;
  doc.head.appendChild(style);

  return "<!DOCTYPE html>" + doc.documentElement.outerHTML;
}

function openPrintTab(html: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, '_blank');
  if (!tab) return;
  tab.print();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return tab;
}

function CustomIframe({ html }: { html: string }) {

  function fitToContainer() {
    const parent = document.getElementById("iframeHolder");
    const container = document.getElementById("scaleHolder");
    const content = document.getElementById("exportPreview");
    if (!parent || !container || !content) return;

    const containerWidth = container.clientWidth;
    const contentWidth = content.clientWidth;

    // Calculate scale factor based on height
    const scale = Math.min(containerWidth / contentWidth, 1);

    // Apply transform to fit height
    content.style.transform = scale === 1 ? "" : `scale(${scale})`;
    content.style.transformOrigin = scale === 1 ? "" : 'top left';

    const size = content.getBoundingClientRect();
    container.style.height = size.height + "px";
  }

  useEffect(() => {
    window.addEventListener("resize", fitToContainer);
    fitToContainer();
  }, [])

  return (
    <>
      <Subregion id="iframeHolder">
        <button onClick={() => openPrintTab(html)}>Export Form</button>
        <iframe id='exportPreview' srcDoc={html} sandbox=''></iframe>
      </Subregion>
    </>
  )
}

interface exportProps {
  loading: loadingT;
  aircraft: aircraftT;
  selectedOpsConfig: string;
}

export function Export({ loading, aircraft, selectedOpsConfig }: exportProps & nameProps): ReactNode {
  const units = useContext(UnitContext);
  const active: string = localStorage.getItem("activeTemplate") ?? "";
  const [activeTemplate, setTemplate] = useState(active);
  const [userValues, setUserValues] = useState<Record<string, string>>({});
  const [iframeString, setIframeString] = useState("");
  if (validateAircraft(aircraft)) return (<h2 style={{ margin: " 20px auto" }}>Invalid Config</h2>);

  function setTemplateSpecial(tempId: string) {
    localStorage.setItem("activeTemplate", tempId);
    setTemplate(tempId);
  }

  function setUserValuesSpecial(name: string, value: (string | number | undefined)) {
    const tmp = JSON.parse(JSON.stringify(userValues));
    tmp[name] = value;
    setUserValues(tmp);
  }

  useMemo(() => {
    const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
    const temp = templates.find(f => f.id === activeTemplate);
    if (!temp) return;

    if (temp.data.properties.inputs) {
      const tmp: Record<string, string> = {};
      temp.data.properties.inputs.forEach(i => {
        if (i?.default)
          tmp[i.name] = String(i.default)
        else if (i?.type === 'select' && i.options && i.options.length > 0)
          tmp[i.name] = String(i.options[0])
      });
      setUserValues(tmp);
    }

  }, [activeTemplate])

  useMemo(() => {
    const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
    const temp = templates.find(f => f.id === activeTemplate);
    if (!temp) return;

    const globalData = generateScopeData(aircraft, loading, selectedOpsConfig, units, userValues);
    if (!globalData) return;
    setIframeString(sanitizeTemplateHtml(generateTemplate(globalData, temp)));
  }, [activeTemplate, loading, userValues]);

  return (
    <>
      <ExportHeader setTemplate={setTemplateSpecial} activeTemplate={activeTemplate} />

      <ManualInputs activeTemplate={activeTemplate} setUserValues={setUserValuesSpecial} />

      <CustomIframe html={iframeString} />
    </>
  );
}
