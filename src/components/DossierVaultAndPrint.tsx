import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Lock,
  Printer,
  Save,
  Trash2,
  CopyPlus,
} from 'lucide-react';
import type { ColawDossierRecord } from '../lib/api.ts';
import { TEXT, type Locale } from '../lib/i18n.ts';

interface Props {
  locale: Locale;
  mode: 'server' | 'local';
  draftTitle: string;
  liveSha256: string;
  dossiers: ColawDossierRecord[];
  busyAction: string | null;
  copiedBrief: boolean;
  onDraftTitleChange: (next: string) => void;
  onSaveDraft: () => void;
  onCopyBrief: () => void;
  onPrint: () => void;
  onFinalize: (code: string) => void;
  onDuplicate: (code: string) => void;
  onDelete: (code: string) => void;
  onDownloadBrief: (record: ColawDossierRecord) => void;
  onDownloadCsv: (record: ColawDossierRecord) => void;
  onOpenPublic: (slugOrCode: string) => void;
}

export function DossierVaultAndPrint({
  locale,
  mode,
  draftTitle,
  liveSha256,
  dossiers,
  busyAction,
  copiedBrief,
  onDraftTitleChange,
  onSaveDraft,
  onCopyBrief,
  onPrint,
  onFinalize,
  onDuplicate,
  onDelete,
  onDownloadBrief,
  onDownloadCsv,
  onOpenPublic,
}: Props) {
  const isAr = locale === 'ar';
  const t = TEXT[locale];

  return (
    <div className="space-y-5" data-testid="vault-panel">
      <section className="clw-card rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {t.vaultTitle}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {mode === 'server'
                ? isAr
                  ? 'الوضع النشط: خادم SQLite WAL · البصمة الحية SHA-256:'
                  : 'Active Mode: SQLite WAL Server · Live SHA-256:'
                : isAr
                  ? 'الوضع النشط: تخزين المتصفح المحلي ($0) · البصمة الحية SHA-256:'
                  : 'Active Mode: Local Browser Storage ($0) · Live SHA-256:'}
            </p>
          </div>
          <span
            className="clw-mono rounded-lg px-2.5 py-1 text-[11px]"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent-teal)' }}
            data-testid="live-sha256-badge"
          >
            {liveSha256 ? `${liveSha256.slice(0, 16)}...` : '...'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            className="clw-input min-w-0 flex-1"
            data-testid="draft-title-input"
            placeholder={t.vaultTitlePlaceholder}
            value={draftTitle}
            onChange={(e) => onDraftTitleChange(e.target.value)}
          />
          <button
            type="button"
            data-testid="save-draft-btn"
            disabled={busyAction === 'save'}
            onClick={onSaveDraft}
            className="cursor-pointer rounded-xl px-4 py-2 text-xs font-bold"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-fg)',
            }}
          >
            <Save className="inline h-3.5 w-3.5" /> {t.btnSaveDraft}
          </button>
          <button
            type="button"
            data-testid="copy-brief-btn"
            onClick={onCopyBrief}
            className="cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
          >
            {copiedBrief ? (
              <Check className="inline h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="inline h-3.5 w-3.5" />
            )}{' '}
            {t.btnCopyBrief}
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
          >
            <Printer className="inline h-3.5 w-3.5" /> {t.printBtn}
          </button>
        </div>
      </section>

      <section className="clw-card rounded-2xl p-5">
        <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {t.savedVaultHeading} ({dossiers.length})
        </h3>

        {dossiers.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t.noSavedDossiers}
          </p>
        ) : (
          <div className="space-y-3">
            {dossiers.map((doc) => {
              const isLocked = Boolean(doc.lockedAt);
              const statusStyle =
                doc.status === 'ready'
                  ? {
                      backgroundColor: 'var(--accent-emerald-soft)',
                      color: 'var(--accent-emerald)',
                    }
                  : doc.status === 'conditional'
                    ? {
                        backgroundColor: 'var(--accent-amber-soft)',
                        color: 'var(--accent-amber)',
                      }
                    : {
                        backgroundColor: 'var(--accent-crimson-soft)',
                        color: 'var(--accent-crimson)',
                      };

              return (
                <article
                  key={doc.dossierCode}
                  data-testid={`dossier-card-${doc.dossierCode}`}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-elevated)',
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="clw-mono rounded px-2 py-0.5 text-xs font-bold"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {doc.dossierCode}
                      </span>
                      <span className="text-sm font-bold">{doc.companyName}</span>
                      <span
                        className="clw-mono rounded-full px-2 py-0.5 text-[11px] font-bold"
                        style={statusStyle}
                      >
                        {doc.status.toUpperCase()} ({doc.readinessScore}/100)
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: isLocked ? 'var(--accent-teal-soft)' : 'var(--bg-surface)',
                          color: isLocked ? 'var(--accent-teal)' : 'var(--text-secondary)',
                        }}
                      >
                        {isLocked ? t.sealedBadge : t.draftBadge}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {!isLocked ? (
                        <button
                          type="button"
                          data-testid={`seal-btn-${doc.dossierCode}`}
                          disabled={busyAction === doc.dossierCode}
                          onClick={() => onFinalize(doc.dossierCode)}
                          className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: 'var(--accent-teal)',
                            color: '#FFFFFF',
                          }}
                        >
                          <Lock className="inline h-3 w-3" /> {t.btnSealDossier}
                        </button>
                      ) : (
                        <button
                          type="button"
                          data-testid={`view-public-btn-${doc.dossierCode}`}
                          onClick={() => onOpenPublic(doc.dossierCode)}
                          className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: 'var(--accent-primary-fg)',
                          }}
                        >
                          <ExternalLink className="inline h-3 w-3" /> {t.btnPublicView} /r/
                          {doc.dossierCode}
                        </button>
                      )}

                      <button
                        type="button"
                        data-testid={`brief-btn-${doc.dossierCode}`}
                        onClick={() => onDownloadBrief(doc)}
                        className="cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium"
                        style={{
                          borderColor: 'var(--border-subtle)',
                          backgroundColor: 'var(--bg-surface)',
                        }}
                      >
                        <FileText className="inline h-3 w-3" /> {t.btnBriefMd}
                      </button>

                      <button
                        type="button"
                        data-testid={`export-csv-btn-${doc.dossierCode}`}
                        onClick={() => onDownloadCsv(doc)}
                        className="cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium"
                        style={{
                          borderColor: 'var(--border-subtle)',
                          backgroundColor: 'var(--bg-surface)',
                        }}
                      >
                        <Download className="inline h-3 w-3" /> {t.btnExportCsv}
                      </button>

                      <button
                        type="button"
                        data-testid={`duplicate-btn-${doc.dossierCode}`}
                        onClick={() => onDuplicate(doc.dossierCode)}
                        className="cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium"
                        style={{
                          borderColor: 'var(--border-subtle)',
                          backgroundColor: 'var(--bg-surface)',
                        }}
                      >
                        <CopyPlus className="inline h-3 w-3" /> {t.btnDuplicate}
                      </button>

                      {!isLocked ? (
                        <button
                          type="button"
                          data-testid={`delete-btn-${doc.dossierCode}`}
                          onClick={() => onDelete(doc.dossierCode)}
                          className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: 'var(--accent-crimson-soft)',
                            color: 'var(--accent-crimson)',
                          }}
                        >
                          <Trash2 className="inline h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="clw-mono mt-2 truncate text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    SHA-256: {doc.dossierSha256 || 'pending'}
                    {doc.publicSlug ? ` | /r/${doc.publicSlug}` : ''}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
