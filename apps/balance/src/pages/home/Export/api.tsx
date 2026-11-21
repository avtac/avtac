import { sha256 } from '../../../utility';
import type { fileDatabaseDataT, ListOptionsT, templateT } from './apiStructs';
import { extractVariables } from './TemplateBrowser';

const baseURL = ''

///////////////////////////
// API Fetch functions
///////////////////////////

export async function showStatus(resp: Response) {
  const warn = document.getElementById("download-warning-message");
  if (resp.status < 500 && resp.status >= 400 && warn) {
    const text = await resp.text()
    warn.innerText = text;
    setTimeout(() => warn.innerText = "", 4000)
  }
  if (resp.status >= 500 && warn) {
    warn.innerText = "Can't connect to server";
    setTimeout(() => warn.innerText = "", 4000)
  }
}

export async function addFile(setTemplate: (arv0: string) => void, fileInfo: fileDatabaseDataT) {
  const templates: templateT[] = JSON.parse(localStorage.getItem("savedTemplates") ?? "[]");

  // Determine if the file has already been downloaded
  const index = templates.findIndex(t => t.data.id === fileInfo.id);
  if (index < 0) {
    const keyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
    const resp = await fetch(`${baseURL}/api/files/${fileInfo.uuid}/versions/${fileInfo.version}/download`, {
      headers: {
        "Authorization": `Bearer ${keyInput.value}`
      }
    })
    showStatus(resp);
    const fileString = await resp.text()

    // Confirm the sent hash matches the content hash
    // Crypto is only available in https environments
    if (crypto.subtle) {
      const sentHash = resp.headers.get("Content-SHA256");
      const contentHash = await sha256(fileString);
      // TODO: Actually do something if this fails
      if (contentHash != sentHash)
        console.warn("File content does not match hash");
    }
    let newTemplate: templateT = extractVariables(fileString);
    newTemplate.data = fileInfo;
    if (newTemplate.data.name == "") return;
    if (crypto.randomUUID)
      newTemplate.id = crypto.randomUUID(); // Client unique id for every template
    else newTemplate.id = String(Math.round(Math.random() * 1e12));

    templates.push(newTemplate);
    setTemplate(newTemplate.id);
    localStorage.setItem("savedTemplates", JSON.stringify(templates));
  } else {
    // TODO: Should this be done if there is an update
    // templates[index] = newTemplate;
    templates[index].id && setTemplate(templates[index].id);
  }
}

export function sendFile(e: React.ChangeEvent<HTMLInputElement>, fileInfo: (fileDatabaseDataT | undefined)) {
  if (!e.target.files || e.target.files.length == 0) return;
  const file = e.target.files[0];
  const keyInput = document.getElementById('apiKeyInput') as HTMLInputElement;

  const formData: FormData = new FormData();
  formData.append("file", file);
  formData.append("uuid", fileInfo?.uuid ?? "");

  return fetch(`${baseURL}/api/files`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${keyInput?.value ?? ""}`
    },
    body: formData
  });
}

export async function detailsRequest(uuid: string, version: number = -1): Promise<any> {
  const keyInput = document.getElementById('apiKeyInput') as HTMLInputElement;

  const resp = await fetch(`${baseURL}/api/files/${uuid}/versions/${version}`, {
    headers: {
      "Authorization": `Bearer ${keyInput.value}`
    }
  })

  showStatus(resp);

  // Expects a json of fileDatabaseDataT
  return resp.json();
}

export function likeRequest(fileUuid: string): Promise<Response> {
  const keyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
  return fetch(`${baseURL}/api/files/${fileUuid}/like`, {
    headers: {
      "Authorization": `Bearer ${keyInput.value}`
    },
    method: 'PATCH'
  })
}

export function deleteRequest(data: fileDatabaseDataT): Promise<Response> {
  const keyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
  return fetch(`${baseURL}/api/files/${data.uuid}/versions/${data.version}`, {
    headers: {
      "Authorization": `Bearer ${keyInput.value}`
    },
    method: 'DELETE'
  })
}

export async function getListRequest(options: ListOptionsT): Promise<any> {
  // TODO: Limit request rate
  const keyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
  const search = encodeURIComponent(options.search)

  const resp = await fetch(`${baseURL}/api/files?offset=${options.offset}&count=${options.count}&ownedOnly=${options.ownedOnly}&sort=${options.sortBy}&sortDir=${options.sortDir}&search=${search}`, {
    headers: {
      "Authorization": `Bearer ${keyInput.value}`
    }
  });
  showStatus(resp);
  const json = await resp.json();
  return json;
}

export function downloadFile(fileUuid: string, version: number, filename: string) {
  const link = document.createElement('a');
  link.href = `${baseURL}/api/files/${fileUuid}/versions/${version}/download`;
  link.download = filename; // Specifies the saved filename
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link); // Cleanup
}

export function deleteTag(fileId: number, tag: string) {
  const keyInput = document.getElementById('apiKeyInput') as HTMLInputElement;

  return fetch(`${baseURL}/api/files/tag`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${keyInput.value}`
    },
    body: JSON.stringify({ "fileId": fileId, "tag": [tag] })
  });
}

export function addTag(fileId: number, tag: string) {
  const keyInput = document.getElementById('apiKeyInput') as HTMLInputElement;

  return fetch(`${baseURL}/api/files/tag`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${keyInput.value}`
    },
    body: JSON.stringify({ "fileId": fileId, "tag": [tag] })
  });
}

export function generateKey() {
  return fetch(`${baseURL}/api/auth/generate`);
}
