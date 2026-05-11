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
}

export interface CombineStats {
  portCount: number;
  macCount: number;
  rowCount: number;
  intStatusSkipped: number;
  macTableSkipped: number;
}

export interface CombineResult {
  rows: ResultRow[];
  stats: CombineStats;
  warnings: string[];
}
