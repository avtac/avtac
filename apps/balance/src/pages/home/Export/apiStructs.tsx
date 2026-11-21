
export interface templateT {
  id?: string;
  data: fileDatabaseDataT;
  body: string;
}

///////////////////////////
// API Structs
///////////////////////////

export interface templateInputPropertiesT {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  default?: string | number;
  options?: string[]; // for "select"
}

export interface templatePropertiesT {
  fileName: string;
  name: string;
  description: string;
  size: ("Letter" | "A4" | "Legal");
  inputs: templateInputPropertiesT[];
  uses: string;
  limits: string[]; // List of names of limits that are used
  regions: string[]; // List of names of regions that are used
}

const defaultProperties: templatePropertiesT = {
  fileName: "",
  name: "Not Found",
  description: "",
  size: "Letter",
  uses: "",
  inputs: [],
  limits: [],
  regions: []
}

export interface fileDatabaseDataT {
  name: string;
  id: number;
  uuid: string;
  version: number;
  versions: number[];
  downloads: number;
  likes: number;
  dateCreated: number;
  owned: boolean;
  liked: boolean;
  contentHash: string;
  tags: string[];
  properties: templatePropertiesT;
}

const defaultDatabaseData: fileDatabaseDataT = {
  name: "Not Found",
  id: -1,
  uuid: "",
  version: -1,
  versions: [],
  downloads: -1,
  likes: -1,
  dateCreated: -1,
  owned: false,
  liked: false,
  contentHash: "",
  tags: [],
  properties: defaultProperties,
}

export function createDatabaseData(options?: Partial<fileDatabaseDataT>): fileDatabaseDataT {
  return {
    ...defaultDatabaseData,
    ...options,
  };
}

export interface fileDatabaseListT {
  data: fileDatabaseDataT[];
  authorized: boolean;
  maxOffset: number;
  pageSize: number;
}

export function defaultFileDatabaseList(): fileDatabaseListT {
  return { data: [], authorized: false, maxOffset: 0, pageSize: 5 }
}

export type SortOptions = ("likes" | "downloads" | "age")

export interface ListOptionsT {
  ownedOnly: boolean;
  count: number;
  offset: number;
  sortBy: SortOptions;
  sortDir: ("a" | "d");
  search: string;
}

