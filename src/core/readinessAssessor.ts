import type {
  AssessmentInput,
  AssessmentResult,
  FindingItem,
  ReadinessStatus,
} from './types.ts';
import {
  COLAWAE_TOOL_VERSION,
  COLAW_CONTROLS,
  LEGAL_DISCLAIMER_AR,
  LEGAL_DISCLAIMER_EN,
} from './colawCatalog.ts';
import { evaluateColawObligations } from './colawEngine.ts';
import { auditCapTableCsv } from './capTableCsvAuditor.ts';
import { canonicalizeDossierPayload, computePayloadDigest } from './dossierDigest.ts';

export function evaluateColawCoreSync(input: AssessmentInput): AssessmentResult {
  const obligations = evaluateColawObligations(input);

  const csvAudit =
    input.capTableCsv && input.capTableCsv.trim().length > 0
      ? auditCapTableCsv(input.capTableCsv)
      : null;

  const controls: FindingItem[] = COLAW_CONTROLS.map((spec) => {
    let passed = true;
    let detailAr = spec.summaryAr;
    let detailEn = spec.summaryEn;
    let remediationAr = 'مكتمل — حافظ على تحديث عقد التأسيس وسجل الشركاء والاحتياطي 5%.';
    let remediationEn = 'Compliant — keep MoA/AoA class registrations, reserves, and records current.';

    switch (spec.id) {
      case 'CLW-CTRL-01': {
        passed = !obligations.scopeOrRedomiciliationGap;
        if (!passed) {
          detailAr =
            input.legalVehicle === 'freezone_onshore_trading' && !input.freezoneOnshoreBranchAuthorized
              ? 'ممارسة أعمال في البر الرئيسي من منشأة منطقة حرة دون ترخيص فرع أو موافقة مختصة يخالف المادة (5).'
              : 'إجراء نقل القيد الداخلي (المادة 15 مكرر) يفتقر لموافقة الجمعية العمومية أو المسجلَين أو تسوية الدائنين.';
          detailEn =
            input.legalVehicle === 'freezone_onshore_trading' && !input.freezoneOnshoreBranchAuthorized
              ? 'Free-zone entity operating onshore without authorized branch/mainland registration violates Art. 5 scope.'
              : 'Art. 15 bis liquidation-free re-domiciliation lacks special GA approval, dual-registrar consent, or creditor clearance.';
          remediationAr =
            'أكمل موافقات السجل المُصدِر والمستقبِل وقرارات الشركاء وبراءة ذمة الدائنين أو استصدر رخصة فرع بالبر الرئيسي.';
          remediationEn =
            'Obtain outgoing/incoming registrar approvals, assembly resolution, and creditor clearance (or register an onshore branch).';
        }
        break;
      }

      case 'CLW-CTRL-02': {
        passed = !obligations.multiClassOrInKindGap;
        if (!passed) {
          detailAr =
            'تطبيق فئات حصص متعددة عبر اتفاقية جانبية غير مثبّتة في عقد التأسيس (م 76/4)، أو وجود حصص عينية بلا تقييم معتمد (م 78).';
          detailEn =
            'Multi-class share terms rely on an unregistered side letter instead of registered MoA/AoA (Art. 76(4)), or in-kind assets lack valuation (Art. 78).';
          remediationAr =
            'عدّل عقد التأسيس والنظام الأساسي لتثبيت حقوق التصويت والأرباح والتصفية، ووثّق تقييم الحصص العينية.';
          remediationEn =
            'Amend and register the MoA/AoA specifying share-class rights and complete MoE-authorized in-kind valuation.';
        }
        break;
      }

      case 'CLW-CTRL-03': {
        passed = !obligations.exitAndSuccessionGap;
        if (!passed) {
          detailAr =
            'عدم تثبيت شروط السحب والمصاحبة (Drag/Tag-Along) أو أولوية شراء حصة الشريك المتوفى (RoFR) وفك الجمود (م 85) في عقد التأسيس.';
          detailEn =
            'Drag-Along / Tag-Along exit clauses, deceased-partner succession RoFR, or Art. 85 deadlock mechanics are absent from the registered MoA.';
          remediationAr =
            'أدرج بنود Drag-Along وTag-Along وآلية تقييم حصة الشريك المتوفى وفك جمود الإدارة صراحةً بعقد التأسيس.';
          remediationEn =
            'Embed Drag-Along / Tag-Along rights, pre-agreed heir buyout valuation formulas, and deadlock remedies in the MoA/AoA.';
        }
        break;
      }

      case 'CLW-CTRL-04': {
        passed = !obligations.nonProfitViolation && !obligations.reserveGap;
        if (!passed) {
          detailAr = obligations.nonProfitViolation
            ? 'محاولة توزيع أرباح في شركة تجارية غير ربحية يخالف الحظر الكامل بالمادة (8).'
            : `الاحتياطي القانوني (${obligations.reservePctOfCapital}%) أقل من سقف 50% ويُشترط تجنيب 5% من الأرباح السنوية بموجب المادة (103).`;
          detailEn = obligations.nonProfitViolation
            ? 'Dividend payout on a non-profit commercial company violates the mandatory Art. 8 profit-reinvestment lock.'
            : `Statutory reserve is at ${obligations.reservePctOfCapital}% (<50% cap) with annual profit allocation below 5% under Art. 103.`;
          remediationAr = obligations.nonProfitViolation
            ? 'ألغِ أي توزيعات نقدية للشركاء وأعد توجيه صافي الفائض لأغراض الشركة غير الربحية.'
            : 'اعتماد تجنيب 5% من صافي الأرباح السنوية حتى يبلغ الاحتياطي القانوني 50% من رأس المال.';
          remediationEn = obligations.nonProfitViolation
            ? 'Cancel shareholder dividend payouts and lock 100% net surplus inside the non-profit objectives.'
            : 'Allocate at least 5% of annual net profits to the statutory reserve until 50% share-capital coverage.';
        }
        break;
      }

      case 'CLW-CTRL-05': {
        passed = !obligations.gaSlaBreached;
        if (!passed) {
          detailAr = `بلوغ الخسائر المتراكمة ${obligations.lossRatioPct}% من رأس المال وتجاوز مهلة 30 يوماً دون دعوة الجمعية العمومية (م 308/309${obligations.minorityDissolutionRightActive ? ' — مع قيام حق أقلية 25% لطلب الحل عند >= 75%' : ''}).`;
          detailEn = `Accumulated capital losses reached ${obligations.lossRatioPct}% (>50% threshold) without convening a General Assembly within 30 days (Art. 308/309).`;
          remediationAr =
            'ادعُ الجمعية العمومية فوراً بخطة استمرارية أو رسملة أو تصويت خاص، ووثّق محضر المادة 308.';
          remediationEn =
            'Convene the General Assembly immediately to vote on continuity/recapitalization vs. dissolution per Art. 308/309.';
        }
        break;
      }

      case 'CLW-CTRL-06': {
        passed = !obligations.booksOrInspectionGap && obligations.trnValidOrEmpty;
        if (!passed) {
          detailAr = input.inspectorCooperationBlocked
            ? 'حجب الدفاتر أو عدم التعاون مع مفتشي الوزارة/الهيئة يعرض المسؤولين لعقوبة المادة (350): حبس حتى سنتين وغرامة 10k–100k د.إ.'
            : !obligations.trnValidOrEmpty
              ? 'الرقم الضريبي الإماراتي غير مطابق لصيغة 15 خانة بادئة بـ 100.'
              : 'نقص في مسك الدفاتر المحاسبية النظامية أو غياب جاهزية التفتيش والتظلم (30 يوماً بموجب قرار 102/2022).';
          detailEn = input.inspectorCooperationBlocked
            ? 'Withholding documents from authorized MoE/SCA inspectors triggers Art. 350 criminal liability (3m-2y custody & AED 10k-100k fine).'
            : !obligations.trnValidOrEmpty
              ? 'Entered UAE TRN does not match the 15-digit 100-prefixed format.'
              : 'Statutory accounting records incomplete or inspection readiness deficient under Arts. 341/350 & CR 102/2022.';
          remediationAr =
            'وفّر السجلات المحاسبية والبيانات المطلوبة كاملة للمفتشين النظاميين وتحقق من صحة الرقم الضريبي 100.';
          remediationEn =
            'Maintain complete accounting ledgers, cooperate promptly with statutory inspectors, and validate 100-prefixed TRNs.';
        }
        break;
      }

      case 'CLW-CTRL-07': {
        if (csvAudit) {
          passed =
            csvAudit.violationRows === 0 &&
            csvAudit.equitySumValid &&
            csvAudit.votingSumValid;
          if (!passed) {
            detailAr = `كشف تدقيق جدول الحصص: ${csvAudit.violationRows} صف مخالفة، مجموع الملكية ${csvAudit.totalEquityPct}%، مجموع التصويت ${csvAudit.totalVotingPct}%${csvAudit.sanitizedCellsCount > 0 ? `، وتحييد ${csvAudit.sanitizedCellsCount} صيغة خطرة` : ''}.`;
            detailEn = `Cap-table CSV audit found ${csvAudit.violationRows} violation row(s), ${csvAudit.totalEquityPct}% equity sum, ${csvAudit.totalVotingPct}% voting sum.`;
            remediationAr =
              'صحّح مجموع نسب الملكية والتصويت إلى 100%، وثبّت الفئات بعقد التأسيس، وقيّم الحصص العينية.';
            remediationEn =
              'Reconcile equity/voting weights to 100%, anchor share classes in MoA, and clear Art. 308/Art. 8 row violations.';
          }
        }
        break;
      }

      default:
        break;
    }

    return {
      id: spec.id,
      severity: spec.severity,
      legalRef: spec.legalRef,
      passed,
      weight: spec.weight,
      titleAr: spec.titleAr,
      titleEn: spec.titleEn,
      detailAr,
      detailEn,
      remediationAr,
      remediationEn,
    };
  });

  const readinessScore = controls.reduce(
    (sum, item) => sum + (item.passed ? item.weight : 0),
    0,
  );
  const passedControlsCount = controls.filter((c) => c.passed).length;

  const hasCriticalBlocker =
    obligations.criminalCustodyRiskMonths > 0 ||
    obligations.licenceSuspensionOrCancellationRisk ||
    obligations.nonProfitViolation ||
    obligations.gaSlaBreached ||
    obligations.sanctionTierCode === 'escalated_double_200k' ||
    obligations.sanctionTierCode === 'escalated_triple_licence_risk_300k';

  let readinessStatus: ReadinessStatus = 'ready';
  if (hasCriticalBlocker || readinessScore < 50) {
    readinessStatus = 'blocked';
  } else if (passedControlsCount < controls.length) {
    readinessStatus = 'conditional';
  }

  const basePayload = {
    toolVersion: COLAWAE_TOOL_VERSION,
    legalFrameworkRef: 'UAE FDL 32/2021 + FDL 20/2025 (eff. 2025-11-15) + CR 102/2022',
    readinessStatus,
    readinessScore,
    passedControlsCount,
    totalControlsCount: controls.length,
    obligations,
    controls,
    csvAudit,
    disclaimerAr: LEGAL_DISCLAIMER_AR,
    disclaimerEn: LEGAL_DISCLAIMER_EN,
  };

  return {
    ...basePayload,
    canonicalText: canonicalizeDossierPayload(basePayload),
    dossierSha256: '',
  };
}

export async function assessColawReadiness(input: AssessmentInput): Promise<AssessmentResult> {
  const syncResult = evaluateColawCoreSync(input);
  const dossierSha256 = await computePayloadDigest(syncResult.canonicalText);
  return {
    ...syncResult,
    dossierSha256,
  };
}
