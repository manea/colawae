export type LegalVehicleKind =
  | 'mainland_llc'
  | 'mainland_spc'
  | 'mainland_prjsc'
  | 'mainland_pjsc'
  | 'mainland_nonprofit'
  | 'freezone_within_zone'
  | 'freezone_onshore_trading'
  | 'difc_adgm_exempt';

export type RedomiciliationPath =
  | 'none'
  | 'emirate_to_emirate'
  | 'freezone_to_mainland'
  | 'mainland_to_freezone'
  | 'freezone_to_freezone';

export type ShareClassModel =
  | 'single_ordinary'
  | 'multi_class_moa_registered'
  | 'multi_class_side_letter_only';

export type CapitalLossBand =
  | 'healthy_below_50'
  | 'mandatory_ga_50_to_74'
  | 'critical_dissolution_75_plus';

export type SanctionTierCode =
  | 'compliant_no_penalty'
  | 'exempt_freezone_carveout'
  | 'written_warning_30d'
  | 'admin_fine_10k_15k'
  | 'admin_fine_50k_100k'
  | 'escalated_double_200k'
  | 'escalated_triple_licence_risk_300k'
  | 'criminal_art350_obstruction';

export type ReadinessStatus = 'ready' | 'conditional' | 'blocked';

export type ControlSeverity = 'critical' | 'high' | 'medium';

export interface ColawControlSpec {
  id: string;
  weight: number;
  severity: ControlSeverity;
  legalRef: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
}

export interface AssessmentInput {
  companyName: string;
  tradeTrn: string;
  legalVehicle: LegalVehicleKind;
  emirateOrZone: string;
  freezoneOnshoreBranchAuthorized: boolean;
  redomiciliationPath: RedomiciliationPath;
  redomiciliationBoardAndGaApproved: boolean;
  redomiciliationDualRegistrarApproved: boolean;
  redomiciliationCreditorClearanceVerified: boolean;
  shareClassModel: ShareClassModel;
  multiClassRightsInMoaRegistered: boolean;
  hasInKindContributions: boolean;
  inKindValuationApproved: boolean;
  exitClausesAnchoredInMoa: boolean;
  successionRofrAndDeadlockInMoa: boolean;
  nonProfitDividendPayoutAttempted: boolean;
  shareCapitalAed: number;
  existingStatutoryReserveAed: number;
  annualNetProfitAed: number;
  annualReserveAllocationPct: number;
  accumulatedLossesAed: number;
  daysSinceLossDisclosure: number;
  generalAssemblyConvenedForLoss: boolean;
  dissolutionMinority25PctPetition: boolean;
  accountingBooksMaintained: boolean;
  inspectorCooperationBlocked: boolean;
  priorViolationCount: number;
  capTableCsv?: string;
  notes?: string;
}

export interface ObligationsEvaluation {
  isMainlandOrOnshoreGoverned: boolean;
  isExemptZoneWithoutTransfer: boolean;
  trnValidOrEmpty: boolean;
  trnFormatted: string;
  trnIssueReason: string;
  lossRatioPct: number;
  lossBand: CapitalLossBand;
  gaMandatoryTriggered: boolean;
  gaSlaBreached: boolean;
  gaUrgentPending: boolean;
  minorityDissolutionRightActive: boolean;
  reservePctOfCapital: number;
  reserveStopCapReached: boolean;
  reserveAllocationRequiredThisYear: boolean;
  reserveGap: boolean;
  projectedStatutoryReserveTransferAed: number;
  nonProfitViolation: boolean;
  scopeOrRedomiciliationGap: boolean;
  multiClassOrInKindGap: boolean;
  exitAndSuccessionGap: boolean;
  booksOrInspectionGap: boolean;
  sanctionTierCode: SanctionTierCode;
  baseAdministrativeFineAed: number;
  projectedMinimumFineAed: number;
  projectedMaximumFineAed: number;
  multiplierApplied: number;
  licenceSuspensionOrCancellationRisk: boolean;
  criminalCustodyRiskMonths: number;
}

export interface FindingItem {
  id: string;
  severity: ControlSeverity;
  legalRef: string;
  passed: boolean;
  weight: number;
  titleAr: string;
  titleEn: string;
  detailAr: string;
  detailEn: string;
  remediationAr: string;
  remediationEn: string;
}

export interface CapTableRowAudit {
  rowNumber: number;
  classId: string;
  holderName: string;
  legalVehicle: LegalVehicleKind;
  shareClassName: string;
  equityPct: number;
  votingPct: number;
  inKindValued: boolean;
  moaAnchored: boolean;
  dividendPayoutAed: number;
  reserveAllocationPct: number;
  lossRatioPct: number;
  gaDaysSinceLoss: number;
  gaConvened: boolean;
  status: 'compliant' | 'warning' | 'violation';
  issues: string[];
  wasSanitized: boolean;
}

export interface CapTableCsvAuditSummary {
  totalRows: number;
  compliantRows: number;
  warningRows: number;
  violationRows: number;
  sanitizedCellsCount: number;
  totalEquityPct: number;
  totalVotingPct: number;
  equitySumValid: boolean;
  votingSumValid: boolean;
  rows: CapTableRowAudit[];
}

export interface AssessmentResult {
  toolVersion: string;
  legalFrameworkRef: string;
  readinessStatus: ReadinessStatus;
  readinessScore: number;
  passedControlsCount: number;
  totalControlsCount: number;
  obligations: ObligationsEvaluation;
  controls: FindingItem[];
  csvAudit: CapTableCsvAuditSummary | null;
  disclaimerAr: string;
  disclaimerEn: string;
  canonicalText: string;
  dossierSha256: string;
}

export interface ColawPreset {
  id: string;
  labelAr: string;
  labelEn: string;
  expectedStatus: ReadinessStatus;
  input: AssessmentInput;
  sampleCsv: string;
}
