// U-01: Auto-split a combined paste of `show interfaces status` and
// `show mac address-table` into two segments based on well-known boundary
// markers. The split must work in both orders (int-status → mac-table and
// vice versa) and tolerate Cisco IOS abbreviation + output filter pipes.
//
// Marker reliability (highest → lowest):
//   1. mac-address-table header box      : `^\s*Mac Address Table\s*$`
//   2. mac-address-table column header   : `^\s*Vlan\s+Mac\s+Address\s+Type\s+Ports\s*$`
//   3. command line (abbrev. + pipe ok)  : `^\s*\S+#\s*sh(?:ow)?\s+mac(?:\s+\S+)*\s*$`
// Symmetric markers exist for `sh int status` so both possible orders can be
// detected without ambiguity. See docs/improvement-plan-v0.3.md §4.

const MAC_HEADER_BOX = /^\s*Mac Address Table\s*$/;
const MAC_COLUMN_HEADER = /^\s*Vlan\s+Mac\s+Address\s+Type\s+Ports\s*$/i;
const MAC_COMMAND_LINE = /^\s*\S+#\s*sh(?:ow)?\s+mac(?:\s+\S+)*\s*$/;

const INT_COMMAND_LINE = /^\s*\S+#\s*sh(?:ow)?\s+int(?:erfaces?)?\s+status\b/;
const INT_COLUMN_HEADER = /^\s*Port\s+Name\s+Status\s+Vlan\s+Duplex\s+Speed\s+Type\s*$/;

export interface SplitResult {
  intStatus: string;
  macTable: string;
  splitFound: boolean;
}

interface MarkerHit {
  kind: 'int' | 'mac';
  lineIdx: number;
  priority: number; // lower number = more reliable, used when ties occur
}

/**
 * Scan once for the first occurrence of each kind of marker; the line indexes
 * of those two hits determine the boundary. The earlier marker decides which
 * segment comes first.
 */
export function splitCombinedInput(text: string): SplitResult {
  const lines = text.split(/\r?\n/);

  let intHit: MarkerHit | null = null;
  let macHit: MarkerHit | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (intHit === null) {
      if (INT_COMMAND_LINE.test(line)) intHit = { kind: 'int', lineIdx: i, priority: 3 };
      else if (INT_COLUMN_HEADER.test(line)) intHit = { kind: 'int', lineIdx: i, priority: 2 };
    }
    if (macHit === null) {
      if (MAC_COMMAND_LINE.test(line)) macHit = { kind: 'mac', lineIdx: i, priority: 3 };
      else if (MAC_HEADER_BOX.test(line)) macHit = { kind: 'mac', lineIdx: i, priority: 1 };
      else if (MAC_COLUMN_HEADER.test(line)) macHit = { kind: 'mac', lineIdx: i, priority: 2 };
    }
    if (intHit && macHit) break;
  }

  // Neither segment can be located → caller treats the whole text as int-status
  // (legacy fallback) and surfaces a warning.
  if (!intHit && !macHit) {
    return { intStatus: text, macTable: '', splitFound: false };
  }

  // Only one marker present → trust it and put the rest in the other segment.
  if (intHit && !macHit) {
    return { intStatus: text, macTable: '', splitFound: false };
  }
  if (macHit && !intHit) {
    // Whole input looks like mac-table only.
    return { intStatus: '', macTable: text, splitFound: false };
  }

  // Both markers present → cut at the later marker so its segment owns
  // everything from that marker to the end.
  const first = intHit!.lineIdx < macHit!.lineIdx ? intHit! : macHit!;
  const second = intHit!.lineIdx < macHit!.lineIdx ? macHit! : intHit!;

  const firstText = lines.slice(first.lineIdx, second.lineIdx).join('\n');
  const secondText = lines.slice(second.lineIdx).join('\n');

  if (first.kind === 'int') {
    return { intStatus: firstText, macTable: secondText, splitFound: true };
  }
  return { intStatus: secondText, macTable: firstText, splitFound: true };
}
