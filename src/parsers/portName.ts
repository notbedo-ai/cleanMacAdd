const LONG_TO_SHORT: Array<[RegExp, string]> = [
  [/^FastEthernet/i, 'Fa'],
  [/^GigabitEthernet/i, 'Gi'],
  [/^TenGigabitEthernet/i, 'Te'],
  [/^TwentyFiveGigE/i, 'Twe'],
  [/^FortyGigabitEthernet/i, 'Fo'],
  [/^HundredGigE/i, 'Hu'],
  [/^TwoGigabitEthernet/i, 'Tw'],
  [/^FiveGigabitEthernet/i, 'Fi'],
  [/^Port-channel/i, 'Po'],
  [/^Ethernet/i, 'Et'],
];

export const INTERFACE_REGEX =
  /\b(?:FastEthernet|GigabitEthernet|TenGigabitEthernet|TwentyFiveGigE|FortyGigabitEthernet|HundredGigE|TwoGigabitEthernet|FiveGigabitEthernet|Port-channel|Ethernet|Fa|Gi|Te|Twe|Fo|Hu|Tw|Fi|Et|Po|Vl|Lo|Tu)\d+(?:\/\d+){0,3}\b/g;

export function normalizePortName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  for (const [pattern, short] of LONG_TO_SHORT) {
    if (pattern.test(trimmed)) {
      return trimmed.replace(pattern, short);
    }
  }
  return trimmed;
}
