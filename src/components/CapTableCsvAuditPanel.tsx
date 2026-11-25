import { Download, FileSpreadsheet, RefreshCw, ShieldAlert } from 'lucide-react';
import { auditCapTableCsv, exportCapTableAuditCsv } from '../core/index.ts';
import type { CapTableCsvAuditSummary } from '../core/types.ts';
import { TEXT, type Locale } from '../lib/i18n.ts';

interface Props {
  locale: Locale;
  csvText: string;
  sampleCsv: string;
  audit: CapTableCsvAuditSummary | null;
  onCsvChange: (next: string) => void;
  onDownload: (filename: string, content: string, mimeType: string) => void;
}

export function CapTableCsvAuditPanel({
  locale,
  csvText,
  sampleCsv,
  audit,
  onCsvChange,
  onDownload,
}: Props) {
  const isAr = locale === 'ar';
  const t = TEXT[locale];
  const computed = audit ?? auditCapTableCsv(csvText);

  const handleInstantSanitize = () => {
    const res = auditCapTableCsv(csvText);
    if (res.rows.length > 0) {
      const wire = exportCapTableAuditCsv(res);
      onDownload('colawae-captable-sanitized.csv', wire, 'text/csv;charset=utf-8');
    }
  };

  return (
    <section className="clw-card rounded-2xl p-5" data-testid="csv-audit-panel">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold">
            <FileSpreadsheet className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
            {t.auditCsvTitle}
          </h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t.auditCsvDesc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
            onClick={() => onCsvChange(sampleCsv)}
          >
            <RefreshCw className="inline h-3.5 w-3.5" /> {t.btnLoadSampleCsv}
          </button>
          <button
            type="button"
            data-testid="download-safe-csv-btn"
            className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-fg)',
            }}
            onClick={handleInstantSanitize}
          >
            <Download className="inline h-3.5 w-3.5" /> {t.btnDownloadSafeCsv}
          </button>
        </div>
      </div>

      <textarea
        dir="ltr"
        rows={5}
        data-testid="captable-csv-textarea"
        className="clw-input clw-mono mb-4 text-xs"
        value={csvText}
        onChange={(e) => onCsvChange(e.target.value)}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
        <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <div style={{ color: 'var(--text-secondary)' }}>{isAr ? 'الصفوف' : 'Rows'}</div>
          <div className="clw-mono num-tabular text-base font-bold">{computed.totalRows}</div>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <div style={{ color: 'var(--text-secondary)' }}>{isAr ? 'مجموع الملكية' : 'Equity Sum'}</div>
          <div
            className="clw-mono num-tabular text-base font-bold"
            style={{
              color: computed.equitySumValid ? 'var(--accent-emerald)' : 'var(--accent-crimson)',
            }}
          >
            {computed.totalEquityPct}%
          </div>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <div style={{ color: 'var(--text-secondary)' }}>{isAr ? 'مجموع التصويت' : 'Voting Sum'}</div>
          <div
            className="clw-mono num-tabular text-base font-bold"
            style={{
              color: computed.votingSumValid ? 'var(--accent-emerald)' : 'var(--accent-crimson)',
            }}
          >
            {computed.totalVotingPct}%
          </div>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <div style={{ color: 'var(--text-secondary)' }}>{isAr ? 'صفوف مخالفة' : 'Violations'}</div>
          <div
            className="clw-mono num-tabular text-base font-bold"
            style={{
              color: computed.violationRows > 0 ? 'var(--accent-crimson)' : 'var(--accent-emerald)',
            }}
          >
            {computed.violationRows}
          </div>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            {isAr ? 'تعقيم CWE-1236' : 'CWE-1236 Neutralized'}
          </div>
          <div className="clw-mono num-tabular text-base font-bold">
            {computed.sanitizedCellsCount}
          </div>
        </div>
      </div>

      {computed.rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-subtle)' }}>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">{isAr ? 'الفئة' : 'Class'}</th>
                <th className="px-3 py-2">{isAr ? 'الشريك/الحامل' : 'Holder'}</th>
                <th className="px-3 py-2">{isAr ? 'ملكية%' : 'Equity%'}</th>
                <th className="px-3 py-2">{isAr ? 'تصويت%' : 'Voting%'}</th>
                <th className="px-3 py-2">{isAr ? 'بعقد التأسيس' : 'MoA'}</th>
                <th className="px-3 py-2">{isAr ? 'الحالة والملاحظات' : 'Status & Findings'}</th>
              </tr>
            </thead>
            <tbody>
              {computed.rows.map((row) => (
                <tr
                  key={row.rowNumber}
                  className="border-t"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <td className="clw-mono px-3 py-2">{row.rowNumber}</td>
                  <td className="clw-mono px-3 py-2">{row.shareClassName}</td>
                  <td className="px-3 py-2">
                    <span className="clw-mono">{row.holderName}</span>
                    {row.wasSanitized ? (
                      <span
                        className="ml-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: 'var(--accent-amber-soft)',
                          color: 'var(--accent-amber)',
                        }}
                      >
                        <ShieldAlert className="h-3 w-3" /> CWE-1236
                      </span>
                    ) : null}
                  </td>
                  <td className="clw-mono num-tabular px-3 py-2">{row.equityPct}%</td>
                  <td className="clw-mono num-tabular px-3 py-2">{row.votingPct}%</td>
                  <td className="px-3 py-2">{row.moaAnchored ? '✓' : '✗'}</td>
                  <td className="px-3 py-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{
                        backgroundColor:
                          row.status === 'violation'
                            ? 'var(--accent-crimson-soft)'
                            : row.status === 'warning'
                              ? 'var(--accent-amber-soft)'
                              : 'var(--accent-emerald-soft)',
                        color:
                          row.status === 'violation'
                            ? 'var(--accent-crimson)'
                            : row.status === 'warning'
                              ? 'var(--accent-amber)'
                              : 'var(--accent-emerald)',
                      }}
                    >
                      {row.status.toUpperCase()}
                    </span>
                    {row.issues.length > 0 ? (
                      <span className="clw-mono ml-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {row.issues.join(', ')}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
