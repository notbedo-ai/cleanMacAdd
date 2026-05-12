import type { CombineOptions, CombineResult, ResultRow } from './types';
import { parseInterfaceStatus } from './interfaceStatus';
import { parseMacAddressTable } from './macAddressTable';

// B-02: Placeholder character used in continuation rows (2nd+ MAC of the same
// port). Filling the leading 6 columns instead of leaving them empty prevents
// Excel for Microsoft 365 (Korean locale) with "연속 구분 기호를 하나로 처리"
// from collapsing 6 consecutive tabs and shifting the MAC into column 2.
// Per docs/improvement-plan-v0.3.md §3.4, the character is `-` (operator-confirmed).
export const CONTINUATION_PLACEHOLDER = '-';

export function combine(
  intStatusText: string,
  macTableText: string,
  options: CombineOptions = {},
): CombineResult {
  const intResult = parseInterfaceStatus(intStatusText);
  const macResult = parseMacAddressTable(macTableText);
  const macIpMap = options.macIpMap;

  const macsByPort = new Map<string, string[]>();
  for (const entry of macResult.entries) {
    if (!macsByPort.has(entry.port)) {
      macsByPort.set(entry.port, []);
    }
    macsByPort.get(entry.port)!.push(entry.mac);
  }

  const rows: ResultRow[] = [];
  let macCount = 0;
  let ipMappedCount = 0;
  const seenMacs = new Set<string>();

  // F-08: lookup helper. macAddressTable parser already lowercases MACs into
  // the dotted canonical form, so a direct map.get is enough.
  const lookupIp = (mac: string): string => {
    if (!macIpMap || !mac) return '';
    const ip = macIpMap.get(mac) ?? '';
    if (ip) ipMappedCount++;
    return ip;
  };

  for (const intRow of intResult.rows) {
    const macs = macsByPort.get(intRow.port) ?? [];
    if (macs.length === 0) {
      rows.push({
        port: intRow.port,
        status: intRow.status,
        vlan: intRow.vlan,
        duplex: intRow.duplex,
        speed: intRow.speed,
        type: intRow.type,
        mac: '',
        ip: '',
      });
    } else {
      macs.forEach((mac, idx) => {
        seenMacs.add(mac);
        const ip = lookupIp(mac);
        if (idx === 0) {
          rows.push({
            port: intRow.port,
            status: intRow.status,
            vlan: intRow.vlan,
            duplex: intRow.duplex,
            speed: intRow.speed,
            type: intRow.type,
            mac,
            ip,
          });
        } else {
          rows.push({
            port: CONTINUATION_PLACEHOLDER,
            status: CONTINUATION_PLACEHOLDER,
            vlan: CONTINUATION_PLACEHOLDER,
            duplex: CONTINUATION_PLACEHOLDER,
            speed: CONTINUATION_PLACEHOLDER,
            type: CONTINUATION_PLACEHOLDER,
            mac,
            ip,
          });
        }
        macCount++;
      });
    }
  }

  const warnings: string[] = [];
  if (intResult.rows.length === 0) {
    if (intStatusText.trim().length === 0) {
      warnings.push("'show interfaces status' 출력을 입력하세요.");
    } else {
      warnings.push(
        "'show interfaces status' 출력에서 데이터를 추출할 수 없습니다. 헤더(Port / Status / Vlan / Duplex / Speed / Type)가 포함되었는지 확인하세요.",
      );
    }
  }
  if (macResult.entries.length === 0 && macTableText.trim().length > 0) {
    warnings.push("'show mac address-table' 출력에서 유효한 MAC 항목을 찾지 못했습니다.");
  }

  const intPortSet = new Set(intResult.rows.map((r) => r.port));
  const orphanPorts = new Set<string>();
  for (const entry of macResult.entries) {
    if (!intPortSet.has(entry.port)) {
      orphanPorts.add(entry.port);
    }
  }
  if (orphanPorts.size > 0) {
    const sample = [...orphanPorts].slice(0, 3).join(', ');
    warnings.push(
      `'show interfaces status'에 없는 포트의 MAC ${orphanPorts.size}개는 제외되었습니다. (예: ${sample}${orphanPorts.size > 3 ? ' ...' : ''})`,
    );
  }

  // F-08: surface mapping entries that never matched any MAC in the result.
  // Keeps operators aware of stale or wrong-switch mapping data.
  const ipMapSize = macIpMap ? macIpMap.size : 0;
  if (macIpMap && macIpMap.size > 0) {
    let unusedCount = 0;
    for (const mac of macIpMap.keys()) {
      if (!seenMacs.has(mac)) unusedCount++;
    }
    if (unusedCount > 0) {
      warnings.push(
        `MAC↔IP 매핑 중 결과에 사용되지 않은 항목 ${unusedCount}건이 있습니다. (다른 스위치의 매핑이거나 누락된 포트 가능성)`,
      );
    }
  }

  return {
    rows,
    stats: {
      portCount: intResult.rows.length,
      macCount,
      rowCount: rows.length,
      intStatusSkipped: intResult.skipped,
      macTableSkipped: macResult.skipped,
      ipMappedCount,
      ipMapSize,
    },
    warnings,
  };
}

export function rowsToTSV(rows: ResultRow[]): string {
  // F-08: 8 columns — Port, Status, Vlan, Duplex, Speed, Type, MAC, IP.
  return rows
    .map((r) => [r.port, r.status, r.vlan, r.duplex, r.speed, r.type, r.mac, r.ip].join('\t'))
    .join('\n');
}
