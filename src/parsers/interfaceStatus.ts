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

  return positions.map((p, idx) => {
    // B-03: Cisco IOS prints the Speed column right-aligned to the header
    // keyword "Speed" (5 chars). Values longer than 5 chars (e.g. `a-1000`)
    // start one column to the LEFT of the keyword's 'S', so using
    // indexOf('Speed') as the column's left edge drops the leading 'a' and
    // yields `-1000` — which Excel then interprets as the number -1000.
    // Extend Speed's start back to the previous keyword's right edge + 1.
    let start = p.start;
    if (p.name === 'Speed' && idx > 0) {
      const prev = positions[idx - 1];
      const prevKeywordEnd = prev.start + prev.name.length;
      start = Math.min(p.start, prevKeywordEnd + 1);
    }
    return {
      name: p.name,
      start,
      end: idx + 1 < positions.length ? positions[idx + 1].start : Number.MAX_SAFE_INTEGER,
    };
  });
}

function isHeaderLine(line: string): boolean {
  return /\bPort\b/.test(line) && /\bStatus\b/.test(line) && /\bVlan\b/.test(line) && /\bDuplex\b/i.test(line);
}

function isSeparator(line: string): boolean {
  return /^[\s\-=]+$/.test(line);
}

export function parseInterfaceStatus(text: string): { rows: InterfaceStatusRow[]; skipped: number } {
  // B-01: SecureCRT/PuTTY may collapse runs of spaces into a single TAB on
  // clipboard. That makes data lines shorter than the header and lets adjacent
  // column content leak into Speed (e.g. `a-1000` → `a` + `-1000` two cells in
  // Excel). Normalize tabs to two spaces before computing header positions so
  // the fixed-width substring approach stays aligned.
  const normalized = text.replace(/\t/g, '  ');
  const lines = normalized.split(/\r?\n/);
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
    const raw = line.substring(col.start, end).trim();
    // B-01: Name is the only column that legitimately contains internal
    // whitespace. Every other column (Status / Vlan / Duplex / Speed / Type)
    // is a single token — collapse to the first whitespace-separated token
    // to drop any leakage from boundary drift.
    if (name === 'Name') return raw;
    if (!raw) return '';
    return raw.split(/\s+/)[0] ?? '';
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
