export interface InterfaceStatusRow {
  port: string;
  name: string;
  status: string;
  vlan: string;
  duplex: string;
  speed: string;
  type: string;
}

export interface MacEntry {
  vlan: string;
  mac: string;
  type: string;
  port: string;
}

export interface ResultRow {
  port: string;
  status: string;
  vlan: string;
  duplex: string;
  speed: string;
  type: string;
  mac: string;
  ip: string; // F-08: filled from MacIpMap when available, otherwise empty.
}

// F-08: A single MAC↔IP mapping entry. `mac` is always the Cisco dotted
// canonical form (lowercase, three 4-hex groups separated by `.`).
export interface MacIpEntry {
  mac: string;
  ip: string;
}

export interface CombineStats {
  portCount: number;
  macCount: number;
  rowCount: number;
  intStatusSkipped: number;
  macTableSkipped: number;
  ipMappedCount: number; // F-08: number of result rows where ip is non-empty
  ipMapSize: number; // F-08: number of unique MACs in the supplied mapping
}

export interface CombineOptions {
  // F-08: optional MAC → IP lookup. Keys are canonical Cisco dotted MACs.
  macIpMap?: Map<string, string>;
}

export interface CombineResult {
  rows: ResultRow[];
  stats: CombineStats;
  warnings: string[];
}
