import { useMemo, useState } from 'react';
import {
  Network,
  Play,
  ClipboardCopy,
  Check,
  RotateCcw,
  FileText,
  AlertTriangle,
  Wand2,
  Layers,
  Columns2,
  ChevronRight,
  Link2,
} from 'lucide-react';
import {
  combine,
  rowsToTSV,
  CONTINUATION_PLACEHOLDER,
  splitCombinedInput,
  parseMacIpMapping,
} from './parsers';
import type { CombineResult } from './parsers';
import { SAMPLE_INT_STATUS, SAMPLE_MAC_TABLE, SAMPLE_MAC_IP } from './sampleData';

// F-08: result table is now 8 columns including IP.
const COLUMNS = ['Port', 'Status', 'Vlan', 'Duplex', 'Speed', 'Type', 'MAC', 'IP'] as const;

type InputMode = 'combined' | 'split';

const initialResult: CombineResult = {
  rows: [],
  stats: {
    portCount: 0,
    macCount: 0,
    rowCount: 0,
    intStatusSkipped: 0,
    macTableSkipped: 0,
    ipMappedCount: 0,
    ipMapSize: 0,
  },
  warnings: [],
};

export function App() {
  // U-01: default mode = combined. The single-textarea workflow matches the
  // operator habit of copying both commands in one go from the console.
  const [inputMode, setInputMode] = useState<InputMode>('combined');
  const [combinedText, setCombinedText] = useState('');
  const [intStatus, setIntStatus] = useState('');
  const [macTable, setMacTable] = useState('');
  const [macIpText, setMacIpText] = useState('');
  const [result, setResult] = useState<CombineResult>(initialResult);
  const [copied, setCopied] = useState(false);
  const [converted, setConverted] = useState(false);

  const tsv = useMemo(() => rowsToTSV(result.rows), [result.rows]);

  // U-01: live preview of how the combined paste would split, so operators
  // can spot a missed marker before clicking [변환].
  const combinedSplit = useMemo(() => splitCombinedInput(combinedText), [combinedText]);

  const handleConvert = () => {
    const mapping = parseMacIpMapping(macIpText);
    let cr: CombineResult;
    if (inputMode === 'combined') {
      const split = splitCombinedInput(combinedText);
      cr = combine(split.intStatus, split.macTable, { macIpMap: mapping.map });
      if (combinedText.trim().length > 0 && !split.splitFound) {
        cr = {
          ...cr,
          warnings: [
            "통합 입력에서 분리 마커를 찾지 못했습니다. 입력 전체를 'show interfaces status'로 간주했습니다. (수동 분리 입력 모드로 전환하면 직접 영역을 지정할 수 있습니다)",
            ...cr.warnings,
          ],
        };
      }
      setIntStatus(split.intStatus);
      setMacTable(split.macTable);
    } else {
      cr = combine(intStatus, macTable, { macIpMap: mapping.map });
    }

    // F-08: surface mapping parse issues alongside the combine warnings.
    const extra: string[] = [];
    if (mapping.skipped > 0) {
      extra.push(`MAC↔IP 매핑 ${mapping.skipped}건은 MAC 형식 오류로 스킵되었습니다.`);
    }
    if (mapping.duplicates.length > 0) {
      const sample = mapping.duplicates.slice(0, 3).join(', ');
      extra.push(
        `MAC↔IP 매핑 중복 ${mapping.duplicates.length}건 — 마지막 값을 사용합니다. (예: ${sample}${mapping.duplicates.length > 3 ? ' ...' : ''})`,
      );
    }
    if (extra.length > 0) cr = { ...cr, warnings: [...cr.warnings, ...extra] };

    setResult(cr);
    setConverted(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!tsv) return;
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = tsv;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        alert('클립보드 복사에 실패했습니다. 결과 영역에서 직접 복사하세요.');
      }
      document.body.removeChild(ta);
    }
  };

  const handleReset = () => {
    setCombinedText('');
    setIntStatus('');
    setMacTable('');
    setMacIpText('');
    setResult(initialResult);
    setConverted(false);
    setCopied(false);
  };

  const handleLoadSample = () => {
    if (inputMode === 'combined') {
      setCombinedText(`${SAMPLE_INT_STATUS}\n${SAMPLE_MAC_TABLE}`);
    } else {
      setIntStatus(SAMPLE_INT_STATUS);
      setMacTable(SAMPLE_MAC_TABLE);
    }
    setMacIpText(SAMPLE_MAC_IP);
    setConverted(false);
  };

  const canCopy = result.rows.length > 0;

  return (
    <div className="min-h-full">
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white shadow-sm">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">cleanMac</h1>
            <p className="text-sm text-slate-400">
              Cisco IOS · <span className="font-mono">sh int status</span> +{' '}
              <span className="font-mono">sh mac add</span> → Excel 붙여넣기용 표 (IP 매핑 지원)
            </p>
          </div>
          <div className="ml-auto">
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-blue-300 px-3 py-1.5 rounded-md hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              title="예시 입력 채우기"
            >
              <Wand2 className="w-4 h-4" />
              예시 입력
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ModeToggle mode={inputMode} onChange={setInputMode} />

        {inputMode === 'combined' ? (
          <CombinedInputPanel
            value={combinedText}
            onChange={setCombinedText}
            split={combinedSplit}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InputPanel
              label="① show interfaces status"
              hint="Cisco 스위치에서 sh int status 결과를 그대로 붙여넣기"
              value={intStatus}
              onChange={setIntStatus}
            />
            <InputPanel
              label="② show mac address-table"
              hint="동일 스위치의 sh mac add 결과를 그대로 붙여넣기"
              value={macTable}
              onChange={setMacTable}
            />
          </div>
        )}

        <MacIpMappingPanel value={macIpText} onChange={setMacIpText} />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleConvert}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <Play className="w-4 h-4" />
            변환
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!canCopy}
            className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            title="결과를 TSV(헤더 없음, 8컬럼)로 클립보드에 복사 → Excel에 바로 붙여넣기"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <ClipboardCopy className="w-4 h-4" />}
            {copied ? '복사됨' : '클립보드 복사'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 hover:border-slate-600 px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          >
            <RotateCcw className="w-4 h-4" />
            초기화
          </button>

          {converted && (
            <div className="ml-auto flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <StatBadge icon={<FileText className="w-3.5 h-3.5" />} label="포트" value={result.stats.portCount} />
              <StatBadge label="MAC" value={result.stats.macCount} />
              <StatBadge label="행" value={result.stats.rowCount} />
              {result.stats.macCount > 0 && (
                <StatBadge
                  icon={<Link2 className="w-3.5 h-3.5" />}
                  label="IP 매핑"
                  valueLabel={`${result.stats.ipMappedCount}/${result.stats.macCount}`}
                  accent
                />
              )}
            </div>
          )}
        </div>

        {converted && result.warnings.length > 0 && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200 space-y-1">
            {result.warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {converted && <ResultTable rows={result.rows} />}
      </main>

      <footer className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-xs text-slate-500">
        MAC·IP 매핑을 포함한 모든 입력은 외부로 전송되지 않으며 브라우저 안에서만 처리됩니다.
      </footer>
    </div>
  );
}

interface ModeToggleProps {
  mode: InputMode;
  onChange: (m: InputMode) => void;
}

function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const buttonBase =
    'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/60';
  const active = 'bg-blue-600 text-white';
  const idle = 'text-slate-300 hover:bg-slate-800 hover:text-slate-100';
  return (
    <div className="inline-flex items-center gap-1 p-1 border border-slate-700 bg-slate-900 rounded-lg">
      <button
        type="button"
        onClick={() => onChange('combined')}
        className={`${buttonBase} ${mode === 'combined' ? active : idle}`}
        aria-pressed={mode === 'combined'}
        title="두 명령을 한 영역에 붙여넣고 자동 분리 (기본)"
      >
        <Layers className="w-4 h-4" />
        통합 입력
      </button>
      <button
        type="button"
        onClick={() => onChange('split')}
        className={`${buttonBase} ${mode === 'split' ? active : idle}`}
        aria-pressed={mode === 'split'}
        title="sh int status / sh mac add 를 두 영역에 따로 붙여넣기"
      >
        <Columns2 className="w-4 h-4" />
        수동 분리 입력
      </button>
    </div>
  );
}

