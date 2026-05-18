import {
  combine,
  rowsToTSV,
  CONTINUATION_PLACEHOLDER,
  splitCombinedInput,
  parseMacIpMapping,
} from '../src/parsers';
import {
  SAMPLE_INT_STATUS,
  SAMPLE_MAC_TABLE,
  SAMPLE_MAC_IP,
  SAMPLE_COMBINED_C2960,
} from '../src/sampleData';

// === Scenario 1: legacy split-input, no MAC↔IP mapping =====================
const result = combine(SAMPLE_INT_STATUS, SAMPLE_MAC_TABLE);

console.log('=== stats ===');
console.log(result.stats);

if (result.warnings.length > 0) {
  console.log('\n=== warnings ===');
  result.warnings.forEach((w) => console.log('!', w));
}

console.log('\n=== rows (preview) ===');
result.rows.forEach((r) => {
  console.log([r.port, r.status, r.vlan, r.duplex, r.speed, r.type, r.mac, r.ip].join(' | '));
});

console.log('\n=== TSV ===');
console.log(rowsToTSV(result.rows));

// === Scenario 2: with MAC↔IP mapping =======================================
const mapping = parseMacIpMapping(SAMPLE_MAC_IP);
const mapped = combine(SAMPLE_INT_STATUS, SAMPLE_MAC_TABLE, { macIpMap: mapping.map });
console.log('\n=== mapping stats ===');
console.log({
  mapSize: mapping.map.size,
  skipped: mapping.skipped,
  duplicates: mapping.duplicates,
});
console.log('\n=== rows with IP ===');
mapped.rows.forEach((r) => {
  console.log([r.port, r.mac, r.ip].join(' | '));
});

// === Scenario 3: U-01 splitCombinedInput on §12 부록 회귀 케이스 ===========
const split = splitCombinedInput(SAMPLE_COMBINED_C2960);
const c2960 = combine(split.intStatus, split.macTable);
console.log('\n=== C2960 부록 회귀 stats ===');
console.log({
  splitFound: split.splitFound,
  intLines: split.intStatus.split('\n').length,
  macLines: split.macTable.split('\n').length,
  portCount: c2960.stats.portCount,
  macCount: c2960.stats.macCount,
});

// Sanity checks ==============================================================
const expectations: Array<[boolean, string]> = [
  [result.stats.portCount === 6, 'portCount === 6'],
  [result.stats.macCount === 6, 'macCount === 6'],
  [result.stats.rowCount === 9, 'rowCount === 9 (6 ports + 1 extra for Gi1/0/3 + 2 extras for Gi1/0/5)'],
  [
    result.rows.filter((r) => r.port === CONTINUATION_PLACEHOLDER).length === 3,
    '3 continuation rows with placeholder',
  ],
  [result.rows[0].port === 'Gi1/0/1' && result.rows[0].mac === 'aabb.cc00.0100', 'Gi1/0/1 first row'],
  [result.rows[1].port === 'Gi1/0/2' && result.rows[1].mac === '', 'Gi1/0/2 has empty MAC'],
  [
    result.rows[2].port === 'Gi1/0/3' &&
      result.rows[3].port === CONTINUATION_PLACEHOLDER &&
      result.rows[3].status === CONTINUATION_PLACEHOLDER &&
      result.rows[3].type === CONTINUATION_PLACEHOLDER,
    'Gi1/0/3 continuation row has placeholder in port/status/type',
  ],
  [result.rows.every((r) => r.ip === ''), 'no mapping → every IP is empty'],
  // F-08 mapping checks
  [mapping.map.size === 6, 'mapping parsed 6 entries (5 representations + duplicate)'],
  [mapping.map.get('aabb.cc00.0202') === '10.10.20.23', 'colon/hyphen MAC normalized OK'],
  [
    mapped.rows.find((r) => r.mac === 'aabb.cc00.0100')?.ip === '10.10.10.11',
    'Gi1/0/1 MAC mapped to 10.10.10.11',
  ],
  [
    mapped.rows.find((r) => r.mac === 'aabb.cc00.0202')?.ip === '10.10.20.23',
    'Gi1/0/5 last MAC mapped via colon/hyphen normalization',
  ],
  [mapped.stats.ipMappedCount === 6, 'all 6 MACs in result mapped to IPs'],
  // U-01 splitCombinedInput checks on the §12 부록 input
  [split.splitFound, 'C2960 combined paste split successfully'],
  [c2960.stats.portCount === 26, 'C2960 → 26 status rows (Fa0/1..24 + Gi0/1..2)'],
  [c2960.stats.macCount === 20, 'C2960 → 20 learned MACs after operator filter'],
  // B-03: Cisco IOS prints Speed right-aligned to the header keyword "Speed".
  // Values longer than 5 chars (e.g. `a-1000`) start one column to the LEFT
  // of the header's 'S'. The substring-by-header-index approach must not drop
  // that first 'a' — otherwise Excel interprets the cell as the negative
  // number -1000.
  [
    c2960.rows.find((r) => r.port === 'Gi0/1')?.speed === 'a-1000',
    'C2960 Gi0/1 speed === "a-1000" (right-aligned 6-char value)',
  ],
  [
    c2960.rows.find((r) => r.port === 'Gi0/2')?.speed === 'a-1000',
    'C2960 Gi0/2 speed === "a-1000" (right-aligned 6-char value)',
  ],
  [
    c2960.rows.find((r) => r.port === 'Fa0/1')?.speed === 'a-100',
    'C2960 Fa0/1 speed === "a-100" (5-char value regression guard)',
  ],
  [
    c2960.rows.find((r) => r.port === 'Fa0/8')?.speed === 'auto',
    'C2960 Fa0/8 speed === "auto" (4-char value regression guard)',
  ],
];

console.log('\n=== checks ===');
let ok = true;
for (const [pass, desc] of expectations) {
  console.log(`${pass ? '✓' : '✗'} ${desc}`);
  if (!pass) ok = false;
}
process.exit(ok ? 0 : 1);
