import { describe, expect, it } from 'vitest';
import {
  COLAWAE_TOOL_VERSION,
  COLAW_PRESETS,
  FDL20_EFFECTIVE_DATE,
  assessColawReadiness,
  auditCapTableCsv,
  canonicalizeDossierPayload,
  computeCapitalLossBand,
  computeDossierSha256,
  computeStatutoryReserveStatus,
  evaluateColawCoreSync,
  evaluateColawObligations,
  exportCapTableAuditCsv,
  formatSafeCsvCell,
  needsCsvFormulaSanitization,
  sanitizeCsvTextField,
  validateUaeTrn,
} from '../../src/core/index.ts';
import type { AssessmentInput } from '../../src/core/types.ts';

function cleanBaseInput(overrides: Partial<AssessmentInput> = {}): AssessmentInput {
  return {
    ...COLAW_PRESETS[0]!.input,
    ...overrides,
  };
}

describe('CoLawAE Zero-Dependency UAE Commercial Companies Core (FDL 32/2021, FDL 20/2025 & CR 102/2022)', () => {
  it('1. exposes tool version 0.5.0, effective date 2025-11-15, and explicit MoE/DET/ADDED/DIFC/ADGM disclaimers', () => {
    expect(COLAWAE_TOOL_VERSION).toBe('0.5.0');
    expect(FDL20_EFFECTIVE_DATE).toBe('2025-11-15');
    const res = evaluateColawCoreSync(cleanBaseInput());
    expect(res.disclaimerAr).toContain('لا تتبع وزارة الاقتصاد');
    expect(res.disclaimerEn).toContain('not affiliated with the UAE Ministry of Economy');
    expect(res.controls).toHaveLength(7);
    expect(res.controls.reduce((sum, c) => sum + c.weight, 0)).toBe(100);
  });

  it('2. evaluates Preset 1 (compliant re-domiciled multi-class LLC) at 100/100 ready with 0 AED penalty', () => {
    const res = evaluateColawCoreSync(COLAW_PRESETS[0]!.input);
    expect(res.readinessStatus).toBe('ready');
    expect(res.readinessScore).toBe(100);
    expect(res.passedControlsCount).toBe(7);
    expect(res.obligations.sanctionTierCode).toBe('compliant_no_penalty');
    expect(res.obligations.projectedMinimumFineAed).toBe(0);
    expect(res.obligations.projectedMaximumFineAed).toBe(0);
    expect(res.obligations.lossBand).toBe('healthy_below_50');
    expect(res.csvAudit?.totalRows).toBe(3);
    expect(res.csvAudit?.equitySumValid).toBe(true);
    expect(res.csvAudit?.votingSumValid).toBe(true);
  });

  it('3. evaluates Preset 2 (conditional migration & side-letter share classes) at 70/100 conditional with 30-day warning', () => {
    const res = evaluateColawCoreSync(COLAW_PRESETS[1]!.input);
    expect(res.readinessStatus).toBe('conditional');
    expect(res.readinessScore).toBe(70);
    expect(res.passedControlsCount).toBe(5);
    expect(res.obligations.scopeOrRedomiciliationGap).toBe(true);
    expect(res.obligations.multiClassOrInKindGap).toBe(true);
    expect(res.obligations.sanctionTierCode).toBe('written_warning_30d');
    expect(res.obligations.projectedMaximumFineAed).toBe(0);
  });

  it('4. evaluates Preset 3 (82% loss overdue 48d + repeat 3x) at 0/100 blocked with AED 300k & licence risk', () => {
    const res = evaluateColawCoreSync(COLAW_PRESETS[2]!.input);
    expect(res.readinessStatus).toBe('blocked');
    expect(res.readinessScore).toBe(0);
    expect(res.passedControlsCount).toBe(0);
    expect(res.obligations.lossRatioPct).toBe(82);
    expect(res.obligations.lossBand).toBe('critical_dissolution_75_plus');
    expect(res.obligations.gaMandatoryTriggered).toBe(true);
    expect(res.obligations.gaSlaBreached).toBe(true);
    expect(res.obligations.minorityDissolutionRightActive).toBe(true);
    expect(res.obligations.sanctionTierCode).toBe('escalated_triple_licence_risk_300k');
    expect(res.obligations.projectedMaximumFineAed).toBe(300_000);
    expect(res.obligations.licenceSuspensionOrCancellationRisk).toBe(true);
    expect(res.csvAudit?.sanitizedCellsCount).toBe(1);
    expect(res.csvAudit?.equitySumValid).toBe(false);
  });

  it('5. validates 15-digit UAE TRN starting with 100 and permits empty optional TRN', () => {
    expect(validateUaeTrn('')).toEqual({ valid: true, formatted: '', reason: 'optional_empty' });
    expect(validateUaeTrn('100-5123-4987-0003').valid).toBe(true);
    expect(validateUaeTrn('200512349870003')).toEqual({
      valid: false,
      formatted: '200512349870003',
      reason: 'must_start_with_100',
    });
    expect(validateUaeTrn('1001234').reason).toBe('must_be_15_digits');
  });

  it('6. enforces Art. 5 free-zone boundary vs internal DIFC/ADGM & commercial free-zone carve-out', () => {
    const exemptDifc = evaluateColawCoreSync(
      cleanBaseInput({
        legalVehicle: 'difc_adgm_exempt',
        redomiciliationPath: 'none',
        exitClausesAnchoredInMoa: false,
        successionRofrAndDeadlockInMoa: false,
        accountingBooksMaintained: true,
        capTableCsv: undefined,
      }),
    );
    expect(exemptDifc.readinessStatus).toBe('ready');
    expect(exemptDifc.obligations.isExemptZoneWithoutTransfer).toBe(true);
    expect(exemptDifc.obligations.sanctionTierCode).toBe('exempt_freezone_carveout');

    const onshoreBreach = evaluateColawObligations(
      cleanBaseInput({
        legalVehicle: 'freezone_onshore_trading',
        freezoneOnshoreBranchAuthorized: false,
      }),
    );
    expect(onshoreBreach.isMainlandOrOnshoreGoverned).toBe(true);
    expect(onshoreBreach.scopeOrRedomiciliationGap).toBe(true);
  });

  it('7. requires all 3 Art. 15 bis re-domiciliation gates (GA, dual registrars, creditor clearance)', () => {
    const gapCreditor = evaluateColawObligations(
      cleanBaseInput({
        legalVehicle: 'freezone_within_zone',
        redomiciliationPath: 'freezone_to_mainland',
        redomiciliationBoardAndGaApproved: true,
        redomiciliationDualRegistrarApproved: true,
        redomiciliationCreditorClearanceVerified: false,
      }),
    );
    expect(gapCreditor.isExemptZoneWithoutTransfer).toBe(false);
    expect(gapCreditor.scopeOrRedomiciliationGap).toBe(true);

    const completeTransfer = evaluateColawCoreSync(
      cleanBaseInput({
        legalVehicle: 'freezone_within_zone',
        redomiciliationPath: 'freezone_to_mainland',
        redomiciliationBoardAndGaApproved: true,
        redomiciliationDualRegistrarApproved: true,
        redomiciliationCreditorClearanceVerified: true,
        capTableCsv: undefined,
      }),
    );
    expect(completeTransfer.readinessStatus).toBe('ready');
  });

  it('8. enforces Art. 76(4) MoA registration for multi-class shares and Art. 78 in-kind valuation', () => {
    const sideLetter = evaluateColawObligations(
      cleanBaseInput({
        shareClassModel: 'multi_class_side_letter_only',
        multiClassRightsInMoaRegistered: true,
      }),
    );
    expect(sideLetter.multiClassOrInKindGap).toBe(true);

    const unvaluedInKind = evaluateColawObligations(
      cleanBaseInput({
        hasInKindContributions: true,
        inKindValuationApproved: false,
      }),
    );
    expect(unvaluedInKind.multiClassOrInKindGap).toBe(true);
  });

  it('9. blocks mainland Non-Profit commercial companies (Art. 8) attempting any partner dividend distribution', () => {
    const res = evaluateColawCoreSync(
      cleanBaseInput({
        legalVehicle: 'mainland_nonprofit',
        nonProfitDividendPayoutAttempted: true,
        redomiciliationPath: 'none',
        priorViolationCount: 1,
        capTableCsv: undefined,
      }),
    );
    expect(res.obligations.nonProfitViolation).toBe(true);
    expect(res.readinessStatus).toBe('blocked');
    expect(res.obligations.sanctionTierCode).toBe('admin_fine_50k_100k');
    expect(res.obligations.projectedMaximumFineAed).toBe(100_000);
  });

  it('10. enforces Art. 103 5% annual statutory reserve allocation until reaching 50% of share capital', () => {
    const belowCapNeeds5 = computeStatutoryReserveStatus(1_000_000, 400_000, 200_000, 4);
    expect(belowCapNeeds5.reservePctOfCapital).toBe(40);
    expect(belowCapNeeds5.reserveStopCapReached).toBe(false);
    expect(belowCapNeeds5.reserveAllocationRequiredThisYear).toBe(true);
    expect(belowCapNeeds5.reserveCompliant).toBe(false);
    expect(belowCapNeeds5.projectedTransferAed).toBe(10_000);

    const at50CapStops = computeStatutoryReserveStatus(1_000_000, 500_000, 200_000, 0);
    expect(at50CapStops.reservePctOfCapital).toBe(50);
    expect(at50CapStops.reserveStopCapReached).toBe(true);
    expect(at50CapStops.reserveAllocationRequiredThisYear).toBe(false);
    expect(at50CapStops.reserveCompliant).toBe(true);
    expect(at50CapStops.projectedTransferAed).toBe(0);
  });

  it('11. checks Art. 308/309 capital loss thresholds (50% GA call in 30d, 75% minority 25% dissolution)', () => {
    expect(computeCapitalLossBand(49.99)).toBe('healthy_below_50');
    expect(computeCapitalLossBand(50)).toBe('mandatory_ga_50_to_74');
    expect(computeCapitalLossBand(74.99)).toBe('mandatory_ga_50_to_74');
    expect(computeCapitalLossBand(75)).toBe('critical_dissolution_75_plus');

    const urgentPending = evaluateColawObligations(
      cleanBaseInput({
        shareCapitalAed: 1_000_000,
        accumulatedLossesAed: 550_000,
        daysSinceLossDisclosure: 18,
        generalAssemblyConvenedForLoss: false,
      }),
    );
    expect(urgentPending.gaMandatoryTriggered).toBe(true);
    expect(urgentPending.gaUrgentPending).toBe(true);
    expect(urgentPending.gaSlaBreached).toBe(false);
    expect(urgentPending.minorityDissolutionRightActive).toBe(false);

    const gaCalledOnTime = evaluateColawCoreSync(
      cleanBaseInput({
        shareCapitalAed: 1_000_000,
        accumulatedLossesAed: 600_000,
        daysSinceLossDisclosure: 45,
        generalAssemblyConvenedForLoss: true,
        capTableCsv: undefined,
      }),
    );
    expect(gaCalledOnTime.obligations.gaSlaBreached).toBe(false);
    expect(gaCalledOnTime.readinessStatus).toBe('ready');
  });

  it('12. flags Art. 350 criminal liability when blocking inspector access to statutory books', () => {
    const res = evaluateColawCoreSync(
      cleanBaseInput({
        inspectorCooperationBlocked: true,
        capTableCsv: undefined,
      }),
    );
    expect(res.readinessStatus).toBe('blocked');
    expect(res.obligations.sanctionTierCode).toBe('criminal_art350_obstruction');
    expect(res.obligations.criminalCustodyRiskMonths).toBe(24);
    expect(res.obligations.projectedMinimumFineAed).toBe(10_000);
    expect(res.obligations.projectedMaximumFineAed).toBe(100_000);
  });

  it('13. escalates CR 102/2022 penalties across 0 -> warning, 1 -> 1x, 2 -> 2x, 3 -> 3x + suspension risk', () => {
    const accountingGap = cleanBaseInput({
      accountingBooksMaintained: false,
      capTableCsv: undefined,
    });
    expect(evaluateColawObligations({ ...accountingGap, priorViolationCount: 0 }).sanctionTierCode).toBe(
      'written_warning_30d',
    );
    const second = evaluateColawObligations({ ...accountingGap, priorViolationCount: 1 });
    expect(second.sanctionTierCode).toBe('admin_fine_10k_15k');
    expect(second.projectedMaximumFineAed).toBe(15_000);

    const third = evaluateColawObligations({ ...accountingGap, priorViolationCount: 2 });
    expect(third.sanctionTierCode).toBe('escalated_double_200k');
    expect(third.projectedMaximumFineAed).toBe(30_000);

    const fourth = evaluateColawObligations({ ...accountingGap, priorViolationCount: 3 });
    expect(fourth.sanctionTierCode).toBe('escalated_triple_licence_risk_300k');
    expect(fourth.projectedMaximumFineAed).toBe(45_000);
    expect(fourth.licenceSuspensionOrCancellationRisk).toBe(true);
  });

  it('14. neutralizes CWE-1236 spreadsheet formula injections safely and exports UTF-8 BOM + CRLF CSV', () => {
    expect(needsCsvFormulaSanitization('=SUM(A1:A2)')).toBe(true);
    expect(needsCsvFormulaSanitization('+cmd|calc')).toBe(true);
    expect(needsCsvFormulaSanitization('-2+3')).toBe(true);
    expect(needsCsvFormulaSanitization('@SUM(1,2)')).toBe(true);
    expect(needsCsvFormulaSanitization('Al Reef Holdings')).toBe(false);

    expect(sanitizeCsvTextField('=HYPERLINK("x")')).toEqual({
      sanitized: `'=HYPERLINK("x")`,
      wasSanitized: true,
    });
    expect(sanitizeCsvTextField(`'=SAFE`)).toEqual({
      sanitized: `'=SAFE`,
      wasSanitized: false,
    });
    expect(formatSafeCsvCell(`+1+1,"bad"`).cell).toBe(`"'+1+1,""bad"""`);

    const audit = auditCapTableCsv(
      [
        'class_id,holder_name,legal_vehicle,share_class,equity_pct,voting_pct,in_kind_valued,moa_anchored,dividend_payout_aed,reserve_pct,loss_ratio_pct,ga_days_since_loss,ga_convened',
        'NP-1,Charity Founder,mainland_nonprofit,Ordinary,100,100,true,true,50000,0,0,0,false',
      ].join('\n'),
    );
    expect(audit.violationRows).toBe(1);
    expect(audit.rows[0]!.issues).toContain('nonprofit_art8_dividend_payout_prohibited');
    const csvOut = exportCapTableAuditCsv(audit);
    expect(csvOut.startsWith('\uFEFF')).toBe(true);
    expect(csvOut.includes('\r\n')).toBe(true);
  });

  it('15. produces deterministic canonical payload and WebCrypto SHA-256 hash independent of input formatting', async () => {
    const a = await assessColawReadiness(cleanBaseInput());
    const b = await assessColawReadiness(cleanBaseInput());
    expect(a.dossierSha256).toHaveLength(64);
    expect(a.dossierSha256).toBe(b.dossierSha256);

    const p1 = canonicalizeDossierPayload({ b: 2, a: 1, controls: [{ id: 'B' }, { id: 'A' }] });
    const p2 = canonicalizeDossierPayload({ controls: [{ id: 'A' }, { id: 'B' }], a: 1, b: 2 });
    expect(p1).toBe(p2);
    expect(await computeDossierSha256({ k: 1 })).toHaveLength(64);
  });
});
