import type { ColawControlSpec } from './types.ts';

export const COLAWAE_TOOL_VERSION = '0.5.0';
export const FDL20_EFFECTIVE_DATE = '2025-11-15';

export const FDL32_STATUTORY_RESERVE_MIN_PCT = 5;
export const FDL32_STATUTORY_RESERVE_STOP_CAP_PCT = 50;
export const FDL32_CAPITAL_LOSS_GA_THRESHOLD_PCT = 50;
export const FDL32_CAPITAL_LOSS_DISSOLUTION_THRESHOLD_PCT = 75;
export const FDL32_MINORITY_DISSOLUTION_RIGHT_PCT = 25;
export const FDL32_CAPITAL_LOSS_GA_CALL_DAYS = 30;

export const CR102_WARNING_RECTIFICATION_DAYS = 30;
export const CR102_PENALTY_GRIEVANCE_DAYS = 30;
export const CR102_GENERAL_FINE_AED = 10_000;
export const CR102_ACCOUNTING_FINE_AED = 15_000;
export const CR102_MAJOR_GOVERNANCE_FINE_AED = 100_000;
export const FDL32_ART350_CRIMINAL_FINE_MIN_AED = 10_000;
export const FDL32_ART350_CRIMINAL_FINE_MAX_AED = 100_000;
export const FDL32_ART350_MAX_CUSTODY_MONTHS = 24;

export const LEGAL_DISCLAIMER_AR =
  'تنويه تنظيمي: أداة CoLawAE أداة مساعدة هندسية وإدارية مفتوحة المصدر ولا تتبع وزارة الاقتصاد الإماراتية أو دوائر التنمية الاقتصادية المحلية (DET / ADDED / DED) أو سلطات المناطق الحرة أو DIFC أو ADGM، ولا تمثل استشارة قانونية رسمية. تستند إلى المرسوم بقانون اتحادي (32/2021) المعدَّل بالمرسوم بقانون اتحادي (20/2025) وقرار مجلس الوزراء (102/2022).';

export const LEGAL_DISCLAIMER_EN =
  'Regulatory Disclaimer: CoLawAE is an independent open-source UAE commercial companies governance readiness tool not affiliated with the UAE Ministry of Economy, local Departments of Economic Development (DET / ADDED / DED), Free Zone authorities, DIFC, or ADGM, and does not constitute formal legal advice. Modeled on Federal Decree-Law No. 32/2021 as amended by FDL No. 20/2025 and Cabinet Resolution No. 102/2022.';

