import type { MacEntry } from './types';
import { INTERFACE_REGEX, normalizePortName } from './portName';

const MAC_REGEX = /\b([0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4})\b/;
const TYPE_REGEX = /\b(DYNAMIC|STATIC|SECURE|DYNAMIC_LEARN|dynamic|static|secure)\b/;

const EXCLUDED_PORT_KEYWORDS = ['CPU', 'Drop', 'Router'];

function isExcludedPort(port: string): boolean {
  return EXCLUDED_PORT_KEYWORDS.some((kw) => new RegExp(`^${kw}$`, 'i').test(port));
}

function parseMacLine(line: string): MacEntry | null {
  const macMatch = MAC_REGEX.exec(line);
  if (!macMatch) return null;
  const mac = macMatch[1].toLowerCase();
  const before = line.substring(0, macMatch.index);
  const after = line.substring(macMatch.index + macMatch[0].length);

  // VLAN: last whitespace-separated token in `before` (strip optional leading `*` flag)
  const beforeClean = before.replace(/^\s*\*\s*/, '').trim();
  const beforeTokens = beforeClean.length > 0 ? beforeClean.split(/\s+/) : [];
  const vlan = beforeTokens.length > 0 ? beforeTokens[beforeTokens.length - 1] : '';

  // Port: last interface-like token in `after`
  let port = '';
  let portMatch: RegExpExecArray | null;
  INTERFACE_REGEX.lastIndex = 0;
  while ((portMatch = INTERFACE_REGEX.exec(after)) !== null) {
    port = portMatch[0];
  }
  INTERFACE_REGEX.lastIndex = 0;

  if (!port) return null;
  if (isExcludedPort(port)) return null;

  // Type: try regex match in `after` (between MAC and port)
  const typeMatch = TYPE_REGEX.exec(after);
  const type = typeMatch ? typeMatch[1].toUpperCase() : '';

  return {
    vlan,
    mac,
    type,
    port: normalizePortName(port),
  };
}

function isHeaderLine(line: string): boolean {
  return /\bvlan\b/i.test(line) && /\bmac\s*address\b/i.test(line) && /\bports?\b/i.test(line);
}

export function parseMacAddressTable(text: string): { entries: MacEntry[]; skipped: number } {
  const lines = text.split(/\r?\n/);
  const entries: MacEntry[] = [];
  let skipped = 0;

  let started = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!started) {
      if (isHeaderLine(line)) started = true;
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^[\s\-=+|]+$/.test(line)) continue;
    if (/^total mac addresses/i.test(trimmed)) continue;
    if (isHeaderLine(line)) continue;

    if (!MAC_REGEX.test(line)) continue;

    const entry = parseMacLine(line);
    if (!entry) {
      skipped++;
      continue;
    }

    if (entry.port === 'CPU' || /^CPU$/i.test(entry.port)) continue;

    entries.push(entry);
  }

  // If no header was detected, try parsing every line that looks like a MAC entry (best-effort)
  if (!started) {
    for (const line of lines) {
      if (!MAC_REGEX.test(line)) continue;
      const entry = parseMacLine(line);
      if (entry) entries.push(entry);
    }
  }

  return { entries, skipped };
}
