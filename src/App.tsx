import { useMemo, useState } from 'react';
import {
  Server,
  Play,
  ClipboardCopy,
  Check,
  RotateCcw,
  FileText,
  AlertTriangle,
  Wand2,
} from 'lucide-react';
import { combine, rowsToTSV } from './parsers';
import type { CombineResult } from './parsers';
import { SAMPLE_INT_STATUS, SAMPLE_MAC_TABLE } from './sampleData';

const COLUMNS = ['Port', 'Status', 'Vlan', 'Duplex', 'Speed', 'Type', 'MAC'] as const;

const initialResult: CombineResult = {
  rows: [],
  stats: { portCount: 0, macCount: 0, rowCount: 0, intStatusSkipped: 0, macTableSkipped: 0 },
  warnings: [],
};

export function App() {
  const [intStatus, setIntStatus] = useState('');
  const [macTable, setMacTable] = useState('');
  const [result, setResult] = useState<CombineResult>(initialResult);
  const [copied, setCopied] = useState(false);
  const [converted, setConverted] = useState(false);

  const tsv = useMemo(() => rowsToTSV(result.rows), [result.rows]);

  const handleConvert = () => {
    setResult(combine(intStatus, macTable));
    setConverted(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!tsv) return;
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // Fallback: textarea select + execCommand
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
    setIntStatus('');
    setMacTable('');
    setResult(initialResult);
    setConverted(false);
    setCopied(false);
  };

  const handleLoadSample = () => {
    setIntStatus(SAMPLE_INT_STATUS);
    setMacTable(SAMPLE_MAC_TABLE);
    setConverted(false);
  };

  const canCopy = result.rows.length > 0;

  return (
    <div className="min-h-full">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">cleanMac</h1>
            <p className="text-sm text-slate-500">
              Cisco IOS · <span className="font-mono">sh int status</span> +{' '}
              <span className="font-mono">sh mac add</span> → Excel 붙여넣기용 표
            </p>
          </div>
          <div className="ml-auto">
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
              title="예시 입력 채우기"
            >
              <Wand2 className="w-4 h-4" />
              예시 입력
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleConvert}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            변환
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!canCopy}
            className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium text-slate-700 transition-colors"
            title="결과를 TSV(헤더 없음)로 클립보드에 복사 → Excel에 바로 붙여넣기"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <ClipboardCopy className="w-4 h-4" />}
            {copied ? '복사됨' : '클립보드 복사'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-md text-sm font-medium text-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            초기화
          </button>

          {converted && (
            <div className="ml-auto flex items-center gap-3 text-sm text-slate-600">
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

        {converted && (
          <ResultTable rows={result.rows} />
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-xs text-slate-400">
        입력 데이터는 외부로 전송되지 않으며 브라우저 안에서만 처리됩니다.
      </footer>
    </div>
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
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50">
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{hint}</div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-full h-64 p-3 text-xs font-mono resize-y outline-none focus:bg-slate-50/50"
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
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-xs">
      {icon}
      <span className="font-medium text-slate-700">{label}</span>
      <span className="font-mono text-slate-900">{value}</span>
    </span>
  );
}

interface ResultTableProps {
  rows: CombineResult['rows'];
}

function ResultTable({ rows }: ResultTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        변환할 데이터가 없습니다. 두 입력 영역을 채운 뒤 [변환] 버튼을 누르세요.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="max-h-[600px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c}
                  className="text-left font-medium text-slate-700 px-3 py-2 border-b border-slate-200 whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isContinuation = row.port === '';
              return (
                <tr
                  key={idx}
                  className={isContinuation ? 'bg-slate-50/40' : 'border-t border-slate-100'}
                >
                  <td className="px-3 py-1.5 font-mono text-slate-900 whitespace-nowrap">{row.port}</td>
                  <td className="px-3 py-1.5 text-slate-700 whitespace-nowrap">
                    <StatusCell value={row.status} />
                  </td>
                  <td className="px-3 py-1.5 font-mono text-slate-700">{row.vlan}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-700">{row.duplex}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-700">{row.speed}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-700 whitespace-nowrap">{row.type}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-900 whitespace-nowrap">{row.mac}</td>
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
