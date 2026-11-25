import type {
  AssessmentInput,
  LegalVehicleKind,
  ObligationsEvaluation,
  RedomiciliationPath,
  ShareClassModel,
} from '../core/types.ts';
import { TEXT, type Locale } from '../lib/i18n.ts';

interface Props {
  locale: Locale;
  input: AssessmentInput;
  obligations: ObligationsEvaluation;
  onChange: (patch: Partial<AssessmentInput>) => void;
}

const VEHICLE_OPTIONS: Array<{ value: LegalVehicleKind; ar: string; en: string }> = [
  { value: 'mainland_llc', ar: 'شركة ذات مسؤولية محدودة (LLC)', en: 'UAE Mainland LLC' },
  { value: 'mainland_spc', ar: 'شركة الشخص الواحد (SPC)', en: 'UAE Mainland Single-Person LLC' },
  { value: 'mainland_prjsc', ar: 'شركة مساهمة خاصة (PrJSC)', en: 'Private Joint Stock Co (PrJSC)' },
  { value: 'mainland_pjsc', ar: 'شركة مساهمة عامة (PJSC)', en: 'Public Joint Stock Co (PJSC)' },
  { value: 'mainland_nonprofit', ar: 'شركة تجارية غير ربحية (م 8)', en: 'Non-Profit Commercial Co (Art. 8)' },
  { value: 'freezone_within_zone', ar: 'منطقة حرة داخل نطاقها (مستثناة)', en: 'Free Zone Within Zone (Exempt)' },
  { value: 'freezone_onshore_trading', ar: 'منطقة حرة تعمل بالبر الرئيسي (م 5)', en: 'Free Zone Trading Onshore (Art. 5)' },
  { value: 'difc_adgm_exempt', ar: 'منطقة حرة مالية (DIFC / ADGM)', en: 'DIFC / ADGM Financial Zone' },
];

const REDOMICILE_OPTIONS: Array<{ value: RedomiciliationPath; ar: string; en: string }> = [
  { value: 'none', ar: 'لا يوجد انتقال قيد حالياً', en: 'None (Current Jurisdiction)' },
  { value: 'freezone_to_mainland', ar: 'من منطقة حرة إلى البر الرئيسي (م 15 مكرر)', en: 'Free Zone -> UAE Mainland (Art. 15 bis)' },
  { value: 'mainland_to_freezone', ar: 'من البر الرئيسي إلى منطقة حرة (م 15 مكرر)', en: 'UAE Mainland -> Free Zone (Art. 15 bis)' },
  { value: 'emirate_to_emirate', ar: 'بين إمارتين بالبر الرئيسي (DET <-> ADDED)', en: 'Emirate-to-Emirate Mainland' },
  { value: 'freezone_to_freezone', ar: 'بين منطقتين حرتين دون تصفية', en: 'Free Zone <-> Free Zone' },
];

const SHARE_CLASS_OPTIONS: Array<{ value: ShareClassModel; ar: string; en: string }> = [
  { value: 'single_ordinary', ar: 'حصص عادية موحدة', en: 'Single Ordinary Class' },
  { value: 'multi_class_moa_registered', ar: 'فئات متعددة مثبّتة بعقد التأسيس (م 76/4)', en: 'Multi-Class Registered in MoA (Art. 76(4))' },
  { value: 'multi_class_side_letter_only', ar: 'فئات باتفاقية جانبية فقط (ناقصة)', en: 'Side-Letter Multi-Class Only (Gap)' },
];

