import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Database,
  Globe,
  Moon,
  Printer,
  ShieldAlert,
  Sun,
} from 'lucide-react';
import { CapTableCsvAuditPanel } from './components/CapTableCsvAuditPanel.tsx';
import { ColawGovernanceSvg } from './components/ColawGovernanceSvg.tsx';
import { ControlsAndFindingsPanel } from './components/ControlsAndFindingsPanel.tsx';
import { DossierVaultAndPrint } from './components/DossierVaultAndPrint.tsx';
import { GovernanceAndExposurePanel } from './components/GovernanceAndExposurePanel.tsx';
import { buildColawBriefMarkdown } from './core/briefBuilder.ts';
import { COLAWAE_TOOL_VERSION } from './core/colawCatalog.ts';
import { COLAW_PRESETS } from './core/presets.ts';
import { assessColawReadiness, evaluateColawCoreSync } from './core/readinessAssessor.ts';
import type { AssessmentInput, AssessmentResult } from './core/types.ts';
import {
  type ApiMode,
  type ColawDossierRecord,
  type PublicColawReport,
  deleteDossier,
  detectServerMode,
  duplicateDossier,
  fetchBriefMarkdown,
  fetchExportCsv,
  fetchPublicReport,
  finalizeDossier,
  listDossiers,
  saveDossier,
} from './lib/api.ts';
import { stripBase, withBase } from './lib/basePath.ts';
import {
  TEXT,
  getInitialLocale,
  getInitialTheme,
  persistPreferences,
  type Locale,
  type StudioTab,
  type ThemeName,
} from './lib/i18n.ts';

function parsePublicSlugFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  const rel = stripBase(window.location.pathname);
  const match = rel.match(/^\/r\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]!) : null;
}

