import type {
  AssessmentInput,
  AssessmentResult,
  LegalVehicleKind,
  RedomiciliationPath,
  ShareClassModel,
} from './types.ts';

function escMdCell(value: unknown): string {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function formatNum(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : decimals,
    maximumFractionDigits: decimals,
  });
}

const VEHICLE_LABELS: Record<LegalVehicleKind, { ar: string; en: string }> = {
  mainland_llc: {
    ar: 'شركة ذات مسؤولية محدودة بالبر الرئيسي (LLC)',
    en: 'UAE Mainland Limited Liability Company (LLC)',
  },
  mainland_spc: {
    ar: 'شركة الشخص الواحد بالبر الرئيسي (SPC)',
    en: 'UAE Mainland Single-Person LLC (SPC)',
  },
  mainland_prjsc: {
    ar: 'شركة مساهمة خاصة بالبر الرئيسي (PrJSC)',
    en: 'UAE Mainland Private Joint Stock Company (PrJSC)',
  },
  mainland_pjsc: {
    ar: 'شركة مساهمة عامة بالبر الرئيسي (PJSC)',
    en: 'UAE Mainland Public Joint Stock Company (PJSC)',
  },
  mainland_nonprofit: {
    ar: 'شركة تجارية غير ربحية بالبر الرئيسي (المادة 8)',
    en: 'UAE Mainland Non-Profit Commercial Company (Art. 8)',
  },
  freezone_within_zone: {
    ar: 'شركة منطقة حرة تجارية داخل نطاق المنطقة (مستثناة)',
    en: 'Commercial Free-Zone Entity Operating Within Zone (Carved Out)',
  },
  freezone_onshore_trading: {
    ar: 'شركة منطقة حرة تزاول أعمالاً بالبر الرئيسي (المادة 5)',
    en: 'Free-Zone Entity Conducting Mainland Operations (Art. 5)',
  },
  difc_adgm_exempt: {
    ar: 'كيان منطقة حرة مالية (DIFC / ADGM — مستثنى ما لم ينقل القيد)',
    en: 'Financial Free Zone Entity (DIFC / ADGM — Exempt Outside Transfer)',
  },
};

const REDOMICILIATION_LABELS: Record<RedomiciliationPath, { ar: string; en: string }> = {
  none: { ar: 'لا يوجد انتقال حالياً', en: 'No Internal Transfer' },
  emirate_to_emirate: {
    ar: 'نقل قيد بين إمارتين بالبر الرئيسي (DET <-> ADDED)',
    en: 'Emirate-to-Emirate Mainland Migration (DET <-> ADDED)',
  },
  freezone_to_mainland: {
    ar: 'نقل قيد من المنطقة الحرة إلى البر الرئيسي (م 15 مكرر)',
    en: 'Free Zone to UAE Mainland Migration (Art. 15 bis)',
  },
  mainland_to_freezone: {
    ar: 'نقل قيد من البر الرئيسي إلى المنطقة الحرة (م 15 مكرر)',
    en: 'UAE Mainland to Free Zone Migration (Art. 15 bis)',
  },
  freezone_to_freezone: {
    ar: 'نقل قيد بين منطقتين حرتين دون تصفية (م 15 مكرر)',
    en: 'Free Zone to Free Zone Transfer Without Liquidation (Art. 15 bis)',
  },
};

const SHARE_CLASS_LABELS: Record<ShareClassModel, { ar: string; en: string }> = {
  single_ordinary: {
    ar: 'حصص عادية موحدة القيمة والتصويت',
    en: 'Single Ordinary Share Class',
  },
  multi_class_moa_registered: {
    ar: 'فئات حصص متعددة مثبّتة بعقد التأسيس (م 76/4)',
    en: 'Multi-Class Shares Registered in MoA/AoA (Art. 76(4))',
  },
  multi_class_side_letter_only: {
    ar: 'فئات حصص باتفاقية جانبية غير مسجلة بعقد التأسيس',
    en: 'Unregistered Side-Letter Multi-Class Terms Only',
  },
};

