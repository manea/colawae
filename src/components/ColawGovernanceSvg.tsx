import type { AssessmentInput, ObligationsEvaluation } from '../core/types.ts';
import type { Locale } from '../lib/i18n.ts';

interface Props {
  locale: Locale;
  input: AssessmentInput;
  obligations: ObligationsEvaluation;
}

export function ColawGovernanceSvg({ locale, input, obligations }: Props) {
  const isAr = locale === 'ar';

  const gates = [
    {
      title: isAr ? 'نقل القيد (م 15 مكرر)' : 'Re-Domicile (Art. 15 bis)',
      limit: input.redomiciliationPath === 'none' ? (isAr ? 'مقيد محلياً' : 'Stationary') : isAr ? 'بلا تصفية' : 'No Liquidation',
      sub: obligations.scopeOrRedomiciliationGap
        ? isAr
          ? 'موافقة/براءة ذمة ناقصة'
          : 'Gap in Approvals'
        : isAr
          ? 'قيد متصل ✓'
          : 'Continuity OK ✓',
      tone: obligations.scopeOrRedomiciliationGap ? 'amber' : 'emerald',
    },
    {
      title: isAr ? 'فئات الحصص (م 76/4)' : 'Multi-Class (Art. 76(4))',
      limit:
        input.shareClassModel === 'single_ordinary'
          ? isAr
            ? 'فئة عادية'
            : 'Single Class'
          : isAr
            ? 'فئات متعددة'
            : 'Multi-Class',
      sub: obligations.multiClassOrInKindGap
        ? isAr
          ? 'اتفاق جانبي / بلا تقييم'
          : 'Unanchored / Unvalued'
        : isAr
          ? 'مثبّت بعقد التأسيس ✓'
          : 'MoA Registered ✓',
      tone: obligations.multiClassOrInKindGap ? 'amber' : 'emerald',
    },
    {
      title: isAr ? 'الاحتياطي (م 103)' : 'Reserve (Art. 103)',
      limit: isAr ? '5% حتى 50%' : '5% to 50% Cap',
      sub: obligations.reserveStopCapReached
        ? isAr
          ? `الرصيد ${obligations.reservePctOfCapital}% (توقف اختياري ✓)`
          : `${obligations.reservePctOfCapital}% Cap Reached ✓`
        : obligations.reserveGap
          ? isAr
            ? `تجنيب ${input.annualReserveAllocationPct}% < 5%`
            : `Alloc ${input.annualReserveAllocationPct}% < 5%`
          : isAr
            ? `${obligations.reservePctOfCapital}% من رأس المال ✓`
            : `${obligations.reservePctOfCapital}% of Capital ✓`,
      tone: obligations.reserveGap ? 'amber' : 'emerald',
    },
    {
      title: isAr ? 'خسائر م 308 (30ي)' : 'Loss Art. 308 (30d GA)',
      limit: isAr ? 'حد 50% / 75%' : '>= 50% / 75%',
      sub: obligations.gaSlaBreached
        ? isAr
          ? `خسارة ${obligations.lossRatioPct}% · تجاوز 30ي`
          : `${obligations.lossRatioPct}% · GA Overdue`
        : obligations.minorityDissolutionRightActive
          ? isAr
            ? `خسارة ${obligations.lossRatioPct}% · حق حل 25%`
            : `${obligations.lossRatioPct}% · 25% Dissolution`
          : isAr
            ? `خسارة ${obligations.lossRatioPct}% ✓`
            : `Loss ${obligations.lossRatioPct}% ✓`,
      tone: obligations.gaSlaBreached
        ? 'crimson'
        : obligations.gaMandatoryTriggered
          ? 'amber'
          : 'emerald',
    },
  ] as const;

  const ladder = [
    {
      code: 'compliant',
      title: isAr ? 'سجل ممتثل' : 'Compliant / Exempt',
      fine: isAr ? '0 د.إ' : 'AED 0',
      sub: isAr ? 'توافق كامل 32/2021 و20/2025' : 'Full MoA, Reserve & Loss Sync',
      active:
        obligations.sanctionTierCode === 'compliant_no_penalty' ||
        obligations.sanctionTierCode === 'exempt_freezone_carveout',
      tone: 'emerald',
    },
    {
      code: 'warning',
      title: isAr ? 'إنذار خطي (30ي)' : '1st Warning (30d)',
      fine: isAr ? 'تصحيح 30 يوماً' : '30d Rectify',
      sub: isAr ? 'قرار 102/2022 للمرة الأولى' : 'CR 102/2022 1st Instance',
      active: obligations.sanctionTierCode === 'written_warning_30d',
      tone: 'amber',
    },
    {
      code: 'escalated',
      title: isAr ? 'غرامة ومضاعفة (1x/2x)' : 'Admin 1x / 2x Escalation',
      fine: isAr ? '10k إلى 200k د.إ' : 'AED 10k–200k',
      sub: isAr ? 'غرامة أولى ثم مضاعفة 2x' : '10k/15k/100k -> 2x Repeat',
      active:
        obligations.sanctionTierCode === 'admin_fine_10k_15k' ||
        obligations.sanctionTierCode === 'admin_fine_50k_100k' ||
        obligations.sanctionTierCode === 'escalated_double_200k',
      tone: 'amber',
    },
    {
      code: 'severe',
      title: isAr ? 'تشديد 3x وعرقلة م 350' : '3x Cap / Art. 350',
      fine: isAr ? '300k د.إ / 24 ش' : 'AED 300k / 24m',
      sub: isAr ? 'وقف رخصة أو حبس م 350' : 'Licence Risk / 3m–2y Custody',
      active:
        obligations.sanctionTierCode === 'escalated_triple_licence_risk_300k' ||
        obligations.sanctionTierCode === 'criminal_art350_obstruction',
      tone: 'crimson',
    },
  ] as const;

  const toneColor = (tone: 'emerald' | 'amber' | 'crimson') => {
    if (tone === 'crimson') return 'var(--accent-crimson)';
    if (tone === 'amber') return 'var(--accent-amber)';
    return 'var(--accent-emerald)';
  };

  return (
    <section className="clw-card rounded-2xl p-5" data-testid="governance-svg-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {isAr
              ? 'خريطة ضوابط تعديلات قانون الشركات (20/2025) وسلم جزاءات (102/2022 و350)'
              : 'UAE FDL 20/2025 Governance Matrix & CR 102/2022 Penalty Escalation'}
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {isAr
              ? 'مراقبة المادة 15 مكرر وفئات م 76(4) والاحتياطي 5%/50% وعجز رأس المال 50%/75% ومهلة 30 يوماً'
              : 'Live tracker for Art. 15 bis migration, Art. 76(4) share classes, 5%/50% reserve, and Art. 308 30-day call'}
          </p>
        </div>
        <div
          className="clw-mono num-tabular rounded-lg px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
        >
          {isAr
            ? `السقف التقديري: ${obligations.projectedMaximumFineAed.toLocaleString('en-US')} د.إ`
            : `Est. Max Fine: AED ${obligations.projectedMaximumFineAed.toLocaleString('en-US')}`}
        </div>
      </div>

      <div dir="ltr">
      <svg
        viewBox="0 0 880 340"
        className="w-full h-auto"
        role="img"
        aria-label={
          isAr
            ? 'مخطط تعديلات قانون الشركات الإماراتي وسلم الجزاءات'
            : 'UAE Commercial Companies Law Thresholds and Sanction Ladder'
        }
      >
        <rect
          x="4"
          y="4"
          width="872"
          height="332"
          rx="14"
          fill="var(--bg-elevated)"
          fillOpacity="0.45"
          stroke="var(--border-subtle)"
          strokeWidth="1.2"
        />

        <text
          x={isAr ? 860 : 20}
          y="30"
          fill="var(--text-secondary)"
          fontSize="12"
          fontWeight="700"
          style={{ direction: isAr ? 'rtl' : 'ltr' }}
        >
          {isAr
            ? '1) بوابات تعديلات قانون الشركات (م 15 مكرر، م 76/4، م 103، م 308)'
            : '1) STATUTORY GATES (FDL 20/2025 ARTS. 15 bis, 76(4), 103 & 308)'}
        </text>

        {gates.map((gate, i) => {
          const cardIndex = isAr ? gates.length - 1 - i : i;
          const x = 18 + cardIndex * 212;
          const textX = isAr ? 190 : 12;
          const color = toneColor(gate.tone);
          return (
            <g key={gate.title} transform={`translate(${x}, 44)`}>
              <rect
                x="0"
                y="0"
                width="202"
                height="112"
                rx="10"
                fill="var(--bg-surface)"
                stroke={color}
                strokeWidth="2"
              />
              <text
                x={textX}
                y="24"
                fill="var(--text-primary)"
                fontSize="12"
                fontWeight="700"
                style={{ direction: isAr ? 'rtl' : 'ltr' }}
              >
                {gate.title}
              </text>
              <text
                x={textX}
                y="60"
                fill={color}
                fontSize="17"
                fontWeight="800"
                style={{ direction: isAr ? 'rtl' : 'ltr' }}
              >
                {gate.limit}
              </text>
              <text
                x={textX}
                y="92"
                fill="var(--text-secondary)"
                fontSize="11.5"
                fontWeight="600"
                style={{ direction: isAr ? 'rtl' : 'ltr' }}
              >
                {gate.sub}
              </text>
            </g>
          );
        })}

        <text
          x={isAr ? 860 : 20}
          y="182"
          fill="var(--text-secondary)"
          fontSize="12"
          fontWeight="700"
          style={{ direction: isAr ? 'rtl' : 'ltr' }}
        >
          {isAr
            ? '2) سُلّم الجزاءات التصاعدي ومخالفة التفتيش (قرار 102/2022 والمادة 350)'
            : '2) PENALTY ESCALATION & CUSTODY LADDER (CR 102/2022 & ART. 350)'}
        </text>

        {ladder.map((step, i) => {
          const cardIndex = isAr ? ladder.length - 1 - i : i;
          const x = 18 + cardIndex * 212;
          const textX = isAr ? 190 : 12;
          const color = toneColor(step.tone);
          return (
            <g key={step.code} transform={`translate(${x}, 196)`}>
              <rect
                x="0"
                y="0"
                width="202"
                height="124"
                rx="10"
                fill="var(--bg-surface)"
                stroke={step.active ? color : 'var(--border-subtle)'}
                strokeWidth={step.active ? 2.6 : 1.2}
              />
              <text
                x={textX}
                y="24"
                fill="var(--text-primary)"
                fontSize="12.5"
                fontWeight="700"
                style={{ direction: isAr ? 'rtl' : 'ltr' }}
              >
                {step.title}
              </text>
              <text
                x={textX}
                y="56"
                fill={color}
                fontSize="17"
                fontWeight="800"
                style={{ direction: isAr ? 'rtl' : 'ltr' }}
              >
                {step.fine}
              </text>
              <text
                x={textX}
                y="84"
                fill="var(--text-secondary)"
                fontSize="11"
                style={{ direction: isAr ? 'rtl' : 'ltr' }}
              >
                {step.sub}
              </text>
              {step.active ? (
                <g transform={`translate(${isAr ? 100 : 12}, 95)`}>
                  <rect x="0" y="0" width="90" height="20" rx="6" fill={color} />
                  <text
                    x="45"
                    y="14"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="10.5"
                    fontWeight="700"
                    style={{ direction: isAr ? 'rtl' : 'ltr' }}
                  >
                    {isAr ? 'الوضع الحالي' : 'ACTIVE TIER'}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
      </div>
    </section>
  );
}
