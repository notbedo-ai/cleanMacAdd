import { combine, rowsToTSV, CONTINUATION_PLACEHOLDER } from '../src/parsers';
import { SAMPLE_INT_STATUS, SAMPLE_MAC_TABLE } from '../src/sampleData';

const result = combine(SAMPLE_INT_STATUS, SAMPLE_MAC_TABLE);

console.log('=== stats ===');
console.log(result.stats);

if (result.warnings.length > 0) {
  console.log('\n=== warnings ===');
  result.warnings.forEach((w) => console.log('!', w));
}

console.log('\n=== rows (preview) ===');
result.rows.forEach((r) => {
  console.log([r.port, r.status, r.vlan, r.duplex, r.speed, r.type, r.mac].join(' | '));
});

console.log('\n=== TSV ===');
console.log(rowsToTSV(result.rows));

// Sanity checks
const expectations: Array<[boolean, string]> = [
  [result.stats.portCount === 6, 'portCount === 6'],
  [result.stats.macCount === 6, 'macCount === 6'],
  [result.stats.rowCount === 9, 'rowCount === 9 (6 ports + 1 extra for Gi1/0/3 + 2 extras for Gi1/0/5)'],
  // B-02: continuation rows now carry placeholder `-` in the leading 6 cells.
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
];

console.log('\n=== checks ===');
let ok = true;
for (const [pass, desc] of expectations) {
  console.log(`${pass ? '✓' : '✗'} ${desc}`);
  if (!pass) ok = false;
}
process.exit(ok ? 0 : 1);
