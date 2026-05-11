import type { CombineResult, ResultRow } from './types';
import { parseInterfaceStatus } from './interfaceStatus';
import { parseMacAddressTable } from './macAddressTable';

export function combine(intStatusText: string, macTableText: string): CombineResult {
  const intResult = parseInterfaceStatus(intStatusText);
  const macResult = parseMacAddressTable(macTableText);

  const macsByPort = new Map<string, string[]>();
  for (const entry of macResult.entries) {
    if (!macsByPort.has(entry.port)) {
      macsByPort.set(entry.port, []);
    }
    macsByPort.get(entry.port)!.push(entry.mac);
  }

  const rows: ResultRow[] = [];
  let macCount = 0;

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
      });
    } else {
      macs.forEach((mac, idx) => {
        if (idx === 0) {
          rows.push({
            port: intRow.port,
            status: intRow.status,
            vlan: intRow.vlan,
            duplex: intRow.duplex,
            speed: intRow.speed,
            type: intRow.type,
            mac,
          });
        } else {
          rows.push({
            port: '',
            status: '',
            vlan: '',
            duplex: '',
            speed: '',
            type: '',
            mac,
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

  return {
    rows,
    stats: {
      portCount: intResult.rows.length,
      macCount,
      rowCount: rows.length,
      intStatusSkipped: intResult.skipped,
      macTableSkipped: macResult.skipped,
    },
    warnings,
  };
}

export function rowsToTSV(rows: ResultRow[]): string {
  return rows
    .map((r) => [r.port, r.status, r.vlan, r.duplex, r.speed, r.type, r.mac].join('\t'))
    .join('\n');
}
