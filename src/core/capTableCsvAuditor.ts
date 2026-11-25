import type {
  CapTableCsvAuditSummary,
  CapTableRowAudit,
  LegalVehicleKind,
} from './types.ts';
import {
  FDL32_CAPITAL_LOSS_DISSOLUTION_THRESHOLD_PCT,
  FDL32_CAPITAL_LOSS_GA_CALL_DAYS,
  FDL32_CAPITAL_LOSS_GA_THRESHOLD_PCT,
  FDL32_STATUTORY_RESERVE_MIN_PCT,
} from './colawCatalog.ts';

const FORMULA_LEAD_REGEX = /^[\t\r\n\uFEFF\x00-\x20]*([=+\-@])/;

export function needsCsvFormulaSanitization(value: string): boolean {
  const str = String(value ?? '');
  return str.length > 0 && FORMULA_LEAD_REGEX.test(str);
}

export function sanitizeCsvTextField(value: string): {
  sanitized: string;
  wasSanitized: boolean;
} {
  const str = String(value ?? '');
  if (!str) return { sanitized: '', wasSanitized: false };
  if (str.startsWith("'") && FORMULA_LEAD_REGEX.test(str.slice(1))) {
    return { sanitized: str, wasSanitized: false };
  }
  if (FORMULA_LEAD_REGEX.test(str)) {
    return { sanitized: `'${str}`, wasSanitized: true };
  }
  return { sanitized: str, wasSanitized: false };
}

