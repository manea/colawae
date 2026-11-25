import type { FindingItem } from '../core/types.ts';
import type { Locale } from '../lib/i18n.ts';

interface Props {
  locale: Locale;
  controls: FindingItem[];
}

export function ControlsAndFindingsPanel({ locale, controls }: Props) {
  const isAr = locale === 'ar';

  return (
    <section className="clw-card rounded-2xl p-5" data-testid="controls-panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          {isAr
            ? 'مصفوفة الضوابط السباعية (FDL 32/2021, FDL 20/2025 & CR 102/2022)'
            : 'Seven-Control Statutory Matrix (FDL 32/2021, FDL 20/2025 & CR 102/2022)'}
        </h2>
        <span className="clw-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          {controls.filter((c) => c.passed).length} / {controls.length}{' '}
          {isAr ? 'مكتمل' : 'Passed'}
        </span>
      </div>

      <div className="space-y-3">
        {controls.map((c) => {
          const badgeStyle = c.passed
            ? {
                backgroundColor: 'var(--accent-emerald-soft)',
                color: 'var(--accent-emerald)',
              }
            : c.severity === 'critical'
              ? {
                  backgroundColor: 'var(--accent-crimson-soft)',
                  color: 'var(--accent-crimson)',
                }
              : {
                  backgroundColor: 'var(--accent-amber-soft)',
                  color: 'var(--accent-amber)',
                };

          return (
            <article
              key={c.id}
              className="rounded-xl border p-4"
              style={{
                borderColor: c.passed ? 'var(--border-subtle)' : badgeStyle.color,
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="clw-mono rounded px-2 py-0.5 text-xs font-bold"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {c.id}
                  </span>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {isAr ? c.titleAr : c.titleEn}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="clw-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {c.weight} pts
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={badgeStyle}
                  >
                    {c.passed ? (isAr ? 'ممتثل ✓' : 'PASSED ✓') : `${c.severity.toUpperCase()} ✗`}
                  </span>
                </div>
              </div>

              <p className="clw-mono mb-1.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {c.legalRef}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {isAr ? c.detailAr : c.detailEn}
              </p>
              {!c.passed ? (
                <p
                  className="mt-2 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <strong>{isAr ? 'المعالجة المقترحة:' : 'Remediation:'}</strong>{' '}
                  {isAr ? c.remediationAr : c.remediationEn}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