export function buildColawBriefMarkdown(
  input: AssessmentInput,
  result: AssessmentResult,
  dossierCode: string,
  sha256Digest = '',
  locale: 'en' | 'ar' = 'ar',
): string {
  const digest = sha256Digest || result.dossierSha256 || '';
  const vehicleLbl = VEHICLE_LABELS[input.legalVehicle] ?? {
    ar: input.legalVehicle,
    en: input.legalVehicle,
  };
  const transferLbl = REDOMICILIATION_LABELS[input.redomiciliationPath] ?? {
    ar: input.redomiciliationPath,
    en: input.redomiciliationPath,
  };
  const classLbl = SHARE_CLASS_LABELS[input.shareClassModel] ?? {
    ar: input.shareClassModel,
    en: input.shareClassModel,
  };
  const { obligations, csvAudit } = result;

  if (locale === 'ar') {
    const lines: string[] = [
      `# موجز جاهزية قانون الشركات الإماراتي (FDL 32/2021, FDL 20/2025 & CR 102/2022) — \`${escMdCell(dossierCode)}\``,
      '',
      `> **تنويه الاستقلالية:** ${result.disclaimerAr}`,
      '',
      '## 1. هوية الشركة وموقف المادة (15 مكرر) وفئات الحصص وخسائر رأس المال',
      '',
      '| البند | القيمة |',
      '|---|---|',
      `| رمز الملف | \`${escMdCell(dossierCode)}\` |`,
      `| المحرك والإصدار | \`CoLawAE v${escMdCell(result.toolVersion)}\` |`,
      `| اسم المنشأة | ${escMdCell(input.companyName)} |`,
      `| الرقم الضريبي (\`100 TRN\`) | \`${escMdCell(input.tradeTrn || 'N/A')}\` (${obligations.trnIssueReason === 'optional_empty' ? 'اختياري غير مرفق' : obligations.trnValidOrEmpty ? 'صالح ✓' : 'غير صالح ✗'}) |`,
      `| الشكل القانوني | ${vehicleLbl.ar} |`,
      `| مسار نقل القيد (\`م 15 مكرر\`) | ${transferLbl.ar} (${obligations.scopeOrRedomiciliationGap ? 'يتطلب استكمال الموافقات ✗' : 'مستوفى ✓'}) |`,
      `| فئات الحصص (\`م 76/4 و78\`) | ${classLbl.ar} \| عيني: ${input.hasInKindContributions ? (input.inKindValuationApproved ? 'مقيّم ✓' : 'بلا تقييم ✗') : 'لا يوجد'} |`,
      `| الاحتياطي القانوني (\`م 103\`) | \`${formatNum(obligations.reservePctOfCapital)}%\` من رأس المال (سقف \`50%\`: ${obligations.reserveStopCapReached ? 'مكتمل ✓' : `استقطاع سنوي مستحق: ${formatNum(obligations.projectedStatutoryReserveTransferAed)} د.إ`}) |`,
      `| خسائر رأس المال (\`م 308/309\`) | \`${formatNum(obligations.lossRatioPct)}%\` (\`${obligations.lossBand}\`) \| دعوة \`30 يوماً\`: ${obligations.gaMandatoryTriggered ? (obligations.gaSlaBreached ? 'متجاوزة ✗' : 'مستوفاة/ضمن المهلة ✓') : 'غير مطلوبة'} \| حق أقلية \`25%\`: ${obligations.minorityDissolutionRightActive ? 'نشط' : 'غير نشط'} |`,
      `| مرحلة الجزاءات (\`CR 102/2022 & Art. 350\`) | \`${obligations.sanctionTierCode}\` |`,
      `| التقدير الإداري / الجنائي | \`${formatNum(obligations.projectedMinimumFineAed)}–${formatNum(obligations.projectedMaximumFineAed)} د.إ\` \| وقف الرخصة: **${obligations.licenceSuspensionOrCancellationRisk ? 'قائم' : 'لا'}** \| عرقلة التفتيش (\`م 350\`): **${obligations.criminalCustodyRiskMonths > 0 ? `حتى ${obligations.criminalCustodyRiskMonths} شهراً` : 'لا'}** |`,
      `| حالة الجاهزية والدرجة | **${result.readinessStatus.toUpperCase()}** (**${result.readinessScore}/100**) |`,
      `| بصمة التثبيت \`SHA-256\` | \`${escMdCell(digest || 'PENDING')}\` |`,
      '',
      '## 2. مصفوفة الضوابط السباعية (FDL 32/2021 & FDL 20/2025)',
      '',
      '| الضابط | الحالة | المرجع القانوني | التفاصيل وإجراء المعالجة |',
      '|---|---|---|---|',
    ];

    for (const c of result.controls) {
      const badge = c.passed ? 'ممتثل ✓' : `فجوة (${c.severity.toUpperCase()}) ✗`;
      lines.push(
        `| \`${escMdCell(c.id)}\` — ${escMdCell(c.titleAr)} | ${badge} | ${escMdCell(c.legalRef)} | ${escMdCell(c.detailAr)} **الإجراء:** ${escMdCell(c.remediationAr)} |`,
      );
    }

    if (csvAudit) {
      lines.push(
        '',
        '## 3. ملخص تدقيق جدول الحصص والفئات (CSV CWE-1236)',
        '',
        `- إجمالي الصفوف: **${csvAudit.totalRows}** (ممتثل: **${csvAudit.compliantRows}** · تنبيه: **${csvAudit.warningRows}** · مخالفة: **${csvAudit.violationRows}**)`,
        `- مجموع نسب الملكية: **${formatNum(csvAudit.totalEquityPct)}%** (${csvAudit.equitySumValid ? 'مطابق 100% ✓' : 'خلل بالمجموع ✗'}) · مجموع التصويت: **${formatNum(csvAudit.totalVotingPct)}%** (${csvAudit.votingSumValid ? 'مطابق 100% ✓' : 'خلل بالمجموع ✗'})`,
        `- الحقول المعقمة \`CWE-1236\`: **${csvAudit.sanitizedCellsCount}**`,
      );
    }

    return lines.join('\n') + '\n';
  }

  const lines: string[] = [
    `# UAE Commercial Companies Law Readiness Brief (FDL 32/2021, FDL 20/2025 & CR 102/2022) — \`${escMdCell(dossierCode)}\``,
    '',
    `> **Independence Notice:** ${result.disclaimerEn}`,
    '',
    '## 1. Entity Profile, Art. 15 bis Re-Domiciliation, Multi-Class Equity & Art. 308 Exposure',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Dossier Code | \`${escMdCell(dossierCode)}\` |`,
    `| Engine & Version | \`CoLawAE v${escMdCell(result.toolVersion)}\` |`,
    `| Legal Entity Name | ${escMdCell(input.companyName)} |`,
    `| UAE TRN (\`100\`) | \`${escMdCell(input.tradeTrn || 'N/A')}\` (${obligations.trnIssueReason === 'optional_empty' ? 'Optional Empty' : obligations.trnValidOrEmpty ? 'Valid ✓' : 'Invalid ✗'}) |`,
    `| Legal Vehicle | ${vehicleLbl.en} |`,
    `| Re-Domiciliation (\`Art. 15 bis\`) | ${transferLbl.en} (${obligations.scopeOrRedomiciliationGap ? 'Incomplete Approvals ✗' : 'Aligned ✓'}) |`,
    `| Share Classes (\`Arts. 76(4) & 78\`) | ${classLbl.en} \| In-Kind: ${input.hasInKindContributions ? (input.inKindValuationApproved ? 'Valued ✓' : 'Unvalued ✗') : 'None'} |`,
    `| Statutory Reserve (\`Art. 103\`) | \`${formatNum(obligations.reservePctOfCapital)}%\` of Share Capital (\`50%\` Cap: ${obligations.reserveStopCapReached ? 'Reached ✓' : `Projected 5% Allocation: AED ${formatNum(obligations.projectedStatutoryReserveTransferAed)}`}) |`,
    `| Capital Losses (\`Art. 308/309\`) | \`${formatNum(obligations.lossRatioPct)}%\` (\`${obligations.lossBand}\`) \| 30d GA Call: ${obligations.gaMandatoryTriggered ? (obligations.gaSlaBreached ? 'Overdue ✗' : 'Compliant ✓') : 'Not Triggered'} \| 25% Minority Dissolution: ${obligations.minorityDissolutionRightActive ? 'Active' : 'Inactive'} |`,
    `| Sanction Tier (\`CR 102/2022 & Art. 350\`) | \`${obligations.sanctionTierCode}\` |`,
    `| Fine & Custody Exposure | \`AED ${formatNum(obligations.projectedMinimumFineAed)}–${formatNum(obligations.projectedMaximumFineAed)}\` \| Licence Risk: **${obligations.licenceSuspensionOrCancellationRisk ? 'YES' : 'NO'}** \| Art. 350 Custody Risk: **${obligations.criminalCustodyRiskMonths > 0 ? `Up to ${obligations.criminalCustodyRiskMonths}m` : 'None'}** |`,
    `| Readiness Status & Score | **${result.readinessStatus.toUpperCase()}** (**${result.readinessScore}/100**) |`,
    `| \`SHA-256\` Digest | \`${escMdCell(digest || 'PENDING')}\` |`,
    '',
    '## 2. Seven-Control Governance Matrix (FDL 32/2021 & FDL 20/2025)',
    '',
    '| Control | Status | Legal Ref | Details & Remediation |',
    '|---|---|---|---|',
  ];

  for (const c of result.controls) {
    const badge = c.passed ? 'PASSED ✓' : `GAP (${c.severity.toUpperCase()}) ✗`;
    lines.push(
      `| \`${escMdCell(c.id)}\` — ${escMdCell(c.titleEn)} | ${badge} | ${escMdCell(c.legalRef)} | ${escMdCell(c.detailEn)} **Action:** ${escMdCell(c.remediationEn)} |`,
    );
  }

  if (csvAudit) {
    lines.push(
      '',
      '## 3. Batch Cap-Table & Governance Register CSV Audit (CWE-1236 Safe)',
      '',
      `- Total Rows Audited: **${csvAudit.totalRows}** (Compliant: **${csvAudit.compliantRows}** · Warning: **${csvAudit.warningRows}** · Violation: **${csvAudit.violationRows}**)`,
      `- Total Equity Weight: **${formatNum(csvAudit.totalEquityPct)}%** (${csvAudit.equitySumValid ? 'Valid 100% ✓' : 'Mismatch ✗'}) · Total Voting Weight: **${formatNum(csvAudit.totalVotingPct)}%** (${csvAudit.votingSumValid ? 'Valid 100% ✓' : 'Mismatch ✗'})`,
      `- Neutralized Formula Injections (\`CWE-1236\`): **${csvAudit.sanitizedCellsCount}**`,
    );
  }

  return lines.join('\n') + '\n';
}
