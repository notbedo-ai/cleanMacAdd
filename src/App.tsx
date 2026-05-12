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
} from 'lucide-react';
import {
  combine,
  rowsToTSV,
  CONTINUATION_PLACEHOLDER,
  splitCombinedInput,
} from './parsers';
import type { CombineResult } from './parsers';
import { SAMPLE_INT_STATUS, SAMPLE_MAC_TABLE } from './sampleData';

const COLUMNS = ['Port', 'Status', 'Vlan', 'Duplex', 'Speed', 'Type', 'MAC'] as const;

type InputMode = 'combined' | 'split';

const initialResult: CombineResult = {
  rows: [],
  stats: { portCount: 0, macCount: 0, rowCount: 0, intStatusSkipped: 0, macTableSkipped: 0 },
  warnings: [],
};

export function App() {
  // U-01: default mode = combined. The single-textarea workflow matches the
  // operator habit of copying both commands in one go from the console.
  const [inputMode, setInputMode] = useState<InputMode>('combined');
  const [combinedText, setCombinedText] = useState('');
  const [intStatus, setIntStatus] = useState('');
  const [macTable, setMacTable] = useState('');
  const [result, setResult] = useState<CombineResult>(initialResult);
  const [copied, setCopied] = useState(false);
  const [converted, setConverted] = useState(false);

  const tsv = useMemo(() => rowsToTSV(result.rows), [result.rows]);

  // U-01: live preview of how the combined paste would split, so operators
  // can spot a missed marker before clicking [변환].
  const combinedSplit = useMemo(() => splitCombinedInput(combinedText), [combinedText]);

  const handleConvert = () => {
    let cr: CombineResult;
    if (inputMode === 'combined') {
      const split = splitCombinedInput(combinedText);
      cr = combine(split.intStatus, split.macTable);
      if (combinedText.trim().length > 0 && !split.splitFound) {
        cr = {
          ...cr,
          warnings: [
            "통합 입력에서 분리 마커를 찾지 못했습니다. 입력 전체를 'show interfaces status'로 간주했습니다. (수동 분리 입력 모드로 전환하면 직접 영역을 지정할 수 있습니다)",
            ...cr.warnings,
          ],
        };
      }
      // Reflect the split into the split-mode textareas so the operator can
      // toggle to split mode and inspect/edit if needed.
      setIntStatus(split.intStatus);
      setMacTable(split.macTable);
    } else {
      cr = combine(intStatus, macTable);
    }
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
    setConverted(false);
  };

  const canCopy = result.rows.length > 0;

  return (
    <div className="min-h-full">
      <header className="bg-blue-50 border-b border-blue-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white shadow-sm">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-blue-900">cleanMac</h1>
            <p className="text-sm text-blue-700/80">
              Cisco IOS · <span className="font-mono">sh int status</span> +{' '}
              <span className="font-mono">sh mac add</span> → Excel 붙여넣기용 표
            </p>
          </div>
          <div className="ml-auto">
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleConvert}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <Play className="w-4 h-4" />
            변환
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!canCopy}
            className="inline-flex items-center gap-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="결과를 TSV(헤더 없음)로 클립보드에 복사 → Excel에 바로 붙여넣기"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <ClipboardCopy className="w-4 h-4" />}
            {copied ? '복사됨' : '클립보드 복사'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <RotateCcw className="w-4 h-4" />
            초기화
          </button>

          {converted && (
            <div className="ml-auto flex items-center gap-3 text-sm text-blue-700">
              <StatBadge icon={<FileText className="w-3.5 h-3.5" />} label="포트" value={result.stats.portCount} />
              <StatBadge label="MAC" value={result.stats.macCount} />
              <StatBadge label="행" value={result.stats.rowCount} />
            </div>
          )}
        </div>

        {converted && result.warnings.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-1">
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

      <footer className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-xs text-blue-400">
        입력 데이터는 외부로 전송되지 않으며 브라우저 안에서만 처리됩니다.
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
    'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500';
  const active = 'bg-blue-600 text-white';
  const idle = 'text-blue-700 hover:bg-blue-50';
  return (
    <div className="inline-flex items-center gap-1 p-1 border border-blue-200 bg-white rounded-lg">
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
      <div className="rounded-lg border border-blue-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-blue-200 bg-blue-50">
          <div className="text-sm font-medium text-blue-900">
            ① + ② 통합 입력 (sh int status + sh mac add)
          </div>
          <div className="text-xs text-blue-700/80 mt-0.5">
            콘솔에서 두 명령 결과를 한 번에 복사한 텍스트를 그대로 붙여넣으세요. 자동으로 분리됩니다.
          </div>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="w-full h-72 p-3 text-xs font-mono resize-y outline-none focus:bg-blue-50/40 focus:ring-2 focus:ring-inset focus:ring-blue-500"
          placeholder="여기에 sh int status + sh mac add 결과를 함께 붙여넣으세요…"
        />
      </div>

      {hasContent && (
        <div
          className={`rounded-md border text-xs ${
            split.splitFound
              ? 'border-blue-200 bg-blue-50/40'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2 px-3 py-2 text-blue-800">
            {split.splitFound ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  분리 완료 — <span className="font-mono">sh int status</span> {intLines.length}줄,{' '}
                  <span className="font-mono">sh mac add</span> {macLines.length}줄
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
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
    <details className="rounded border border-blue-200 bg-white open:bg-blue-50/30">
      <summary className="px-2 py-1 text-blue-800 font-medium cursor-pointer select-none flex items-center gap-1 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
        {title}
      </summary>
      <pre className="px-3 pb-2 pt-1 text-[11px] font-mono text-slate-700 overflow-x-auto whitespace-pre">
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
    <div className="rounded-lg border border-blue-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-blue-200 bg-blue-50">
        <div className="text-sm font-medium text-blue-900">{label}</div>
        <div className="text-xs text-blue-700/80 mt-0.5">{hint}</div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-full h-64 p-3 text-xs font-mono resize-y outline-none focus:bg-blue-50/40 focus:ring-2 focus:ring-inset focus:ring-blue-500"
        placeholder="여기에 명령 결과를 붙여넣으세요…"
      />
    </div>
  );
}

interface StatBadgeProps {
  icon?: React.ReactNode;
  label: string;
  value: number;
}

function StatBadge({ icon, label, value }: StatBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
      {icon}
      <span className="font-medium">{label}</span>
      <span className="font-mono text-blue-900">{value}</span>
    </span>
  );
}

interface ResultTableProps {
  rows: CombineResult['rows'];
}

function ResultTable({ rows }: ResultTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-blue-300 p-10 text-center text-sm text-blue-500">
        변환할 데이터가 없습니다. 입력 영역을 채운 뒤 [변환] 버튼을 누르세요.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-white overflow-hidden">
      <div className="max-h-[600px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-blue-100 sticky top-0 z-10">
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c}
                  className="text-left font-semibold text-blue-900 px-3 py-2 border-b border-blue-200 whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isContinuation = row.port === CONTINUATION_PLACEHOLDER;
              const cellMuted = isContinuation ? 'text-slate-400' : 'text-slate-700';
              const portColor = isContinuation ? 'text-slate-400' : 'text-blue-900';
              return (
                <tr
                  key={idx}
                  className={isContinuation ? 'bg-blue-50/40' : 'border-t border-blue-100 hover:bg-blue-50/30'}
                >
                  <td className={`px-3 py-1.5 font-mono whitespace-nowrap ${portColor}`}>{row.port}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    {isContinuation ? (
                      <span className="font-mono text-slate-400">{row.status}</span>
                    ) : (
                      <StatusCell value={row.status} />
                    )}
                  </td>
                  <td className={`px-3 py-1.5 font-mono ${cellMuted}`}>{row.vlan}</td>
                  <td className={`px-3 py-1.5 font-mono ${cellMuted}`}>{row.duplex}</td>
                  <td className={`px-3 py-1.5 font-mono ${cellMuted}`}>{row.speed}</td>
                  <td className={`px-3 py-1.5 font-mono whitespace-nowrap ${cellMuted}`}>{row.type}</td>
                  <td className="px-3 py-1.5 font-mono text-blue-900 whitespace-nowrap">{row.mac}</td>
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
  if (v.includes('connected') && !v.includes('not')) color = 'text-emerald-600';
  else if (v.includes('notconnect')) color = 'text-slate-400';
  else if (v.includes('disabled') || v.includes('err')) color = 'text-rose-600';
  return <span className={`font-mono ${color}`}>{value}</span>;
}
