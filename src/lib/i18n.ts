export type Locale = 'ar' | 'en';
export type ThemeName = 'alabaster-governance' | 'obsidian-corporate';
export type StudioTab = 'dashboard' | 'controls' | 'captable' | 'vault';

const LS_LOCALE = 'colawae.pref.locale';
const LS_THEME = 'colawae.pref.theme';

export function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ar';
  try {
    const raw = localStorage.getItem(LS_LOCALE);
    if (raw === 'ar' || raw === 'en') return raw;
  } catch {
    // Ignore storage read errors
  }
  return 'ar';
}

export function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') return 'alabaster-governance';
  try {
    const raw = localStorage.getItem(LS_THEME);
    if (raw === 'alabaster-governance' || raw === 'obsidian-corporate') return raw;
  } catch {
    // Ignore storage read errors
  }
  return 'alabaster-governance';
}

export function persistPreferences(locale: Locale, theme: ThemeName): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('data-theme', theme);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute(
        'content',
        theme === 'obsidian-corporate' ? '#080F1B' : '#F7F9FC',
      );
    }
  }
  try {
    localStorage.setItem(LS_LOCALE, locale);
    localStorage.setItem(LS_THEME, theme);
  } catch {
    // Ignore storage write errors
  }
}

export const TEXT = {
  ar: {
    brandTitle: 'CoLawAE — مدقق تعديلات قانون الشركات الإماراتي',
    brandSubtitle:
      'المرسوم بقانون اتحادي 32/2021 المعدَّل بـ 20/2025 وقرار 102/2022 (نقل القيد م 15 مكرر، فئات الحصص، السحب والمصاحبة وخسائر 50%/75%)',
    modeServer: 'SQLite WAL حي',
    modeLocal: 'تخزين متصفح $0',
    switchLang: 'English (LTR)',
    themeDark: 'المظهر المؤسسي الداكن',
    themeLight: 'مظهر المرمر الصباحي',
    printBtn: 'طباعة / PDF',
    presetLabel: 'سيناريو معياري:',
    tabDashboard: 'الحوكمة والجزاءات',
    tabControls: 'الضوابط السبعة (7)',
    tabCapTable: 'تدقيق جدول الحصص CSV',
    tabVault: 'خزنة الملفات والختم',
    kpiScoreTitle: 'حالة الجاهزية والدرجة',
    kpiLossTitle: 'خسائر رأس المال (م 308/309)',
    kpiReserveTitle: 'الاحتياطي القانوني (م 103)',
    kpiExposureTitle: 'التعرض للغرامات والتفتيش',
    readyBadge: 'ممتثل ✓',
    conditionalBadge: 'تنبيه/نواقص',
    blockedBadge: 'مخالف / حرج',
    legalRefSummary: 'ملخص الأهلية والتعرض:',
    btnRunEval: 'تحديث التحقق',
    sectionIdentity: '1. هوية الشركة والشكل القانوني (م 5 و100 TRN)',
    sectionTransfer: '2. نقل القيد الداخلي (م 15 مكرر) وفئات الحصص (م 76/4 و78)',
    sectionExitLock: '3. شروط الخروج بعقد التأسيس وغير الربحية والاحتياطي (م 8 و103)',
    sectionLosses: '4. خسائر رأس المال (م 308/309) وجاهزية التفتيش (م 350)',
    companyName: 'الاسم القانوني للشركة / الكيان',
    tradeTrn: 'الرقم الضريبي الإماراتي (100 — اختياري)',
    legalVehicle: 'الشكل القانوني والنطاق التنظيمي',
    emirateOrZone: 'الإمارة أو المنطقة الحرة والترخيص',
    priorViolationCount: 'تكرار المخالفات الإدارية (CR 102/2022)',
    freezoneOnshoreBranchAuthorized: 'ترخيص فرع/قيد بالبر الرئيسي لأعمال خارج المنطقة الحرة (م 5)',
    redomiciliationPath: 'مسار نقل القيد الداخلي بلا تصفية (م 15 مكرر)',
    redomiciliationBoardAndGaApproved: 'قرار الجمعية العمومية / الشركاء لنقل القيد',
    redomiciliationDualRegistrarApproved: 'موافقة المسجِّل المُصدِر والمسجِّل المستقبِل',
    redomiciliationCreditorClearanceVerified: 'براءة ذمة الدائنين وإغلاق الاعتراضات',
    shareClassModel: 'نموذج فئات الحصص / الأسهم (م 76/4)',
    multiClassRightsInMoaRegistered: 'تثبيت حقوق الفئات صراحةً بعقد التأسيس المسجل',
    hasInKindContributions: 'وجود حصص عينية في رأس المال (م 78)',
    inKindValuationApproved: 'اعتماد تقييم الحصص العينية وفق معايير وزارة الاقتصاد',
    exitClausesAnchoredInMoa: 'إدراج شروط Drag-Along / Tag-Along مباشرةً بعقد التأسيس',
    successionRofrAndDeadlockInMoa: 'تثبيت أولوية الشفعة عند الوفاة (RoFR) وفك الجمود (م 85)',
    nonProfitDividendPayoutAttempted: 'محاولة توزيع أرباح نقدية (محظور بالشركة غير الربحية م 8)',
    shareCapitalAed: 'رأس المال المسجل (د.إ)',
    existingStatutoryReserveAed: 'رصيد الاحتياطي القانوني القائم (د.إ)',
    annualNetProfitAed: 'صافي الربح السنوي (د.إ)',
    annualReserveAllocationPct: 'نسبة تجنيب الاحتياطي السنوي (%)',
    accumulatedLossesAed: 'الخسائر المتراكمة (د.إ)',
    daysSinceLossDisclosure: 'أيام انكشاف الخسارة منذ القوائم',
    generalAssemblyConvenedForLoss: 'تمت دعوة الجمعية العمومية للبت بالخسارة (خلال 30 يوماً)',
    dissolutionMinority25PctPetition: 'طلب حل من أقلية (25% فأكثر عند خسارة 75% فأكثر)',
    accountingBooksMaintained: 'مسك الدفاتر المحاسبية النظامية والسجلات',
    inspectorCooperationBlocked: 'حجب مستندات عن مفتشي الوزارة/الهيئة (م 350)',
    notes: 'ملاحظات الحوكمة الداخلية',
    trnValid: '100 ✓',
    trnInvalid: 'صيغة غير صالحة ✗',
    trnEmpty: 'اختياري',
    vaultTitle: 'خزنة ملفات CoLawAE وختم بصمة SHA-256 (CLW-YYYY-0001)',
    vaultTitlePlaceholder: 'عنوان التقييم (مثال: تعديل عقد تأسيس الفئة الممتازة ق4)',
    btnSaveDraft: 'حفظ مسودة ملف',
    btnSealDossier: 'ختم نهائي SHA-256',
    btnDuplicate: 'استنساخ',
    btnDelete: 'حذف',
    btnBriefMd: 'brief.md',
    btnExportCsv: 'export.csv',
    btnCopyBrief: 'نسخ الموجز MD',
    btnPublicView: 'عرض',
    savedVaultHeading: 'الملفات المحفوظة بالخزنة',
    noSavedDossiers: 'لا توجد ملفات محفوظة بعد — احفظ أول تقييم من هنا أو خزّنه بضغطة واحدة.',
    sealedBadge: 'مختوم ومقفل',
    draftBadge: 'مسودة قابلة للتعديل',
    publicReportHeading: 'التقرير العام المختوم لبصمة حوكمة الشركات الإماراتي',
    publicViewsLabel: 'عدد المشاهدات:',
    backToStudio: 'العودة لاستوديو CoLawAE',
    auditCsvTitle: 'مدقق دفعات جدول الحصص والفئات والسجلات (CSV CWE-1236)',
    auditCsvDesc:
      'افحص صفوف جدول الحصص، مجموع النسب (100%)، تثبيت الفئات بعقد التأسيس، تقييم الحصص العينية، وحظر أرباح غير الربحية مع تحييد حقن الصيغ (= + - @) وتصدير UTF-8 BOM + CRLF.',
    btnRunCsvAudit: 'فحص CSV',
    btnDownloadSafeCsv: 'تنزيل CSV المعقّم',
    btnLoadSampleCsv: 'تحميل عينة السيناريو',
    btnSanitizeCwe: 'تعقيم فوري',
  },
  en: {
    brandTitle: 'CoLawAE — UAE Commercial Companies Law Readiness Studio',
    brandSubtitle:
      'Federal Decree-Law No. 32/2021 as amended by FDL No. 20/2025 & CR No. 102/2022 (Art. 15 bis Migration, Multi-Class LLCs, Drag/Tag-Along & Art. 308 Losses)',
    modeServer: 'Live SQLite WAL',
    modeLocal: '$0 Local Browser Vault',
    switchLang: 'العربية (RTL)',
    themeDark: 'Obsidian Corporate',
    themeLight: 'Alabaster Governance',
    printBtn: 'Print / PDF',
    presetLabel: 'Scenario Preset:',
    tabDashboard: 'Governance & Sanctions',
    tabControls: '7-Control Matrix',
    tabCapTable: 'Cap-Table CSV Audit',
    tabVault: 'Vault & SHA-256',
    kpiScoreTitle: 'Readiness Score & Status',
    kpiLossTitle: 'Capital Losses (Art. 308/309)',
    kpiReserveTitle: 'Statutory Reserve (Art. 103)',
    kpiExposureTitle: 'Sanction & Inspection Exposure',
    readyBadge: 'READY ✓',
    conditionalBadge: 'CONDITIONAL',
    blockedBadge: 'BLOCKED',
    legalRefSummary: 'Scope & Exposure Summary:',
    btnRunEval: 'Recalculate',
    sectionIdentity: '1. Entity Identity, Legal Form & UAE TRN (Art. 5)',
    sectionTransfer: '2. Internal Re-Domiciliation (Art. 15 bis) & Share Classes (Arts. 76(4) & 78)',
    sectionExitLock: '3. MoA Drag/Tag-Along, Non-Profit Lock (Art. 8) & 5% Reserve (Art. 103)',
    sectionLosses: '4. Capital Loss Triggers (Art. 308/309) & Inspection Readiness (Art. 350)',
    companyName: 'Legal Entity / Company Name',
    tradeTrn: 'UAE TRN (100 prefix, optional)',
    legalVehicle: 'Legal Vehicle & Regulatory Scope',
    emirateOrZone: 'Emirate / Free Zone & Licensing Authority',
    priorViolationCount: 'Prior Administrative Offenses (CR 102/2022)',
    freezoneOnshoreBranchAuthorized: 'Authorized Onshore Branch / Registration for Mainland Trading (Art. 5)',
    redomiciliationPath: 'Internal Re-Domiciliation Path Without Liquidation (Art. 15 bis)',
    redomiciliationBoardAndGaApproved: 'Special Assembly / Partners Resolution Approving Transfer',
    redomiciliationDualRegistrarApproved: 'Outgoing & Incoming Competent Registrar Consents Secured',
    redomiciliationCreditorClearanceVerified: 'Creditor Settlement & Objection Period Cleared',
    shareClassModel: 'Share / Equity Class Model (Art. 76(4))',
    multiClassRightsInMoaRegistered: 'Multi-Class Rights Explicitly Registered in MoA / AoA',
    hasInKindContributions: 'Company Capital Includes In-Kind Assets (Art. 78)',
    inKindValuationApproved: 'MoE-Compliant Valuation Approved for In-Kind Capital',
    exitClausesAnchoredInMoa: 'Drag-Along & Tag-Along Clauses Embedded in Registered MoA',
    successionRofrAndDeadlockInMoa: 'Succession RoFR Valuation & Art. 85 Deadlock Embedded in MoA',
    nonProfitDividendPayoutAttempted: 'Partner Profit Payout Attempted on Non-Profit (Art. 8 Breach)',
    shareCapitalAed: 'Registered Share Capital (AED)',
    existingStatutoryReserveAed: 'Existing Statutory Reserve (AED)',
    annualNetProfitAed: 'Annual Net Profit (AED)',
    annualReserveAllocationPct: 'Annual Statutory Reserve Allocation (%)',
    accumulatedLossesAed: 'Accumulated Capital Losses (AED)',
    daysSinceLossDisclosure: 'Days Since Loss Financial Disclosure',
    generalAssemblyConvenedForLoss: 'General Assembly Convened Within 30 Days of Loss',
    dissolutionMinority25PctPetition: '>= 25% Minority Dissolution Request Submitted (>= 75% Loss)',
    accountingBooksMaintained: 'Statutory Accounting Books & Partner Registers Maintained',
    inspectorCooperationBlocked: 'Withheld Records from Authorized Inspectors (Art. 350)',
    notes: 'Internal Governance Review Notes',
    trnValid: 'Valid 100 ✓',
    trnInvalid: 'Invalid Format ✗',
    trnEmpty: 'Optional',
    vaultTitle: 'Immutable CoLawAE Dossier Vault & SHA-256 Sealing (CLW-YYYY-0001)',
    vaultTitlePlaceholder: 'Optional dossier title (e.g., Mainland LLC Multi-Class MoA Restatement)',
    btnSaveDraft: 'Save Dossier Draft',
    btnSealDossier: 'Seal SHA-256',
    btnDuplicate: 'Duplicate',
    btnDelete: 'Delete',
    btnBriefMd: 'brief.md',
    btnExportCsv: 'export.csv',
    btnCopyBrief: 'Copy Brief MD',
    btnPublicView: 'View',
    savedVaultHeading: 'Saved Audit Dossiers',
    noSavedDossiers: 'No dossiers saved yet — save a draft and cryptographically seal it here.',
    sealedBadge: 'Sealed',
    draftBadge: 'Editable Draft',
    publicReportHeading: 'Sealed Public UAE Commercial Companies Governance Report',
    publicViewsLabel: 'Views:',
    backToStudio: 'Back to CoLawAE Studio',
    auditCsvTitle: 'Batch Cap-Table, Share-Class & Governance CSV Auditor (CWE-1236 Safe)',
    auditCsvDesc:
      'Audit 100% equity/voting summation, MoA class registration, in-kind valuation, Art. 8 dividend blocks & Art. 308 30d deadlines with CWE-1236 formula neutralization and UTF-8 BOM + CRLF export.',
    btnRunCsvAudit: 'Audit CSV',
    btnDownloadSafeCsv: 'Download Safe BOM CSV',
    btnLoadSampleCsv: 'Load Preset Sample',
    btnSanitizeCwe: 'Instant Sanitize',
  },
} as const;