export function GovernanceAndExposurePanel({ locale, input, obligations, onChange }: Props) {
  const isAr = locale === 'ar';
  const t = TEXT[locale];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Section 1: Identity & Scope */}
      <section className="clw-card rounded-2xl p-5">
        <h3 className="mb-3.5 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {t.sectionIdentity}
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {t.companyName}
            </label>
            <input
              type="text"
              className="clw-input"
              data-testid="company-name-input"
              value={input.companyName}
              onChange={(e) => onChange({ companyName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {t.tradeTrn}
                </label>
                <span
                  className="clw-mono shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: !obligations.trnFormatted
                      ? 'var(--bg-elevated)'
                      : obligations.trnValidOrEmpty
                        ? 'var(--accent-emerald-soft)'
                        : 'var(--accent-crimson-soft)',
                    color: !obligations.trnFormatted
                      ? 'var(--text-secondary)'
                      : obligations.trnValidOrEmpty
                        ? 'var(--accent-emerald)'
                        : 'var(--accent-crimson)',
                  }}
                >
                  {!obligations.trnFormatted
                    ? t.trnEmpty
                    : obligations.trnValidOrEmpty
                      ? t.trnValid
                      : t.trnInvalid}
                </span>
              </div>
              <input
                type="text"
                dir="ltr"
                className="clw-input clw-mono"
                data-testid="trade-trn-input"
                value={input.tradeTrn}
                onChange={(e) => onChange({ tradeTrn: e.target.value })}
                placeholder="100512349870003"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {t.priorViolationCount}
              </label>
              <input
                type="number"
                min={0}
                max={20}
                className="clw-input clw-mono num-tabular"
                data-testid="prior-violations-input"
                value={input.priorViolationCount}
                onChange={(e) =>
                  onChange({ priorViolationCount: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {t.legalVehicle}
            </label>
            <select
              className="clw-input"
              data-testid="legal-vehicle-select"
              value={input.legalVehicle}
              onChange={(e) => onChange({ legalVehicle: e.target.value as LegalVehicleKind })}
            >
              {VEHICLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {isAr ? opt.ar : opt.en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {t.emirateOrZone}
            </label>
            <input
              type="text"
              className="clw-input"
              value={input.emirateOrZone}
              onChange={(e) => onChange({ emirateOrZone: e.target.value })}
            />
          </div>

          <label
            className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <span>{t.freezoneOnshoreBranchAuthorized}</span>
            <input
              type="checkbox"
              checked={input.freezoneOnshoreBranchAuthorized}
              onChange={(e) => onChange({ freezoneOnshoreBranchAuthorized: e.target.checked })}
            />
          </label>
        </div>
      </section>

      {/* Section 2: Re-Domiciliation & Share Classes */}
      <section className="clw-card rounded-2xl p-5">
        <h3 className="mb-3.5 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {t.sectionTransfer}
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {t.redomiciliationPath}
            </label>
            <select
              className="clw-input"
              data-testid="redomiciliation-select"
              value={input.redomiciliationPath}
              onChange={(e) =>
                onChange({ redomiciliationPath: e.target.value as RedomiciliationPath })
              }
            >
              {REDOMICILE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {isAr ? opt.ar : opt.en}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span>{t.redomiciliationBoardAndGaApproved}</span>
              <input
                type="checkbox"
                checked={input.redomiciliationBoardAndGaApproved}
                onChange={(e) => onChange({ redomiciliationBoardAndGaApproved: e.target.checked })}
              />
            </label>
            <label
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span>{t.redomiciliationDualRegistrarApproved}</span>
              <input
                type="checkbox"
                data-testid="dual-registrar-checkbox"
                checked={input.redomiciliationDualRegistrarApproved}
                onChange={(e) =>
                  onChange({ redomiciliationDualRegistrarApproved: e.target.checked })
                }
              />
            </label>
            <label
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 sm:col-span-2"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span>{t.redomiciliationCreditorClearanceVerified}</span>
              <input
                type="checkbox"
                checked={input.redomiciliationCreditorClearanceVerified}
                onChange={(e) =>
                  onChange({ redomiciliationCreditorClearanceVerified: e.target.checked })
                }
              />
            </label>
          </div>

          <div>
            <label className="mb-1 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {t.shareClassModel}
            </label>
            <select
              className="clw-input"
              data-testid="share-class-select"
              value={input.shareClassModel}
              onChange={(e) => onChange({ shareClassModel: e.target.value as ShareClassModel })}
            >
              {SHARE_CLASS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {isAr ? opt.ar : opt.en}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 sm:col-span-2"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span>{t.multiClassRightsInMoaRegistered}</span>
              <input
                type="checkbox"
                data-testid="moa-classes-checkbox"
                checked={input.multiClassRightsInMoaRegistered}
                onChange={(e) => onChange({ multiClassRightsInMoaRegistered: e.target.checked })}
              />
            </label>
            <label
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span>{t.hasInKindContributions}</span>
              <input
                type="checkbox"
                checked={input.hasInKindContributions}
                onChange={(e) => onChange({ hasInKindContributions: e.target.checked })}
              />
            </label>
            <label
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span>{t.inKindValuationApproved}</span>
              <input
                type="checkbox"
                checked={input.inKindValuationApproved}
                onChange={(e) => onChange({ inKindValuationApproved: e.target.checked })}
              />
            </label>
          </div>
        </div>
      </section>

      {/* Section 3: Exit Clauses, Non-Profit Lock & Statutory Reserve */}
      <section className="clw-card rounded-2xl p-5">
        <h3 className="mb-3.5 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {t.sectionExitLock}
        </h3>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 gap-2">
            <label
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span>{t.exitClausesAnchoredInMoa}</span>
              <input
                type="checkbox"
                checked={input.exitClausesAnchoredInMoa}
                onChange={(e) => onChange({ exitClausesAnchoredInMoa: e.target.checked })}
              />
            </label>
            <label
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span>{t.successionRofrAndDeadlockInMoa}</span>
              <input
                type="checkbox"
                checked={input.successionRofrAndDeadlockInMoa}
                onChange={(e) => onChange({ successionRofrAndDeadlockInMoa: e.target.checked })}
              />
            </label>
            <label
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span>{t.nonProfitDividendPayoutAttempted}</span>
              <input
                type="checkbox"
                checked={input.nonProfitDividendPayoutAttempted}
                onChange={(e) => onChange({ nonProfitDividendPayoutAttempted: e.target.checked })}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {t.shareCapitalAed}
              </label>
              <input
                type="number"
                min={0}
                className="clw-input clw-mono num-tabular"
                value={input.shareCapitalAed}
                onChange={(e) =>
                  onChange({ shareCapitalAed: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {t.existingStatutoryReserveAed}
              </label>
              <input
                type="number"
                min={0}
                className="clw-input clw-mono num-tabular"
                value={input.existingStatutoryReserveAed}
                onChange={(e) =>
                  onChange({
                    existingStatutoryReserveAed: Math.max(0, Number(e.target.value) || 0),
                  })
                }
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {t.annualNetProfitAed}
              </label>
              <input
                type="number"
                className="clw-input clw-mono num-tabular"
                value={input.annualNetProfitAed}
                onChange={(e) => onChange({ annualNetProfitAed: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {t.annualReserveAllocationPct}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                className="clw-input clw-mono num-tabular"
                value={input.annualReserveAllocationPct}
                onChange={(e) =>
                  onChange({
                    annualReserveAllocationPct: Math.max(0, Number(e.target.value) || 0),
                  })
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Art. 308 Losses, Books & Art. 350 Inspection */}
      <section className="clw-card rounded-2xl p-5">
        <h3 className="mb-3.5 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {t.sectionLosses}
        </h3>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {t.accumulatedLossesAed}
              </label>
              <input
                type="number"
                min={0}
                className="clw-input clw-mono num-tabular"
                data-testid="accumulated-losses-input"
                value={input.accumulatedLossesAed}
                onChange={(e) =>
                  onChange({ accumulatedLossesAed: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {t.daysSinceLossDisclosure}
              </label>
              <input
                type="number"
                min={0}
                max={3650}
                className="clw-input clw-mono num-tabular"
                value={input.daysSinceLossDisclosure}
                onChange={(e) =>
                  onChange({ daysSinceLossDisclosure: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span>{t.generalAssemblyConvenedForLoss}</span>
              <input
                type="checkbox"
                checked={input.generalAssemblyConvenedForLoss}
                onChange={(e) => onChange({ generalAssemblyConvenedForLoss: e.target.checked })}
              />
            </label>
            <label
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span>{t.dissolutionMinority25PctPetition}</span>
              <input
                type="checkbox"
                checked={input.dissolutionMinority25PctPetition}
                onChange={(e) =>
                  onChange({ dissolutionMinority25PctPetition: e.target.checked })
                }
              />
            </label>
            <label
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span>{t.accountingBooksMaintained}</span>
              <input
                type="checkbox"
                checked={input.accountingBooksMaintained}
                onChange={(e) => onChange({ accountingBooksMaintained: e.target.checked })}
              />
            </label>
            <label
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <span>{t.inspectorCooperationBlocked}</span>
              <input
                type="checkbox"
                checked={input.inspectorCooperationBlocked}
                onChange={(e) => onChange({ inspectorCooperationBlocked: e.target.checked })}
              />
            </label>
          </div>

          <div>
            <label className="mb-1 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {t.notes}
            </label>
            <input
              type="text"
              className="clw-input"
              value={input.notes || ''}
              onChange={(e) => onChange({ notes: e.target.value })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