function triggerFileDownload(filename: string, content: string | Blob, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme);
  const [mode, setMode] = useState<ApiMode>('local');
  const [activeTab, setActiveTab] = useState<StudioTab>('dashboard');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(COLAW_PRESETS[0]!.id);
  const [input, setInput] = useState<AssessmentInput>(() => ({
    ...structuredClone(COLAW_PRESETS[0]!.input),
    capTableCsv: COLAW_PRESETS[0]!.input.capTableCsv ?? COLAW_PRESETS[0]!.sampleCsv,
  }));
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [shaDigest, setShaDigest] = useState<string>('');
  const [dossiers, setDossiers] = useState<ColawDossierRecord[]>([]);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [copiedBrief, setCopiedBrief] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [publicSlugRoute, setPublicSlugRoute] = useState<string | null>(() =>
    parsePublicSlugFromLocation(),
  );
  const [publicReportState, setPublicReportState] = useState<{
    loading: boolean;
    error: string | null;
    data: PublicColawReport | null;
  }>({ loading: false, error: null, data: null });

  const t = TEXT[locale];
  const isAr = locale === 'ar';

  const syncCore = useMemo(() => evaluateColawCoreSync(input), [input]);
  const liveResult: AssessmentResult = useMemo(
    () => ({
      ...syncCore,
      dossierSha256: shaDigest,
    }),
    [syncCore, shaDigest],
  );

  const selectedPreset = useMemo(
    () => COLAW_PRESETS.find((p) => p.id === selectedPresetId) ?? COLAW_PRESETS[0]!,
    [selectedPresetId],
  );

  useEffect(() => {
    persistPreferences(locale, theme);
  }, [locale, theme]);

  useEffect(() => {
    let active = true;
    void assessColawReadiness(input).then((res) => {
      if (active) setShaDigest(res.dossierSha256);
    });
    return () => {
      active = false;
    };
  }, [input]);

  useEffect(() => {
    let active = true;
    void detectServerMode().then(async (detected) => {
      if (!active) return;
      setMode(detected);
      const rows = await listDossiers(detected).catch(() => []);
      if (active) setDossiers(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setPublicSlugRoute(parsePublicSlugFromLocation());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!publicSlugRoute) return;
    let active = true;
    setPublicReportState({ loading: true, error: null, data: null });
    void detectServerMode().then(async (detected) => {
      if (!active) return;
      setMode(detected);
      try {
        const rep = await fetchPublicReport(detected, publicSlugRoute);
        if (active) setPublicReportState({ loading: false, error: null, data: rep });
      } catch (err) {
        if (active) {
          setPublicReportState({
            loading: false,
            error: err instanceof Error ? err.message : 'Report not found',
            data: null,
          });
        }
      }
    });
    return () => {
      active = false;
    };
  }, [publicSlugRoute]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 3200);
  };

  const refreshVault = async (activeMode = mode) => {
    const rows = await listDossiers(activeMode);
    setDossiers(rows);
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = COLAW_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(preset.id);
    setInput({
      ...structuredClone(preset.input),
      capTableCsv: preset.input.capTableCsv ?? preset.sampleCsv,
    });
  };

  const handleInputChange = (patch: Partial<AssessmentInput>) => {
    setInput((prev) => ({ ...prev, ...patch }));
  };

  const handleSaveDraft = async () => {
    setBusyAction('save');
    try {
      const saved = await saveDossier(mode, input, draftTitle);
      setDraftTitle('');
      await refreshVault();
      showToast(isAr ? `تم حفظ الملف ${saved.dossierCode}` : `Saved dossier ${saved.dossierCode}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleFinalize = async (dossierCode: string) => {
    setBusyAction(dossierCode);
    try {
      const sealed = await finalizeDossier(mode, dossierCode);
      await refreshVault();
      showToast(
        isAr
          ? `تم ختم ${sealed.dossierCode} ببصمة SHA-256`
          : `Sealed ${sealed.dossierCode} with SHA-256`,
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Finalize failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDuplicate = async (dossierCode: string) => {
    setBusyAction(dossierCode);
    try {
      const dup = await duplicateDossier(mode, dossierCode);
      await refreshVault();
      showToast(isAr ? `تم إنشاء نسخة ${dup.dossierCode}` : `Duplicated ${dup.dossierCode}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Duplicate failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDelete = async (dossierCode: string) => {
    setBusyAction(dossierCode);
    try {
      await deleteDossier(mode, dossierCode);
      await refreshVault();
      showToast(isAr ? `تم حذف ${dossierCode}` : `Deleted ${dossierCode}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownloadBrief = async (record: ColawDossierRecord) => {
    setBusyAction(record.dossierCode);
    try {
      const md = await fetchBriefMarkdown(mode, record, locale);
      triggerFileDownload(
        `${record.dossierCode}.${locale}.brief.md`,
        md,
        'text/markdown;charset=utf-8',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Brief download failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownloadCsv = async (record: ColawDossierRecord) => {
    setBusyAction(record.dossierCode);
    try {
      const { filename, content } = await fetchExportCsv(mode, record);
      triggerFileDownload(filename, content, 'text/csv;charset=utf-8');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'CSV export failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopyBrief = async () => {
    const md = buildColawBriefMarkdown(input, liveResult, 'CLW-PREVIEW', shaDigest, locale);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedBrief(true);
      showToast(isAr ? 'تم نسخ الموجز بصيغة Markdown' : 'Copied Markdown brief');
      window.setTimeout(() => setCopiedBrief(false), 2000);
    } catch {
      showToast(isAr ? 'تعذر النسخ التلقائي للحافظة' : 'Clipboard copy unavailable');
    }
  };

  const handleOpenPublicReport = (slugOrCode: string) => {
    const nextPath = withBase(`/r/${encodeURIComponent(slugOrCode)}`);
    window.history.pushState({}, '', nextPath);
    setPublicSlugRoute(slugOrCode);
  };

  const handleBackToStudio = () => {
    window.history.pushState({}, '', withBase('/'));
    setPublicSlugRoute(null);
  };

  const statusBadge =
    liveResult.readinessStatus === 'ready'
      ? {
          text: t.readyBadge,
          bg: 'var(--accent-emerald-soft)',
          fg: 'var(--accent-emerald)',
        }
      : liveResult.readinessStatus === 'conditional'
        ? {
            text: t.conditionalBadge,
            bg: 'var(--accent-amber-soft)',
            fg: 'var(--accent-amber)',
          }
        : {
            text: t.blockedBadge,
            bg: 'var(--accent-crimson-soft)',
            fg: 'var(--accent-crimson)',
          };

  return (
    <div className="min-h-screen px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="clw-card no-print rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary-fg)',
                }}
              >
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1
                  className="text-lg font-extrabold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {t.brandTitle}
                </h1>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {t.brandSubtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                <Database className="h-3.5 w-3.5" style={{ color: 'var(--accent-teal)' }} />
                {mode === 'server' ? t.modeServer : t.modeLocal}
              </span>

              <button
                data-testid="lang-toggle-btn"
                type="button"
                onClick={() => setLocale((prev) => (prev === 'ar' ? 'en' : 'ar'))}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold"
                style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
              >
                <Globe className="h-3.5 w-3.5" />
                {t.switchLang}
              </button>

              <button
                data-testid="theme-toggle-btn"
                type="button"
                onClick={() =>
                  setTheme((prev) =>
                    prev === 'alabaster-governance'
                      ? 'obsidian-corporate'
                      : 'alabaster-governance',
                  )
                }
                aria-label={isAr ? 'تبديل المظهر' : 'Toggle Theme'}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold"
                style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
              >
                {theme === 'alabaster-governance' ? (
                  <Moon className="h-3.5 w-3.5" />
                ) : (
                  <Sun className="h-3.5 w-3.5" />
                )}
                {theme === 'alabaster-governance' ? t.themeDark : t.themeLight}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold"
                style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
              >
                <Printer className="h-3.5 w-3.5" />
                {t.printBtn}
              </button>
            </div>
          </div>

          {!publicSlugRoute && (
            <div
              className="mt-4 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                <label
                  htmlFor="preset-select"
                  className="text-xs font-bold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t.presetLabel}
                </label>
                <select
                  data-testid="preset-select"
                  id="preset-select"
                  className="clw-input w-full min-w-0 max-w-full sm:w-auto sm:min-w-[380px]"
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                >
                  {COLAW_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {isAr ? p.labelAr : p.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="CoLawAE tabs">
                {(
                  [
                    ['dashboard', t.tabDashboard],
                    ['controls', t.tabControls],
                    ['captable', t.tabCapTable],
                    ['vault', t.tabVault],
                  ] as const
                ).map(([tabKey, label]) => {
                  const selected = activeTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      data-testid={`tab-${tabKey}`}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveTab(tabKey)}
                      className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-colors"
                      style={
                        selected
                          ? {
                              backgroundColor: 'var(--accent-primary)',
                              color: 'var(--accent-primary-fg)',
                            }
                          : {
                              backgroundColor: 'var(--bg-elevated)',
                              color: 'var(--text-secondary)',
                            }
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {toast && (
          <div
            role="status"
            data-testid="status-toast"
            className="no-print rounded-xl border px-4 py-2 text-xs font-bold"
            style={{
              backgroundColor: 'var(--accent-teal-soft)',
              borderColor: 'var(--accent-teal)',
              color: 'var(--accent-teal)',
            }}
          >
            {toast}
          </div>
        )}

        <main className="space-y-4">
          {publicSlugRoute ? (
            <section className="clw-card space-y-4 rounded-2xl p-4 sm:p-6">
              <div className="no-print flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleBackToStudio}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold"
                  style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t.backToStudio}
                </button>
                {publicReportState.data && (
                  <span
                    data-testid="public-view-count"
                    className="clw-mono rounded-full px-3 py-1 text-xs font-bold"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {t.publicViewsLabel} {publicReportState.data.viewCount}
                  </span>
                )}
              </div>

              {publicReportState.loading ? (
                <p className="text-sm">
                  {isAr ? 'جارٍ تحميل التقرير المختوم...' : 'Loading sealed report...'}
                </p>
              ) : publicReportState.error || !publicReportState.data ? (
                <div
                  className="rounded-xl p-4 text-sm font-semibold"
                  style={{
                    backgroundColor: 'var(--accent-crimson-soft)',
                    color: 'var(--accent-crimson)',
                  }}
                >
                  <ShieldAlert className="mb-1 me-1.5 inline-block h-4 w-4" />
                  {publicReportState.error || 'Report not found'}
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 border-b pb-3"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <div>
                      <div
                        className="clw-mono text-xs font-bold"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        {publicReportState.data.report.dossierCode} ·{' '}
                        {publicReportState.data.report.publicSlug}
                      </div>
                      <h2 className="text-lg font-extrabold">
                        {publicReportState.data.report.companyName}
                      </h2>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold"
                      style={{ backgroundColor: 'var(--bg-elevated)' }}
                    >
                      {publicReportState.data.report.status.toUpperCase()} (
                      {publicReportState.data.report.readinessScore}/100)
                    </span>
                  </div>

                  <div
                    dir="ltr"
                    className="clw-mono rounded-xl p-3 text-xs"
                    style={{ backgroundColor: 'var(--bg-elevated)' }}
                  >
                    SHA-256: {publicReportState.data.report.dossierSha256}
                  </div>

                  <pre
                    dir={isAr ? 'rtl' : 'ltr'}
                    className="overflow-x-auto whitespace-pre-wrap rounded-xl border p-4 text-xs leading-relaxed"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-elevated)',
                    }}
                  >
                    {isAr
                      ? publicReportState.data.report.briefAr
                      : publicReportState.data.report.briefEn}
                  </pre>
                </div>
              )}
            </section>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <>
                  <ColawGovernanceSvg
                    locale={locale}
                    input={input}
                    obligations={liveResult.obligations}
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="clw-card rounded-2xl p-4" data-testid="kpi-score-card">
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {t.kpiScoreTitle}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="clw-mono num-tabular text-2xl font-extrabold">
                          {liveResult.readinessScore}/100
                        </span>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ backgroundColor: statusBadge.bg, color: statusBadge.fg }}
                        >
                          {statusBadge.text}
                        </span>
                      </div>
                    </div>

                    <div className="clw-card rounded-2xl p-4">
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {t.kpiLossTitle}
                      </div>
                      <div
                        className="clw-mono num-tabular mt-1.5 text-lg font-extrabold"
                        style={{
                          color: liveResult.obligations.gaSlaBreached
                            ? 'var(--accent-crimson)'
                            : liveResult.obligations.gaMandatoryTriggered
                              ? 'var(--accent-amber)'
                              : 'var(--accent-emerald)',
                        }}
                      >
                        {liveResult.obligations.lossRatioPct}% ·{' '}
                        {liveResult.obligations.minorityDissolutionRightActive
                          ? isAr
                            ? 'حل >= 75%'
                            : '>= 75% Dissolve'
                          : liveResult.obligations.gaMandatoryTriggered
                            ? isAr
                              ? 'دعوة 30ي'
                              : '30d GA Req'
                            : isAr
                              ? 'آمن (دون 50%)'
                              : 'Healthy < 50%'}
                      </div>
                      <div className="mt-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {liveResult.obligations.lossBand}
                      </div>
                    </div>

                    <div className="clw-card rounded-2xl p-4">
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {t.kpiReserveTitle}
                      </div>
                      <div className="clw-mono num-tabular mt-1.5 text-lg font-extrabold">
                        {liveResult.obligations.reservePctOfCapital}% / 50%
                      </div>
                      <div className="mt-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {liveResult.obligations.reserveStopCapReached
                          ? isAr
                            ? 'سقف 50% مكتمل ✓'
                            : '50% Cap Reached ✓'
                          : isAr
                            ? `تجنيب 5%: ${liveResult.obligations.projectedStatutoryReserveTransferAed.toLocaleString('en-US')} د.إ`
                            : `Projected 5%: AED ${liveResult.obligations.projectedStatutoryReserveTransferAed.toLocaleString('en-US')}`}
                      </div>
                    </div>

                    <div className="clw-card rounded-2xl p-4">
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {t.kpiExposureTitle}
                      </div>
                      <div
                        className="clw-mono num-tabular mt-1.5 text-lg font-extrabold"
                        style={{
                          color:
                            liveResult.obligations.projectedMaximumFineAed > 0
                              ? 'var(--accent-crimson)'
                              : 'var(--accent-emerald)',
                        }}
                      >
                        {isAr
                          ? `حتى ${liveResult.obligations.projectedMaximumFineAed.toLocaleString('en-US')} د.إ`
                          : `Up to AED ${liveResult.obligations.projectedMaximumFineAed.toLocaleString('en-US')}`}
                      </div>
                      <div className="clw-mono mt-1 truncate text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {liveResult.obligations.sanctionTierCode}
                      </div>
                    </div>
                  </div>

                  <GovernanceAndExposurePanel
                    locale={locale}
                    input={input}
                    obligations={liveResult.obligations}
                    onChange={handleInputChange}
                  />
                </>
              )}

              {activeTab === 'controls' && (
                <ControlsAndFindingsPanel locale={locale} controls={liveResult.controls} />
              )}

              {activeTab === 'captable' && (
                <CapTableCsvAuditPanel
                  locale={locale}
                  csvText={input.capTableCsv ?? ''}
                  sampleCsv={selectedPreset.sampleCsv}
                  audit={liveResult.csvAudit}
                  onCsvChange={(next) => setInput((prev) => ({ ...prev, capTableCsv: next }))}
                  onDownload={triggerFileDownload}
                />
              )}

              {activeTab === 'vault' && (
                <DossierVaultAndPrint
                  locale={locale}
                  mode={mode}
                  draftTitle={draftTitle}
                  liveSha256={shaDigest}
                  dossiers={dossiers}
                  busyAction={busyAction}
                  copiedBrief={copiedBrief}
                  onDraftTitleChange={setDraftTitle}
                  onSaveDraft={handleSaveDraft}
                  onCopyBrief={handleCopyBrief}
                  onPrint={() => window.print()}
                  onFinalize={handleFinalize}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onDownloadBrief={handleDownloadBrief}
                  onDownloadCsv={handleDownloadCsv}
                  onOpenPublic={handleOpenPublicReport}
                />
              )}
            </>
          )}
        </main>

        <footer className="clw-card rounded-2xl p-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <p data-testid="legal-disclaimer-banner">
            {isAr ? liveResult.disclaimerAr : liveResult.disclaimerEn}
          </p>
          <p className="clw-mono mt-1 text-[11px]">
            CoLawAE v{COLAWAE_TOOL_VERSION} · MIT · FDL 32/2021, FDL 20/2025 (eff. 2025-11-15) &amp;
            CR 102/2022
          </p>
        </footer>
      </div>
    </div>
  );
}
