import dayjs from 'dayjs';
import { validate as uuidValidate } from 'uuid';
import { useTransition, useEffect, useState, type ReactNode } from "react";
import { Subregion } from '@avtac/ui/Layout';
import { createDatabaseData, type fileDatabaseDataT } from './apiStructs';
import { addFile, addTag, deleteTag, detailsRequest, downloadFile, likeRequest, sendFile } from './api';

export const SendFileInput = (text: string, data: (fileDatabaseDataT | undefined), postExecute: (resp: Response) => void) => (
  <button title={text} onClick={e => { const target = e.currentTarget as HTMLButtonElement; target.firstChild instanceof HTMLInputElement ? target.firstChild.click() : undefined; }}>
    <input hidden accept=".hbs" type="file" onChange={(e) => sendFile(e, data)?.then(resp => postExecute(resp))}></input>
    <i className='fa-solid fa-file-arrow-up'></i>
  </button>
)

interface TemplateDetailsProps {
  closeDetails: () => void;
  setTemplate: (argv: string) => void;
  templateUuid: string;
}

function TemplateDetails({ closeDetails, setTemplate, templateUuid }: TemplateDetailsProps): ReactNode {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(undefined as (fileDatabaseDataT | undefined));
  const [addingTag, setAddingTag] = useState(false);
  const [selectVersion, setSelectVersion] = useState(false);

  function loadData() {
    if (!uuidValidate(templateUuid)) {
      setData(createDatabaseData());
      return;
    }
    // TODO: OPTIMIZATION: store data received so requests can be reduced
    startTransition(async () => {
      const d = await detailsRequest(templateUuid);
      setData(createDatabaseData(d));
    })
  }

  useEffect(() => {
    loadData()
  }, []);

  const submitInput = (element: HTMLInputElement) => {
    setAddingTag(false);
    if (element.value == "" || !data) {
      return;
    }
    if (data.tags) {
      data.tags.push(element.value.toUpperCase());
      data.tags.sort((a, b) => a.localeCompare(b));
    }
    else
      data.tags = [element.value.toUpperCase()];
    addTag(data.id ?? -1, element.value)
      .then(_ => loadData());
  }

  const tag = (t: string) => {
    return <div
      className="templateTag"
      key={t}>
      <p>{t}</p>
      {data?.owned &&
        <p
          className={'fa-solid fa-x'}
          onClick={e => {
            e.preventDefault();
            if (data?.owned && e.button === 0) {
              const element = e.target as HTMLParagraphElement;
              element.parentElement?.classList.add("removing");
              {/*                       IS there a way to make this vvvvvvv not just be the text */ }
              const string = element.parentElement?.childNodes[0].textContent?.trim() ?? ""
              deleteTag(data?.id ?? 1, string)
                .then(resp => {
                  if (!resp.ok) {
                    element.parentElement?.classList.remove("removing");
                  } else loadData();
                })
                .catch(_ => element.parentElement?.classList.remove("removing"));
            }
          }}>
        </p>
      }
    </div>
  }

  const versionOptions = data?.versions?.map(v => <option value={v} key={v}>v{v}</option>) ?? [];

  const showTags = ((data?.tags && data.tags.length > 0) || data?.owned) ?? false
  return (
    <Subregion className='templateDetails'>
      {uuidValidate(templateUuid) && !data && isPending && <p className={'spinning'}><i className="fa-solid fa-arrows-rotate"></i></p>}
      {uuidValidate(templateUuid) && data &&
        <>
          <div>
            <div className='detailsTitle'>
              <h3>{data.properties.name}</h3>
              <span className={data.versions.length > 1 ? 'clickable' : ''} onClick={_ => setSelectVersion(data.versions.length > 1 && !selectVersion)}>{data.version >= 0 && " v" + data.version}</span>
              {selectVersion && data.versions.length > 1 &&
                <select
                  id="selectDetailVersion"
                  value={data.version}
                  onBlur={_ => setSelectVersion(false)}
                  onChange={e => detailsRequest(data.uuid, Number((e.target as HTMLSelectElement).value)).then(d => setData(d))}>
                  {versionOptions}
                </select>}
            </div>

            {showTags && <div className='tagHolder'>
              {data.tags && data.tags.sort((a, b) => a.localeCompare(b)).map(t => tag(t))}
              {data.owned && !addingTag && <button className='templateTag fa-solid fa-plus' onClick={() => setAddingTag(true)}></button>}
              {data.owned && addingTag &&
                <input
                  autoFocus={true}
                  type='text'
                  id='newTagInput'
                  onKeyDown={e => { if (e.key === "Enter") submitInput(e.target as HTMLInputElement) }}
                  onBlur={e => submitInput(e.target as HTMLInputElement)}
                />}
            </div>}
            {data.dateCreated > 0 && <><p>Last Updated: {dayjs(data.dateCreated).format('MM/DD/YYYY')}</p></>}
            {data.properties.description !== "" && <p className='description'>{data.properties.description}</p>}
            {data.properties.inputs && data.properties.inputs.length > 0 &&
              <div>
                <h4>Inputs</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.properties.inputs.map(v => {
                      return (
                        <tr key={v.name}>
                          <td>{v.label}</td>
                          <td>{v.type}</td>
                          <td>{v.options && v.options.join(", ")}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            }
            {data.properties.limits && data.properties.limits.length > 0 &&
              <div>
                <h4>Limits</h4>
                {data.properties.limits.map(v => <p key={v}>{v}</p>)}
              </div>
            }
            {data.properties.regions && data.properties.regions.length > 0 &&
              <div>
                <h4>Regions</h4>
                {data.properties.regions.map(v => <p key={v}>{v}</p>)}
              </div>
            }
            {data.contentHash != "" && <details><summary><h4>SHA256</h4></summary><p style={{ wordBreak: "break-all" }}> {data.contentHash}</p></details>}
          </div>
          <div className='buttons'>
            {data.owned && SendFileInput("Upload New Version", data, closeDetails)}
            <button
              title="Download File"
              onClick={() => { downloadFile(templateUuid, data.version, data.name + ".hbs") }}>
              <i className="fa-solid fa-file-arrow-down"></i>
            </button>
            <button
              title="Get File"
              onClick={() => { addFile(setTemplate, data); closeDetails(); }}>
              <i className="fa-solid fa-plus"></i>
            </button>
            <button
              title="Like"
              className={data.liked ? 'template-liked' : ''}
              onClick={e => { e.currentTarget.classList.toggle("template-liked"); likeRequest(templateUuid); }}>
              <i className="fa-solid fa-heart"></i>
            </button>
          </div>
        </>
      }
    </Subregion>
  )
}

export default TemplateDetails;