interface CombinedInputPanelProps {
  value: string;
  onChange: (v: string) => void;
  split: ReturnType<typeof splitCombinedInput>;
}

function CombinedInputPanel({ value, onChange, split }: CombinedInputPanelProps) {
  const intLines = split.intStatus ? split.intStatus.split('\n') : [];
  const macLines = split.macTable ? split.macTable.split('\n') : [];
  const hasContent = value.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-700 bg-slate-800/60">
          <div className="text-sm font-medium text-slate-100">
            ① + ② 통합 입력 (sh int status + sh mac add)
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            콘솔에서 두 명령 결과를 한 번에 복사한 텍스트를 그대로 붙여넣으세요. 자동으로 분리됩니다.
          </div>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="w-full h-72 p-3 text-xs font-mono resize-y outline-none bg-slate-900 text-slate-100 placeholder-slate-500 focus:bg-slate-800/40 focus:ring-2 focus:ring-inset focus:ring-blue-500/60"
          placeholder="여기에 sh int status + sh mac add 결과를 함께 붙여넣으세요…"
        />
      </div>

      {hasContent && (
        <div
          className={`rounded-md border text-xs ${
            split.splitFound
              ? 'border-slate-700 bg-slate-800/40'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
          }`}
        >
          <div className={`flex items-center gap-2 px-3 py-2 ${split.splitFound ? 'text-slate-300' : 'text-amber-200'}`}>
            {split.splitFound ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  분리 완료 — <span className="font-mono">sh int status</span> {intLines.length}줄,{' '}
                  <span className="font-mono">sh mac add</span> {macLines.length}줄
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  분리 마커를 찾지 못했습니다. 변환 시 전체 입력을 <span className="font-mono">sh int status</span>로
                  간주합니다.
                </span>
              </>
            )}
          </div>
          {split.splitFound && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-3 pb-3">
              <PreviewBlock title="sh int status (첫 5줄)" lines={intLines.slice(0, 5)} />
              <PreviewBlock title="sh mac add (첫 5줄)" lines={macLines.slice(0, 5)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PreviewBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <details className="rounded border border-slate-700 bg-slate-900 open:bg-slate-800/40">
      <summary className="px-2 py-1 text-slate-200 font-medium cursor-pointer select-none flex items-center gap-1 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="w-3 h-3" />
        {title}
      </summary>
      <pre className="px-3 pb-2 pt-1 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre">
        {lines.length === 0 ? '(빈 영역)' : lines.join('\n')}
      </pre>
    </details>
  );
}

interface InputPanelProps {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}

function InputPanel({ label, hint, value, onChange }: InputPanelProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-700 bg-slate-800/60">
        <div className="text-sm font-medium text-slate-100">{label}</div>
        <div className="text-xs text-slate-400 mt-0.5">{hint}</div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-full h-64 p-3 text-xs font-mono resize-y outline-none bg-slate-900 text-slate-100 placeholder-slate-500 focus:bg-slate-800/40 focus:ring-2 focus:ring-inset focus:ring-blue-500/60"
        placeholder="여기에 명령 결과를 붙여넣으세요…"
      />
    </div>
  );
}

interface MacIpMappingPanelProps {
  value: string;
  onChange: (v: string) => void;
}

// F-08: dedicated optional input for the MAC↔IP mapping. Collapsible
// (defaults to open per docs §5.6) so it stays out of the way on screens
// where the operator does not have IP information available.
function MacIpMappingPanel({ value, onChange }: MacIpMappingPanelProps) {
  return (
    <details className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden" open>
      <summary className="px-4 py-2.5 border-b border-slate-700 bg-slate-800/60 cursor-pointer select-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-blue-400" />
          <div className="text-sm font-medium text-slate-100">③ MAC↔IP 매핑 (선택)</div>
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          타 팀에서 받은 MAC ↔ IP 매핑(Excel 두 열)을 그대로 붙여넣으세요. 결과 표에 IP 컬럼이 채워집니다. 비워두면 IP 컬럼은 빈 값으로 출력됩니다.
        </div>
      </summary>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-full h-40 p-3 text-xs font-mono resize-y outline-none bg-slate-900 text-slate-100 placeholder-slate-500 focus:bg-slate-800/40 focus:ring-2 focus:ring-inset focus:ring-blue-500/60"
        placeholder={'aabb.cc00.0100\t10.10.10.11\nAA-BB-CC-00-02-01\t10.10.20.22\n#  ‘#’로 시작하는 라인은 주석으로 무시됩니다'}
      />
    </details>
  );
}

interface StatBadgeProps {
  icon?: React.ReactNode;
  label: string;
  value?: number;
  valueLabel?: string;
  accent?: boolean;
}

function StatBadge({ icon, label, value, valueLabel, accent }: StatBadgeProps) {
  const tone = accent
    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
    : 'bg-slate-800 text-slate-200 border-slate-700';
  const valueTone = accent ? 'text-blue-200' : 'text-slate-100';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded text-xs ${tone}`}>
      {icon}
      <span className="font-medium">{label}</span>
      <span className={`font-mono ${valueTone}`}>{valueLabel ?? value}</span>
    </span>
  );
}

interface ResultTableProps {
  rows: CombineResult['rows'];
}

function ResultTable({ rows }: ResultTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">
        변환할 데이터가 없습니다. 입력 영역을 채운 뒤 [변환] 버튼을 누르세요.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
      <div className="max-h-[600px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 sticky top-0 z-10">
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="text-left font-semibold text-slate-200 px-3 py-2 border-b border-slate-700 whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isContinuation = row.port === CONTINUATION_PLACEHOLDER;
              const cellMuted = isContinuation ? 'text-slate-500' : 'text-slate-300';
              const portColor = isContinuation ? 'text-slate-500' : 'text-blue-300';
              return (
                <tr
                  key={idx}
                  className={isContinuation ? 'bg-slate-800/30' : 'border-t border-slate-800 hover:bg-slate-800/50'}
                >
                  <td className={`px-3 py-1.5 font-mono whitespace-nowrap ${portColor}`}>{row.port}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    {isContinuation ? (
                      <span className="font-mono text-slate-500">{row.status}</span>
                    ) : (
                      <StatusCell value={row.status} />
                    )}
                  </td>
                  <td className={`px-3 py-1.5 font-mono ${cellMuted}`}>{row.vlan}</td>
                  <td className={`px-3 py-1.5 font-mono ${cellMuted}`}>{row.duplex}</td>
                  <td className={`px-3 py-1.5 font-mono ${cellMuted}`}>{row.speed}</td>
                  <td className={`px-3 py-1.5 font-mono whitespace-nowrap ${cellMuted}`}>{row.type}</td>
                  <td className={`px-3 py-1.5 font-mono whitespace-nowrap ${isContinuation ? 'text-slate-500' : 'text-blue-300'}`}>{row.mac}</td>
                  <td className={`px-3 py-1.5 font-mono whitespace-nowrap ${isContinuation ? 'text-slate-500' : 'text-blue-300'}`}>{row.ip}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusCell({ value }: { value: string }) {
  if (!value) return <span></span>;
  const v = value.toLowerCase();
  let color = 'text-slate-500';
  if (v.includes('connected') && !v.includes('not')) color = 'text-emerald-400';
  else if (v.includes('notconnect')) color = 'text-slate-500';
  else if (v.includes('disabled') || v.includes('err')) color = 'text-rose-400';
  return <span className={`font-mono ${color}`}>{value}</span>;
}