export function formatSafeCsvCell(value: string | number | boolean): {
  cell: string;
  wasSanitized: boolean;
} {
  const raw = String(value ?? '');
  const { sanitized, wasSanitized } = sanitizeCsvTextField(raw);
  const escaped = sanitized.replace(/"/g, '""');
  return { cell: `"${escaped}"`, wasSanitized };
}

function parseBool(raw: string | undefined): boolean {
  const norm = String(raw ?? '').trim().toLowerCase();
  return norm === 'true' || norm === '1' || norm === 'yes' || norm === 'y';
}

function parseNumNonNeg(raw: string | undefined): number {
  const n = Number(String(raw ?? '').replace(/[,\s%]/g, '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function parseVehicle(raw: string | undefined): LegalVehicleKind {
  const norm = String(raw ?? '').trim().toLowerCase();
  switch (norm) {
    case 'mainland_llc':
    case 'mainland_spc':
    case 'mainland_prjsc':
    case 'mainland_pjsc':
    case 'mainland_nonprofit':
    case 'freezone_within_zone':
    case 'freezone_onshore_trading':
    case 'difc_adgm_exempt':
      return norm;
    default:
      return 'mainland_llc';
  }
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.map((c) => c.trim());
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function auditCapTableCsv(csvText: string): CapTableCsvAuditSummary {
  const clean = String(csvText ?? '').replace(/^\uFEFF/, '').trim();
  if (!clean) {
    return {
      totalRows: 0,
      compliantRows: 0,
      warningRows: 0,
      violationRows: 0,
      sanitizedCellsCount: 0,
      totalEquityPct: 0,
      totalVotingPct: 0,
      equitySumValid: true,
      votingSumValid: true,
      rows: [],
    };
  }

  const lines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      totalRows: 0,
      compliantRows: 0,
      warningRows: 0,
      violationRows: 0,
      sanitizedCellsCount: 0,
      totalEquityPct: 0,
      totalVotingPct: 0,
      equitySumValid: true,
      votingSumValid: true,
      rows: [],
    };
  }

  const headerCells = parseCsvLine(lines[0]!).map((h) => h.toLowerCase().trim());
  const idx = (name: string, fallback: number): number => {
    const pos = headerCells.indexOf(name);
    return pos >= 0 ? pos : fallback;
  };

  const iClassId = idx('class_id', 0);
  const iHolder = idx('holder_name', 1);
  const iVehicle = idx('legal_vehicle', 2);
  const iShareClass = idx('share_class', 3);
  const iEquity = idx('equity_pct', 4);
  const iVoting = idx('voting_pct', 5);
  const iInKindValued = idx('in_kind_valued', 6);
  const iMoaAnchored = idx('moa_anchored', 7);
  const iDividend = idx('dividend_payout_aed', 8);
  const iReserve = idx('reserve_pct', 9);
  const iLossRatio = idx('loss_ratio_pct', 10);
  const iGaDays = idx('ga_days_since_loss', 11);
  const iGaConvened = idx('ga_convened', 12);

  const rows: CapTableRowAudit[] = [];
  let sanitizedCellsCount = 0;
  let compliantRows = 0;
  let warningRows = 0;
  let violationRows = 0;
  let totalEquity = 0;
  let totalVoting = 0;

  for (let r = 1; r < lines.length; r += 1) {
    const cells = parseCsvLine(lines[r]!);
    const rawClassId = cells[iClassId] ?? `ROW-${r}`;
    const rawHolder = cells[iHolder] ?? '';
    const rawShareClass = cells[iShareClass] ?? 'ordinary';

    const sClassId = sanitizeCsvTextField(rawClassId);
    const sHolder = sanitizeCsvTextField(rawHolder);
    const sShareClass = sanitizeCsvTextField(rawShareClass);
    const rowSanitizedCount =
      (sClassId.wasSanitized ? 1 : 0) +
      (sHolder.wasSanitized ? 1 : 0) +
      (sShareClass.wasSanitized ? 1 : 0);
    sanitizedCellsCount += rowSanitizedCount;

    const legalVehicle = parseVehicle(cells[iVehicle]);
    const equityPct = round2(parseNumNonNeg(cells[iEquity]));
    const votingPct = round2(parseNumNonNeg(cells[iVoting]));
    const inKindValued = cells[iInKindValued] === undefined ? true : parseBool(cells[iInKindValued]);
    const moaAnchored = cells[iMoaAnchored] === undefined ? true : parseBool(cells[iMoaAnchored]);
    const dividendPayoutAed = round2(parseNumNonNeg(cells[iDividend]));
    const reserveAllocationPct = round2(parseNumNonNeg(cells[iReserve]));
    const lossRatioPct = round2(parseNumNonNeg(cells[iLossRatio]));
    const gaDaysSinceLoss = Math.floor(parseNumNonNeg(cells[iGaDays]));
    const gaConvened = cells[iGaConvened] === undefined ? false : parseBool(cells[iGaConvened]);

    totalEquity += equityPct;
    totalVoting += votingPct;

    const issues: string[] = [];
    let isViolation = false;
    let isWarning = false;

    const isExempt = legalVehicle === 'freezone_within_zone' || legalVehicle === 'difc_adgm_exempt';

    if (!isExempt) {
      if (legalVehicle === 'mainland_nonprofit' && dividendPayoutAed > 0) {
        isViolation = true;
        issues.push('nonprofit_art8_dividend_payout_prohibited');
      }

      if (!moaAnchored && rawShareClass.toLowerCase() !== 'ordinary') {
        isViolation = true;
        issues.push('art76_4_share_class_not_registered_in_moa');
      }

      if (!inKindValued) {
        isViolation = true;
        issues.push('art78_inkind_contribution_lacks_approved_valuation');
      }

      if (lossRatioPct >= FDL32_CAPITAL_LOSS_GA_THRESHOLD_PCT && !gaConvened) {
        if (gaDaysSinceLoss > FDL32_CAPITAL_LOSS_GA_CALL_DAYS) {
          isViolation = true;
          issues.push(
            lossRatioPct >= FDL32_CAPITAL_LOSS_DISSOLUTION_THRESHOLD_PCT
              ? 'art308_loss_75_plus_ga_overdue'
              : 'art308_loss_50_plus_ga_overdue',
          );
        } else {
          isWarning = true;
          issues.push('art308_loss_ga_call_pending_within_30d');
        }
      }

      if (
        legalVehicle !== 'mainland_nonprofit' &&
        reserveAllocationPct > 0 &&
        reserveAllocationPct < FDL32_STATUTORY_RESERVE_MIN_PCT
      ) {
        isWarning = true;
        issues.push('art103_reserve_below_5pct');
      }
    }

    if (rowSanitizedCount > 0) {
      isWarning = true;
      issues.push('cwe1236_formula_injection_neutralized');
    }

    const status: CapTableRowAudit['status'] = isViolation
      ? 'violation'
      : isWarning
        ? 'warning'
        : 'compliant';

    if (status === 'violation') violationRows += 1;
    else if (status === 'warning') warningRows += 1;
    else compliantRows += 1;

    rows.push({
      rowNumber: r,
      classId: sClassId.sanitized,
      holderName: sHolder.sanitized,
      legalVehicle,
      shareClassName: sShareClass.sanitized,
      equityPct,
      votingPct,
      inKindValued,
      moaAnchored,
      dividendPayoutAed,
      reserveAllocationPct,
      lossRatioPct,
      gaDaysSinceLoss,
      gaConvened,
      status,
      issues,
      wasSanitized: rowSanitizedCount > 0,
    });
  }

  const roundedEquity = round2(totalEquity);
  const roundedVoting = round2(totalVoting);
  const equitySumValid = rows.length === 0 || Math.abs(roundedEquity - 100) <= 0.05;
  const votingSumValid = rows.length === 0 || Math.abs(roundedVoting - 100) <= 0.05;

  return {
    totalRows: rows.length,
    compliantRows,
    warningRows,
    violationRows,
    sanitizedCellsCount,
    totalEquityPct: roundedEquity,
    totalVotingPct: roundedVoting,
    equitySumValid,
    votingSumValid,
    rows,
  };
}

export function exportCapTableAuditCsv(summary: CapTableCsvAuditSummary): string {
  const header = [
    'row_number',
    'class_id',
    'holder_name',
    'legal_vehicle',
    'share_class',
    'equity_pct',
    'voting_pct',
    'in_kind_valued',
    'moa_anchored',
    'dividend_payout_aed',
    'reserve_pct',
    'loss_ratio_pct',
    'ga_days_since_loss',
    'ga_convened',
    'status',
    'issues',
  ]
    .map((h) => formatSafeCsvCell(h).cell)
    .join(',');

  const lines = [header];
  for (const row of summary.rows) {
    const cells = [
      row.rowNumber,
      row.classId,
      row.holderName,
      row.legalVehicle,
      row.shareClassName,
      row.equityPct,
      row.votingPct,
      row.inKindValued,
      row.moaAnchored,
      row.dividendPayoutAed,
      row.reserveAllocationPct,
      row.lossRatioPct,
      row.gaDaysSinceLoss,
      row.gaConvened,
      row.status,
      row.issues.join(' | '),
    ].map((c) => formatSafeCsvCell(c).cell);
    lines.push(cells.join(','));
  }

  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