export const COLAW_CONTROLS: readonly ColawControlSpec[] = [
  {
    id: 'CLW-CTRL-01',
    weight: 15,
    severity: 'high',
    legalRef: 'FDL 32/2021 Art. 5 & FDL 20/2025 Art. 15 bis — Jurisdiction & Re-Domiciliation',
    titleAr: 'نطاق السريان (م 5) وجاهزية نقل القيد الداخلي دون تصفية (م 15 مكرر)',
    titleEn: 'Mainland Scope (Art. 5) & Liquidation-Free Re-Domiciliation (Art. 15 bis)',
    summaryAr:
      'استيفاء ترخيص العمل بالبر الرئيسي للشركات الحرة والتأكد من قرارات الشركاء وموافقة المسجلين وتصفية الدائنين عند نقل القيد.',
    summaryEn:
      'Onshore trading authorization for free-zone entities plus assembly resolutions, dual-registrar approvals, and creditor clearance during Art. 15 bis migration.',
  },
  {
    id: 'CLW-CTRL-02',
    weight: 15,
    severity: 'high',
    legalRef: 'FDL 20/2025 Art. 76(4) & Art. 78 — Multi-Class Shares & In-Kind Valuation',
    titleAr: 'فئات الحصص المتعددة بالـ LLC (م 76/4) وتقييم الحصص العينية (م 78)',
    titleEn: 'Multi-Class LLC/PrJSC Shares (Art. 76(4)) & In-Kind Valuation (Art. 78)',
    summaryAr:
      'تثبيت حقوق التصويت والأرباح والتصفية والاسترداد لفئات الحصص المتعددة في عقد التأسيس المسجل وتقييم أي حصة عينية وفق ضوابط وزارة الاقتصاد.',
    summaryEn:
      'Explicit class rights registered in MoA/AoA for preference/ESOP/weighted shares alongside Ministry-compliant valuation of in-kind capital.',
  },
  {
    id: 'CLW-CTRL-03',
    weight: 15,
    severity: 'medium',
    legalRef: 'FDL 20/2025 & Art. 85 — MoA Drag/Tag-Along, Succession RoFR & Deadlock',
    titleAr: 'حقوق السحب والمصاحبة (Drag/Tag) والخلافة (RoFR) وفك الجمود بعقد التأسيس',
    titleEn: 'Constitutive Drag-Along / Tag-Along, Succession RoFR & Art. 85 Deadlock',
    summaryAr:
      'إدراج شروط البيع الإجباري والمصاحبة وحق أولوية شراء حصة المتوفى واستمرارية المدير/فك الجمود مباشرة في عقد التأسيس.',
    summaryEn:
      'Hardwiring Drag-Along/Tag-Along exit clauses, deceased-partner RoFR valuation formulas, and deadlock remedies directly into MoA/AoA.',
  },
  {
    id: 'CLW-CTRL-04',
    weight: 15,
    severity: 'critical',
    legalRef: 'FDL 20/2025 Art. 8 (Non-Profit) & FDL 32/2021 Art. 103 (5% Reserve)',
    titleAr: 'حظر توزيع الأرباح غير الربحية (م 8) والاحتياطي القانوني 5% حتى 50% (م 103)',
    titleEn: 'Non-Profit Dividend Lock (Art. 8) & 5% Statutory Reserve to 50% Cap (Art. 103)',
    summaryAr:
      'الالتزام بحظر توزيع أي أرباح في الشركة غير الربحية، وتجنيب 5% من الأرباح الصافية سنوياً حتى بلوغ 50% من رأس المال.',
    summaryEn:
      'Zero dividend distribution lock on non-profit vehicles and 5% annual net-profit allocation to statutory reserve until 50% of share capital.',
  },
  {
    id: 'CLW-CTRL-05',
    weight: 20,
    severity: 'critical',
    legalRef: 'FDL 32/2021 Art. 308 & Art. 309 — 50%/75% Capital Losses & 30-Day GA Call',
    titleAr: 'إنذار خسائر رأس المال (50% و75% م 308) ودعوة الجمعية العمومية خلال 30 يوماً',
    titleEn: '50%/75% Capital Loss Safeguards (Art. 308/309) & 30-Day General Assembly Call',
    summaryAr:
      'دعوة الجمعية العمومية خلال 30 يوماً عند بلوغ الخسائر 50% من رأس المال ومراقبة حق طلب الحل لأقلية 25% عند بلوغ 75%.',
    summaryEn:
      'Mandatory General Assembly referral within 30 days at >=50% share-capital erosion and tracking >=25% minority dissolution right at >=75% loss.',
  },
  {
    id: 'CLW-CTRL-06',
    weight: 10,
    severity: 'medium',
    legalRef: 'FDL 32/2021 Arts. 341 & 350 + CR 102/2022 — Inspection & Books',
    titleAr: 'مسك الدفاتر المحاسبية والتعاون مع التفتيش وتظلمات 30 يوماً (م 350 و102/2022)',
    titleEn: 'Statutory Books, Art. 350 Inspector Cooperation & CR 102/2022 Readiness',
    summaryAr:
      'حفظ السجلات المحاسبية والبيانات المؤسسية وتفادي حجب المستندات عن المفتشين وتجنب الغرامات التصاعدية (2x / 3x).',
    summaryEn:
      'Maintaining statutory accounting records, cooperating transparently with MoE/SCA inspectors, and preventing escalating 2x/3x administrative penalties.',
  },
  {
    id: 'CLW-CTRL-07',
    weight: 10,
    severity: 'medium',
    legalRef: 'UAE Cap-Table & Share-Class Register Audit (CWE-1236 Safe CSV)',
    titleAr: 'تدقيق سجل الشركاء وفئات الحصص والنسب وتصدير CSV المقاوم لحقن الصيغ',
    titleEn: 'Batch Cap-Table, Share-Class & Loss CSV Audit (CWE-1236 Sanitized)',
    summaryAr:
      'مطابقة مجموع نسب الملكية (100%)، وتثبيت الفئات بعقد التأسيس، ومنع حقن الصيغ (= + - @) وتصدير CSV بترميز UTF-8 BOM.',
    summaryEn:
      'Validating 100% equity summation, MoA class registration, reserve/loss triggers, and formula-safe UTF-8 BOM + CRLF CSV exports.',
  },
];
