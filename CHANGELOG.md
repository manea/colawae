# سجل التغييرات — CoLawAE (مدقق تعديلات قانون الشركات الإماراتي)

## [0.5.0] — 2026-11-25
- ترقية الحزمة والكتالوج والاختبارات إلى `0.5.0` وإصدار النسخة المفتوحة المصدر برخصة `MIT` ([`LICENSE`](LICENSE)).
- إضافة سير عمل التحقق المستمر [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (`Node 22`, `npm ci`, `npm run typecheck`, `npm test`, `npm run build`).
- توثيق المعرض البصري الكامل في [`README.md`](README.md) ونسخ لقطات المتصفح الست المعتمدة (`1.9M`) إلى [`docs/screenshots/`](docs/screenshots/01-workspace-ar-alabaster-governance.png).
- التحقق النهائي قبل الإطلاق: اجتياز `bash -n deploy/*.sh`، وبوابة التصدير النظيفة `EXPORT_CLEAN_OK`، وفحص الأنواع `tsc --noEmit`، واختبارات الوحدة والخادم `Vitest`، وبناء `Vite` الإنتاجي، واختبارات المتصفح الحقيقي `Playwright Chrome E2E`.

## [0.4.0] — 2026-11-25
- ترقية الحزمة والكتالوج والاختبارات إلى `0.4.0` وإضافة `@playwright/test ^1.56.0` و[`playwright.config.ts`](playwright.config.ts) (`:4254`) و[`tests/e2e/colawae.spec.ts`](tests/e2e/colawae.spec.ts)، مع توحيد قراءة `capTableCsv` في `handleSelectPreset` بـ [`src/App.tsx`](src/App.tsx) لضمان تقييم السيناريو 2 عند `70/100 CONDITIONAL`.
- تنفيذ اختبارات Chrome الحقيقية على سطح المكتب (`1280×800`) والجوال (`390×844`) في وضعَي `AR RTL Alabaster Governance` و`EN LTR Obsidian Corporate` عبر إعادة التحميل، وتصحيح السيناريو 2 وختم `CLW-2026-0001` ببصمة `SHA-256`، وتنزيل `UTF-8 BOM CSV` (`[0xef, 0xbb, 0xbf]`) عبر الشبكة، والتحقق من `/r/CLW-2026-0001` (`Views: 1 -> 2`) مع صفر أخطاء وصفري فيضان أفقي.
- المراجعة البصرية لـ 6 لقطات Chrome حية وتنقيح اتجاه `RTL BiDi` في [`src/components/ColawGovernanceSvg.tsx`](src/components/ColawGovernanceSvg.tsx) (`style={{ direction: isAr ? 'rtl' : 'ltr' }}` وترتيب البطاقات يمين-لليسار)، ومنع التباس `<`/`>` بالعربية في [`src/App.tsx`](src/App.tsx) و[`src/lib/i18n.ts`](src/lib/i18n.ts)، وضبط محاذاة مدخلات رأس المال/الاحتياطي ووسم `TRN 100` في [`src/components/GovernanceAndExposurePanel.tsx`](src/components/GovernanceAndExposurePanel.tsx).
- إعداد حزمة النشر الصفرية النظيفة: [`wrangler.jsonc`](wrangler.jsonc)، [`Dockerfile`](Dockerfile)، [`docker-compose.yml`](docker-compose.yml)، [`.dockerignore`](.dockerignore)، [`deploy/`](deploy/.env.example)، [`launch/DEPLOY-AND-SHARE.md`](launch/DEPLOY-AND-SHARE.md)، و[`README.md`](README.md).
- التحقق النهائي: `bash -n deploy/*.sh` (`0`)، `EXPORT_CLEAN_OK`، `tsc --noEmit 0`، **`Vitest 2/2 · 21/21 passed (617ms)`**، **`vite v8.3.8 build (793ms)`**، و**`Playwright Chrome E2E 3 passed (6.6s)`** مع خلوّ `:4253–:4255`.

## [0.3.0] — 2026-11-25
- ترقية الحزمة والكتالوج إلى `0.3.0` (`React ^19.2.0`, `Tailwind CSS ^4.1.17`, `Vite 8.3.8`, `lucide-react ^1.77.0`) وتحديث `tsconfig.json` لدعم `react-jsx` و`src/**/*.tsx` و`vite.config.ts`.
- بناء واجهة الويب الثنائية الاتجاه (`AR RTL / EN LTR`) بمظهرَي `Alabaster Governance` و`Obsidian Corporate` في `index.html` و`src/index.css` و`public/favicon.svg` و`src/main.tsx` و`vite.config.ts` (`:4254` نحو `:4253` تحت `BASE_PATH=/colawae`) دون ترويسة عائمة (`no sticky top-0`).
- إضافة طبقة `src/lib/{basePath,i18n,api}.ts` لدعم العمل المزدوج (`SQLite WAL / $0 localStorage`) وتنزيل CSV بـ `arrayBuffer()` المحافظ على `UTF-8 BOM`.
- بناء المكونات الخمسة في `src/components/`: `ColawGovernanceSvg.tsx` (بـ `<div dir="ltr">` حول `<svg>` لتفادي `TS2322` وضبط إحداثيات RTL)، و`GovernanceAndExposurePanel.tsx`، و`ControlsAndFindingsPanel.tsx`، و`CapTableCsvAuditPanel.tsx`، و`DossierVaultAndPrint.tsx`، وربطها في `src/App.tsx`.
- التحقق: `tsc --noEmit 0`، `Vitest 2/2 · 21/21 passed (919ms)`، `vite build (796ms)` (`2166 modules`, `dist/index.html 1.02 kB`, `CSS 14.32 kB`, `JS 333.49 kB`)، وفحص `/colawae` على `:4254` (`UI_SMOKE_OK 0.3.0 /colawae ROOT=200 SPA=200 FAV=200 JS=200 CSS=200 BASE_INJECT=true OK=true`) مع خلوّ `:4253–:4255`.

## [0.2.0] — 2026-11-25
### المضاف (المرحلة 2 — باني الملخصات وقاعدة `node:sqlite WAL` وخادم `HTTP/API`)
- ترقية الحزمة والكتالوج والاختبارات إلى `0.2.0` (`"dependencies": {}` وسكربت `"start": "node --no-warnings server/index.mjs"`) وإضافة [`src/core/briefBuilder.ts`](src/core/briefBuilder.ts) (`buildColawBriefMarkdown` ثنائي اللغة `AR/EN`).
- بناء طبقة التخزين [`server/db.mjs`](server/db.mjs) بوضع `node:sqlite WAL` وترقيم ذري `CLW-YYYY-0001` ومعرّف عام `clw-<hex>` (`profiles`, `dossier_counters`, `assessments`, `public_report_views`).
- بناء خادم Node.js صفري التبعيات [`server/app.mjs`](server/app.mjs) و[`server/index.mjs`](server/index.mjs) و[`server/app.d.mts`](server/app.d.mts) (`:4253`, `BASE_PATH=/colawae`, `/health`, `/readyz`, `/api/presets`, `/api/evaluate-obligations`, `/api/audit-captable`, `/api/export/captable-csv`, `/api/assess`, `/api/profiles`, `/api/(assessments|dossiers)`, `/duplicate`, `/finalize|lock` (`409`), `brief.md`, `export.csv` (`UTF-8 BOM + CRLF + CWE-1236`), `/summary`, `/api/public/reports/:slugOrCode`, حواجز `413`/`429` وحقن `window.__COLAWAE_BASE__`).
- إضافة [`tests/unit/colawServer.test.ts`](tests/unit/colawServer.test.ts) واجتياز `tsc --noEmit` (`0`) و**`Vitest 2/2 · 21/21 passed (719ms)`** والفحص الدخاني **`SMOKE_OK 0.2.0 colawae /colawae readyz=true wal=wal code=CLW-2026-0001 bom=efbbbf base=true`** مع خلوّ `:4253–:4255`.

## [0.1.0] — 2026-11-25
### المضاف (المرحلة 1 — البحث التشريعي والنواة الصفرية المتخصصة)
- تأسيس [`projects/colawae/`](package.json) بحزمة صفرية التبعيات التشغيلية (`"dependencies": {}`, رخصة `MIT`, `Node >= 22`, `TypeScript 5.9.3`, `Vitest 5.1.1`) وتوثيق المواصفة القانونية والمعمارية [`research/45-colawae-spec-and-architecture.md`](../../research/45-colawae-spec-and-architecture.md).
- بناء النواة الصفرية (`src/core/{types,colawCatalog,colawEngine,capTableCsvAuditor,dossierDigest,readinessAssessor,presets,index}.ts`) استناداً إلى **المرسوم بقانون اتحادي رقم `(32)` لسنة `2021`** المعدَّل بـ**المرسوم بقانون اتحادي رقم `(20)` لسنة `2025`** (الساري في `2025-11-15`) و**قرار مجلس الوزراء رقم `(102)` لسنة `2022`**:
  - مسار **نقل القيد الداخلي بلا تصفية (`المادة 15 مكرر`)** بين الإمارات والمناطق الحرة والبر الرئيسي (`DET / ADDED / Free Zones`).
  - دعم **فئات الحصص المتعددة بالـ LLC والـ PrJSC (`المادة 76/4`)** وتثبيتها بعقد التأسيس مع تقييم الحصص العينية (**المادة `78`**).
  - تقنين شروط السحب والمصاحبة (**`Drag-Along / Tag-Along`**) وأولوية حصة الشريك المتوفى (`RoFR`) وفك الجمود (**المادة `85`**).
  - حظر توزيع أرباح **الشركة غير الربحية (`المادة 8`)**، والاحتياطي القانوني **5% سنوياً حتى 50% من رأس المال (`المادة 103`)**.
  - ضوابط عجز رأس المال (**`50%` مع مهلة `30 يوماً` لدعوة الجمعية العمومية، و`75%` مع حق أقلية `25%` في طلب الحل بموجب المادة `308`/`309`**).
  - سُلّم جزاءات **`CR 102/2022`** (إنذار `30 يوماً` -> `10k/15k/100k د.إ` -> `2x` -> `3x` وخطر وقف الرخصة وتظلم `30 يوماً`) وعقوبة حجب السجلات عن المفتشين (**المادة `350`**: الحبس `3 أشهر – سنتين` وغرامة `10k–100k د.إ`)، وعزل المناطق الحرة والـ `DIFC/ADGM` خارج العمليات بالبر الرئيسي (**المادة `5`**).
  - مدقق دفعات جدول الحصص والفئات `CSV` مع تطبيع مجموع `100%` وتعقيم حقن الصيغ `CWE-1236` (`UTF-8 BOM + CRLF`) وفحص `UAE TRN 100` وبصمة `SHA-256`.
- اجتياز `tsc --noEmit` (`0`) و**`Vitest 1/1 · 15/15 passed (363ms)`** والتحقق المباشر على `Node 22` عبر `COLAW_PRESETS`.
