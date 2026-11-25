import type {
  AssessmentInput,
  CapitalLossBand,
  ObligationsEvaluation,
  SanctionTierCode,
} from './types.ts';
import {
  CR102_ACCOUNTING_FINE_AED,
  CR102_GENERAL_FINE_AED,
  CR102_MAJOR_GOVERNANCE_FINE_AED,
  FDL32_ART350_CRIMINAL_FINE_MAX_AED,
  FDL32_ART350_CRIMINAL_FINE_MIN_AED,
  FDL32_ART350_MAX_CUSTODY_MONTHS,
  FDL32_CAPITAL_LOSS_DISSOLUTION_THRESHOLD_PCT,
  FDL32_CAPITAL_LOSS_GA_CALL_DAYS,
  FDL32_CAPITAL_LOSS_GA_THRESHOLD_PCT,
  FDL32_STATUTORY_RESERVE_MIN_PCT,
  FDL32_STATUTORY_RESERVE_STOP_CAP_PCT,
} from './colawCatalog.ts';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function validateUaeTrn(raw: string): {
  valid: boolean;
  formatted: string;
  reason: string;
} {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) {
    return { valid: true, formatted: '', reason: 'optional_empty' };
  }
  if (digits.length !== 15) {
    return { valid: false, formatted: digits, reason: 'must_be_15_digits' };
  }
  if (!digits.startsWith('100')) {
    return { valid: false, formatted: digits, reason: 'must_start_with_100' };
  }
  return { valid: true, formatted: digits, reason: 'valid_15_digit_trn' };
}

export function computeCapitalLossBand(lossRatioPct: number): CapitalLossBand {
  if (lossRatioPct >= FDL32_CAPITAL_LOSS_DISSOLUTION_THRESHOLD_PCT) {
    return 'critical_dissolution_75_plus';
  }
  if (lossRatioPct >= FDL32_CAPITAL_LOSS_GA_THRESHOLD_PCT) {
    return 'mandatory_ga_50_to_74';
  }
  return 'healthy_below_50';
}

export function computeStatutoryReserveStatus(
  shareCapitalAed: number,
  existingStatutoryReserveAed: number,
  annualNetProfitAed: number,
  annualReserveAllocationPct: number,
): {
  reservePctOfCapital: number;
  reserveStopCapReached: boolean;
  reserveAllocationRequiredThisYear: boolean;
  reserveCompliant: boolean;
  projectedTransferAed: number;
} {
  const capital = Math.max(0, Number(shareCapitalAed) || 0);
  const reserve = Math.max(0, Number(existingStatutoryReserveAed) || 0);
  const profit = Number(annualNetProfitAed) || 0;
  const allocPct = Math.max(0, Number(annualReserveAllocationPct) || 0);

  const reservePctOfCapital = capital > 0 ? round2((reserve / capital) * 100) : 0;
  const reserveStopCapReached = reservePctOfCapital >= FDL32_STATUTORY_RESERVE_STOP_CAP_PCT;
  const reserveAllocationRequiredThisYear = profit > 0 && !reserveStopCapReached;
  const reserveCompliant =
    !reserveAllocationRequiredThisYear || allocPct >= FDL32_STATUTORY_RESERVE_MIN_PCT;

  const projectedTransferAed = reserveAllocationRequiredThisYear
    ? round2((profit * Math.max(FDL32_STATUTORY_RESERVE_MIN_PCT, allocPct)) / 100)
    : 0;

  return {
    reservePctOfCapital,
    reserveStopCapReached,
    reserveAllocationRequiredThisYear,
    reserveCompliant,
    projectedTransferAed,
  };
}

