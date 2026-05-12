import { normalizeMac } from './normalizeMac';

export interface MacIpParseResult {
  map: Map<string, string>;
  skipped: number;
  duplicates: string[];
}

// F-08: Parse a textual MAC↔IP mapping (typically pasted from Excel — two
// columns separated by TAB or whitespace) into a lookup Map keyed by the
// canonical Cisco dotted MAC. Comment lines (`#`) and blank lines are ignored.
// Lines whose MAC fails normalization are counted as `skipped`. When the same
// MAC appears twice, the *last* value wins and the MAC is appended to
// `duplicates` so the UI can surface a warning.
//
// IP format validation is intentionally lenient in v0.3 (presence only): any
// non-empty second token is accepted and we never reject the row for that.
// Stricter IPv4 validation is deferred per docs/improvement-plan-v0.3.md §5.10.
export function parseMacIpMapping(text: string): MacIpParseResult {
  const map = new Map<string, string>();
  const duplicates: string[] = [];
  let skipped = 0;

  if (!text || !text.trim()) {
    return { map, skipped, duplicates };
  }

  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#')) continue;

    // TAB is the canonical separator when the mapping is pasted from Excel
    // and must take precedence: a MAC may legitimately contain internal
    // spaces (e.g. `aabb cc00 0100`) which a pure whitespace split would
    // corrupt. When no TAB is present, fall back to splitting at the last
    // whitespace run so any of `mac IP`, `mac  IP`, `aa bb cc ... IP` work.
    let macRaw: string | null = null;
    let ip = '';
    const tabIdx = line.indexOf('\t');
    if (tabIdx >= 0) {
      macRaw = line.slice(0, tabIdx).trim();
      ip = line.slice(tabIdx + 1).trim();
    } else {
      const m = /^(.+?)\s+(\S+)$/.exec(line);
      if (m) {
        macRaw = m[1].trim();
        ip = m[2].trim();
      }
    }

    if (!macRaw || !ip) {
      skipped++;
      continue;
    }

    const mac = normalizeMac(macRaw);
    if (!mac) {
      skipped++;
      continue;
    }

    if (map.has(mac)) {
      duplicates.push(mac);
    }
    map.set(mac, ip);
  }

  return { map, skipped, duplicates };
}
