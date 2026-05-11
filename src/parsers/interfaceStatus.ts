import type { InterfaceStatusRow } from './types';
import { normalizePortName } from './portName';

const HEADER_KEYWORDS = ['Port', 'Name', 'Status', 'Vlan', 'Duplex', 'Speed', 'Type'] as const;
type HeaderName = (typeof HEADER_KEYWORDS)[number];

interface Column {
  name: HeaderName;
  start: number;
  end: number;
}

function detectColumns(headerLine: string): Column[] {
  const positions = HEADER_KEYWORDS
    .map((name) => ({ name, start: headerLine.indexOf(name) }))
    .filter((p) => p.start >= 0)
    .sort((a, b) => a.start - b.start);

  return positions.map((p, idx) => ({
    name: p.name,
    start: p.start,
    end: idx + 1 < positions.length ? positions[idx + 1].start : Number.MAX_SAFE_INTEGER,
  }));
}

function isHeaderLine(line: string): boolean {
  return /\bPort\b/.test(line) && /\bStatus\b/.test(line) && /\bVlan\b/.test(line) && /\bDuplex\b/i.test(line);
}

function isSeparator(line: string): boolean {
  return /^[\s\-=]+$/.test(line);
}

export function parseInterfaceStatus(text: string): { rows: InterfaceStatusRow[]; skipped: number } {
  const lines = text.split(/\r?\n/);
  const rows: InterfaceStatusRow[] = [];
  let skipped = 0;

  let headerIdx = -1;
  let cols: Column[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isHeaderLine(lines[i])) {
      headerIdx = i;
      cols = detectColumns(lines[i]);
      break;
    }
  }

  if (headerIdx < 0 || cols.length < 4) {
    return { rows, skipped };
  }

  const getCol = (line: string, name: HeaderName): string => {
    const col = cols.find((c) => c.name === name);
    if (!col) return '';
    const end = Math.min(col.end, line.length);
    if (col.start >= line.length) return '';
    return line.substring(col.start, end).trim();
  };

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (isSeparator(line)) continue;
    if (isHeaderLine(line)) continue;

    const port = getCol(line, 'Port');
    if (!port) {
      skipped++;
      continue;
    }

    rows.push({
      port: normalizePortName(port),
      name: getCol(line, 'Name'),
      status: getCol(line, 'Status'),
      vlan: getCol(line, 'Vlan'),
      duplex: getCol(line, 'Duplex'),
      speed: getCol(line, 'Speed'),
      type: getCol(line, 'Type'),
    });
  }

  return { rows, skipped };
}