export function evaluateColawObligations(input: AssessmentInput): ObligationsEvaluation {
  const trn = validateUaeTrn(input.tradeTrn);
  const capital = Math.max(0, Number(input.shareCapitalAed) || 0);
  const losses = Math.max(0, Number(input.accumulatedLossesAed) || 0);
  const daysSinceLoss = Math.max(0, Number(input.daysSinceLossDisclosure) || 0);
  const priorViolations = Math.max(0, Math.floor(Number(input.priorViolationCount) || 0));

  const isFreezoneWithinZone = input.legalVehicle === 'freezone_within_zone';
  const isFinancialZoneExempt = input.legalVehicle === 'difc_adgm_exempt';
  const isRedomiciling = input.redomiciliationPath !== 'none';

  // Exempt zones inside their own boundaries carve out onshore CR 102/2022 unless migrating via Art. 15 bis or trading onshore (Art. 5).
  const isExemptZoneWithoutTransfer = (isFreezoneWithinZone || isFinancialZoneExempt) && !isRedomiciling;
  const isMainlandOrOnshoreGoverned = !isFreezoneWithinZone && !isFinancialZoneExempt;

  const freezoneOnshoreGap =
    input.legalVehicle === 'freezone_onshore_trading' && !input.freezoneOnshoreBranchAuthorized;

  const redomiciliationGap =
    isRedomiciling &&
    (!input.redomiciliationBoardAndGaApproved ||
      !input.redomiciliationDualRegistrarApproved ||
      !input.redomiciliationCreditorClearanceVerified);

  const scopeOrRedomiciliationGap = freezoneOnshoreGap || redomiciliationGap;

  const isMultiClass = input.shareClassModel !== 'single_ordinary';
  const multiClassGap =
    isMultiClass &&
    (input.shareClassModel === 'multi_class_side_letter_only' || !input.multiClassRightsInMoaRegistered);
  const inKindGap = input.hasInKindContributions && !input.inKindValuationApproved;
  const multiClassOrInKindGap = multiClassGap || inKindGap;

  const exitAndSuccessionGap =
    isMainlandOrOnshoreGoverned &&
    input.legalVehicle !== 'mainland_nonprofit' &&
    input.legalVehicle !== 'mainland_spc' &&
    (!input.exitClausesAnchoredInMoa || !input.successionRofrAndDeadlockInMoa);

  const nonProfitViolation =
    input.legalVehicle === 'mainland_nonprofit' && input.nonProfitDividendPayoutAttempted;

  const reserveEval = computeStatutoryReserveStatus(
    capital,
    input.existingStatutoryReserveAed,
    input.annualNetProfitAed,
    input.annualReserveAllocationPct,
  );
  const reserveApplies =
    isMainlandOrOnshoreGoverned &&
    (input.legalVehicle === 'mainland_llc' ||
      input.legalVehicle === 'mainland_spc' ||
      input.legalVehicle === 'mainland_prjsc' ||
      input.legalVehicle === 'mainland_pjsc');
  const reserveGap = reserveApplies && !reserveEval.reserveCompliant;

  const lossRatioPct = capital > 0 ? round2((losses / capital) * 100) : 0;
  const lossBand = computeCapitalLossBand(lossRatioPct);
  const gaMandatoryTriggered = isMainlandOrOnshoreGoverned && lossRatioPct >= FDL32_CAPITAL_LOSS_GA_THRESHOLD_PCT;
  const gaSlaBreached =
    gaMandatoryTriggered &&
    !input.generalAssemblyConvenedForLoss &&
    daysSinceLoss > FDL32_CAPITAL_LOSS_GA_CALL_DAYS;
  const gaUrgentPending =
    gaMandatoryTriggered &&
    !input.generalAssemblyConvenedForLoss &&
    daysSinceLoss <= FDL32_CAPITAL_LOSS_GA_CALL_DAYS;
  const minorityDissolutionRightActive =
    isMainlandOrOnshoreGoverned &&
    lossRatioPct >= FDL32_CAPITAL_LOSS_DISSOLUTION_THRESHOLD_PCT;

  const booksOrInspectionGap =
    isMainlandOrOnshoreGoverned && (!input.accountingBooksMaintained || input.inspectorCooperationBlocked);

  // Sanction & CR 102/2022 + Art. 350 fine modeling
  const anyAdminBreach =
    scopeOrRedomiciliationGap ||
    multiClassOrInKindGap ||
    exitAndSuccessionGap ||
    nonProfitViolation ||
    reserveGap ||
    gaSlaBreached ||
    !input.accountingBooksMaintained ||
    !trn.valid;

  let sanctionTierCode: SanctionTierCode = 'compliant_no_penalty';
  let baseAdministrativeFineAed = 0;
  let projectedMinimumFineAed = 0;
  let projectedMaximumFineAed = 0;
  let multiplierApplied = 0;
  let licenceSuspensionOrCancellationRisk = false;
  let criminalCustodyRiskMonths = 0;

  if (isExemptZoneWithoutTransfer && !redomiciliationGap && !input.inspectorCooperationBlocked) {
    sanctionTierCode = 'exempt_freezone_carveout';
  } else if (input.inspectorCooperationBlocked && isMainlandOrOnshoreGoverned) {
    sanctionTierCode = 'criminal_art350_obstruction';
    baseAdministrativeFineAed = CR102_MAJOR_GOVERNANCE_FINE_AED;
    projectedMinimumFineAed = FDL32_ART350_CRIMINAL_FINE_MIN_AED;
    projectedMaximumFineAed = FDL32_ART350_CRIMINAL_FINE_MAX_AED;
    multiplierApplied = 1;
    licenceSuspensionOrCancellationRisk = true;
    criminalCustodyRiskMonths = FDL32_ART350_MAX_CUSTODY_MONTHS;
  } else if (anyAdminBreach) {
    const isMajorGovBreach =
      gaSlaBreached ||
      nonProfitViolation ||
      freezoneOnshoreGap ||
      multiClassOrInKindGap;
    const isAccountingBreach = !input.accountingBooksMaintained || reserveGap;

    baseAdministrativeFineAed = isMajorGovBreach
      ? CR102_MAJOR_GOVERNANCE_FINE_AED
      : isAccountingBreach
        ? CR102_ACCOUNTING_FINE_AED
        : CR102_GENERAL_FINE_AED;

    if (priorViolations === 0) {
      sanctionTierCode = 'written_warning_30d';
      projectedMinimumFineAed = 0;
      projectedMaximumFineAed = 0;
      multiplierApplied = 0;
    } else if (priorViolations === 1) {
      sanctionTierCode = isMajorGovBreach ? 'admin_fine_50k_100k' : 'admin_fine_10k_15k';
      multiplierApplied = 1;
      projectedMinimumFineAed = isMajorGovBreach ? 50_000 : baseAdministrativeFineAed;
      projectedMaximumFineAed = baseAdministrativeFineAed;
    } else if (priorViolations === 2) {
      sanctionTierCode = 'escalated_double_200k';
      multiplierApplied = 2;
      projectedMinimumFineAed = baseAdministrativeFineAed * 2;
      projectedMaximumFineAed = baseAdministrativeFineAed * 2;
    } else {
      sanctionTierCode = 'escalated_triple_licence_risk_300k';
      multiplierApplied = 3;
      projectedMinimumFineAed = baseAdministrativeFineAed * 3;
      projectedMaximumFineAed = baseAdministrativeFineAed * 3;
      licenceSuspensionOrCancellationRisk = true;
    }
  }

  return {
    isMainlandOrOnshoreGoverned,
    isExemptZoneWithoutTransfer,
    trnValidOrEmpty: trn.valid,
    trnFormatted: trn.formatted,
    trnIssueReason: trn.reason,
    lossRatioPct,
    lossBand,
    gaMandatoryTriggered,
    gaSlaBreached,
    gaUrgentPending,
    minorityDissolutionRightActive,
    reservePctOfCapital: reserveEval.reservePctOfCapital,
    reserveStopCapReached: reserveEval.reserveStopCapReached,
    reserveAllocationRequiredThisYear: reserveEval.reserveAllocationRequiredThisYear,
    reserveGap,
    projectedStatutoryReserveTransferAed: reserveEval.projectedTransferAed,
    nonProfitViolation,
    scopeOrRedomiciliationGap,
    multiClassOrInKindGap,
    exitAndSuccessionGap,
    booksOrInspectionGap,
    sanctionTierCode,
    baseAdministrativeFineAed,
    projectedMinimumFineAed,
    projectedMaximumFineAed,
    multiplierApplied,
    licenceSuspensionOrCancellationRisk,
    criminalCustodyRiskMonths,
  };
}
