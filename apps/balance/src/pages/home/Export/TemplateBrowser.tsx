import { validate as uuidValidate } from 'uuid';
import { useTransition, useEffect, useRef, useState, type RefObject, type ReactNode } from "react";
import { Subregion } from '@avtac/ui/Layout';
import { createDatabaseData, defaultFileDatabaseList, type fileDatabaseDataT, type fileDatabaseListT, type ListOptionsT, type SortOptions, type templateT } from './apiStructs';
import { getListRequest, likeRequest } from './api';
import TemplateDetails, { SendFileInput } from './TemplateDetails';

///////////////////////////
// Helpers
///////////////////////////

// function isDownloaded(id: number): boolean {
//   const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
//   const found = templates.some(t => t.data.id === id);
//   return found;
// }

export function extractVariables(source: string): templateT {
  // If using the comment-header approach:
  const match = source.match(/^<!--\s*(\{[\s\S]*?\})\s*-->/m);
  if (!match) return { body: "", data: createDatabaseData() };
  const props = JSON.parse(match[1]);
  const template: templateT = { body: source, data: createDatabaseData({ properties: props }) };
  return template;
}

// State
// -1: not downloaded
// >=0: version
// Returns the newest version of a file saved locally
function newestSavedVersion(uuid: string): number {
  const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");
  const found = templates.some(t => t.data.uuid === uuid);
  if (!found) return -1;
  const newest = templates.reduce((m, t) => t.data.uuid === uuid ? Math.max(t.data.version, m) : m, 0);
  return newest;
}

interface TemplateListItemProps {
  data: fileDatabaseDataT,
  handleDetails: (arg0: string) => void,
  refresh: () => void
}

function TemplateListItem({ data, handleDetails, refresh }: TemplateListItemProps): ReactNode {
  const tags = data.tags ? data.tags
    .sort((a, b) => a.localeCompare(b))
    .map(t => {
      const check = (document.getElementById('searchTemplates') as HTMLInputElement)?.value.toLowerCase() ?? "";
      const match = t.toLowerCase().includes(check) && check != "";
      return <p className={"templateTag" + (match ? " match" : "")} key={t}>{t}</p>
    }) : <></>

  const foundVersion = newestSavedVersion(data.uuid);
  const downloaded = foundVersion > 0;
  const newest = foundVersion === data.version;
  return (
    <Subregion key={data.uuid} className={'exportStoreEntry'} onClick={() => handleDetails(data.uuid)} >
      <div>
        <h5>Name{downloaded && <span className="savedTag">Saved</span>}{downloaded && !newest && " v" + foundVersion}{data.owned && <span className="ownerTag">Owner</span>}</h5>
        <p>{data.name}{downloaded && !newest && " v" + data.version}</p>
      </div>
      <div className='tagHolder'>
        {data?.tags?.length > 0 && tags}
      </div>
      <div className='counts'>
        <div>
          <p>{data.downloads.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })}</p>
          <p>{data.likes.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })}</p>
        </div>
        <div>
          <p><i className='fa-solid fa-download'></i></p>
          <p
            onClick={e => {
              e.stopPropagation();
              e.currentTarget.classList.toggle('template-pending');
              likeRequest(data.uuid).then(_ => refresh())
            }}
            className={data.liked ? 'template-liked' : ''}>
            <i className='fa-solid fa-heart'></i>
          </p>
        </div>
      </div>
    </Subregion>
  )
}

interface templateBrowserProps {
  setTemplate: (argv: string) => void;
}

