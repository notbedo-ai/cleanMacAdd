// F-08: Normalize any common MAC address representation into the Cisco dotted
// canonical form (`xxxx.xxxx.xxxx`, lowercase). Accepted inputs include:
//   - Cisco dotted:    aabb.cc00.0100
//   - Colon-separated: AA:BB:CC:00:01:00
//   - Hyphen-separated: AA-BB-CC-00-01-00
//   - Unseparated hex: AABBCC000100
//   - Mixed / space-separated: aabb cc00 0100
// Returns `null` if the input does not yield exactly 12 hex digits.
//
// Verification examples (kept as comments per CLAUDE.md docstring policy):
//   normalizeMac('aabb.cc00.0100')        -> 'aabb.cc00.0100'
//   normalizeMac('AA:BB:CC:00:01:00')     -> 'aabb.cc00.0100'
//   normalizeMac('AA-BB-CC-00-01-00')     -> 'aabb.cc00.0100'
//   normalizeMac('AABBCC000100')          -> 'aabb.cc00.0100'
//   normalizeMac('aabb cc00 0100')        -> 'aabb.cc00.0100'
//   normalizeMac('not-a-mac')             -> null
export function normalizeMac(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const hex = raw.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  if (hex.length !== 12) return null;
  return `${hex.slice(0, 4)}.${hex.slice(4, 8)}.${hex.slice(8, 12)}`;
}