function TemplateBrowser({ setTemplate }: templateBrowserProps): ReactNode {
  const ownedRef: RefObject<(null | HTMLInputElement)> = useRef(null);
  const isMounted = useRef(false);
  const [isPending, startTransition] = useTransition()
  const [databaseData, setDatabaseData] = useState(defaultFileDatabaseList());
  const [offset, setOffset] = useState(0);
  const [showDetails, setShowDetails] = useState("")
  const [showSearch, setShowSearch] = useState(false)

  const totalPages = databaseData.pageSize != 0 ? Math.floor((databaseData.maxOffset - 1) / databaseData.pageSize) + 1 : 1;
  function nextPage() {
    const newOffset = Math.min(offset + databaseData.pageSize, Math.max((totalPages - 1) * databaseData.pageSize, 0));
    if (newOffset === offset) return;
    setOffset(newOffset);
  }

  function prevPage() {
    const newOffset = Math.max(offset - databaseData.pageSize, 0);
    if (newOffset === offset) return;
    setOffset(newOffset);
  }

  function refresh() {
    startTransition(async () => {
      try {
        const owned = (document.getElementById('showOwned') as HTMLInputElement)?.checked ?? false
        const sortDir = (document.getElementById('sortDirectionCheckbox') as HTMLInputElement)?.checked ?? false
        const sortBy = (document.getElementById('sortBy') as HTMLInputElement)?.value as SortOptions ?? "likes" as SortOptions
        const search = (document.getElementById('searchTemplates') as HTMLInputElement)?.value ?? ""
        const options: ListOptionsT = { offset: offset, count: 5, ownedOnly: owned, sortBy: sortBy, search: search, sortDir: sortDir ? "a" : "d" }
        const d: fileDatabaseListT = await getListRequest(options);
        setDatabaseData(d);
      } catch (err) {
        setDatabaseData({ maxOffset: databaseData.maxOffset, authorized: false, pageSize: databaseData.pageSize, data: [] });
      }
    })
  };

  useEffect(() => {
    if (isMounted.current) refresh();
    else isMounted.current = true;
  }, [offset]);

  function handleDetails(uuid: string) {
    setShowDetails(uuid);
    // Refresh when returning to main list
    if (!uuidValidate(uuid)) {
      refresh();
    }
  }

  const blocks = databaseData.data ? databaseData.data.map(v => <TemplateListItem data={v} handleDetails={handleDetails} refresh={refresh} />) : <></>;

  const sortOptions = ["Likes", "Downloads", "Age"].map(v => <option key={v} value={v.toLowerCase()}>{v}</option>)
  const showInfo = uuidValidate(showDetails);
  const sortDir = ((document.getElementById("sortDirectionCheckbox") as HTMLInputElement)?.checked ?? false) ? <i title="Sort Descending" className="fa-solid fa-arrow-down-short-wide"></i> : <i title="Sort Ascending" className="fa-solid fa-arrow-down-wide-short"></i>;
  // TODO: Cache a few template details to reduce requests
  return (
    <>
      <dialog
        id='templateDownload'
        onCancel={() => handleDetails("")}
        closedby='any'>
        <div id='templateDownloadDialog'>
          <h2 style={{ marginLeft: "14px" }}>Template Browser</h2>
          <button command='close' commandfor='templateDownload' style={{ position: "absolute", top: "5px", right: "5px", fontSize: "1.2rem" }} className='fa-solid fa-x'></button>
          <div id='templateDownloadDialogTop'>
            {showInfo && <button onClick={() => handleDetails("")}><i className='fa-solid fa-arrow-left'></i></button>}
            {
              !showInfo && <>
                <div>
                  {databaseData.authorized &&
                    <button className={ownedRef.current?.checked ? 'pressed' : ''} onClick={e => { ((e.currentTarget as HTMLButtonElement)?.firstChild as HTMLInputElement)?.click(); setOffset(0); }}>
                      <input ref={ownedRef} hidden type='checkbox' id='showOwned' onChange={refresh} />
                      <b>Owned</b>
                    </button>
                  }
                </div>
                <div id="right">
                  <select id="sortBy" onChange={refresh}>{sortOptions}</select>
                  <div>
                    <button onClick={() => { (document.getElementById("sortDirectionCheckbox") as HTMLInputElement).click() }}>{sortDir}</button>
                    <input hidden type='checkbox' id='sortDirectionCheckbox' onChange={refresh} />
                  </div>
                  <button title="Search" onClick={() => setShowSearch(!showSearch)} className={showSearch ? "pressed" : ""}><i className="fa-solid fa-magnifying-glass"></i></button>
                  {SendFileInput("Upload Template", databaseData.authorized, undefined, () => { refresh() })}
                  <button title="Refresh" onClick={refresh} className={isPending ? 'spinning' : ''}><i className="fa-solid fa-arrows-rotate"></i></button>
                </div>
              </>
            }
          </div>
          {!showInfo && showSearch && <input type='text' id='searchTemplates' placeholder='Search' onKeyDown={e => { if (e.key === 'Enter') { refresh(); setOffset(0); } }} onBlur={e => { if (e.target.value == "") setShowSearch(false) }} />}
          <div id='templateDownloadDialogMiddle'>
            {!showInfo && databaseData && blocks}
            {showInfo && <TemplateDetails setTemplate={setTemplate} closeDetails={() => handleDetails("")} templateUuid={showDetails} />}
          </div>
          <div id='templateDownloadDialogBottom'>
            <input style={{ width: "23rem" }} className={databaseData.authorized ? 'authorized' : ''} type='text' id='apiKeyInput' placeholder='Enter API Key' onBlur={refresh} />
            {!showInfo &&
              <>
                <div id='directionArrows'>
                  <button disabled={offset === 0} onClick={prevPage}><i className='fa-solid fa-arrow-left'></i></button>
                  <span>{databaseData.pageSize != 0 ? Math.floor(offset / databaseData.pageSize) + 1 : 0} / {totalPages}</span>
                  <button disabled={offset / databaseData.pageSize >= totalPages - 1} onClick={nextPage}><i className='fa-solid fa-arrow-right'></i></button>
                </div>
              </>}
          </div>
        </div>
      </dialog>
    </>
  )
}

export default TemplateBrowser;
