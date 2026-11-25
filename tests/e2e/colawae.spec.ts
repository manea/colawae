import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

async function assertNoHorizontalOverflow(page: Page) {
  const dims = await page.evaluate(() => {
    const main = document.querySelector('main');
    const header = document.querySelector('header');
    const mainRect = main?.getBoundingClientRect();
    const headerRect = header?.getBoundingClientRect();
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      mainWidth: mainRect ? Math.ceil(mainRect.width) : 0,
      headerWidth: headerRect ? Math.ceil(headerRect.width) : 0,
    };
  });
  expect(dims.scrollWidth).toBeLessThanOrEqual(dims.innerWidth);
  expect(dims.mainWidth).toBeLessThanOrEqual(dims.innerWidth);
  expect(dims.headerWidth).toBeLessThanOrEqual(dims.innerWidth);
}

test.describe('CoLawAE — UAE FDL 32/2021, FDL 20/2025 & CR 102/2022 E2E', () => {
  test('defaults to AR RTL Alabaster Governance, toggles EN LTR Obsidian Corporate, and persists across reload', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.locator('header')).toContainText('SQLite WAL');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'alabaster-governance');
    await expect(page.locator('svg[role="img"]').first()).toBeVisible();
    await expect(page.getByTestId('kpi-score-card')).toContainText('100/100');
    await expect(page.getByTestId('legal-disclaimer-banner')).toContainText('ولا تتبع وزارة الاقتصاد الإماراتية');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/01-workspace-ar-alabaster-governance.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.getByTestId('lang-toggle-btn').click();
    await page.getByTestId('theme-toggle-btn').click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'obsidian-corporate');
    await expect(page.getByTestId('legal-disclaimer-banner')).toContainText(
      'not affiliated with the UAE Ministry of Economy',
    );
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/02-workspace-en-obsidian-corporate.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'obsidian-corporate');

    expect(errors).toEqual([]);
  });

  test('evaluates Presets 1/3/2, inspects CWE-1236 CSV, remediates Preset 2, seals CLW-2026-0001 with BOM CSV & /r/:code views', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const expectedCode = 'CLW-2026-0001';

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.getByTestId('lang-toggle-btn').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page
      .getByTestId('preset-select')
      .selectOption('preset-ready-mainland-llc-multiclass-redomicile');
    await expect(page.getByTestId('kpi-score-card')).toContainText('100/100');
    await expect(page.getByTestId('kpi-score-card')).toContainText('READY');

    await page.getByTestId('preset-select').selectOption('preset-blocked-art308-overdue-repeat-3x');
    await expect(page.getByTestId('kpi-score-card')).toContainText('0/100');
    await expect(page.getByTestId('kpi-score-card')).toContainText('BLOCKED');
    await expect(page.locator('main')).toContainText('300,000');
    await expect(page.locator('main')).toContainText('82%');

    await page.getByTestId('tab-captable').click();
    await expect(page.getByTestId('csv-audit-panel')).toContainText('CWE-1236');
    await page.getByTestId('tab-dashboard').click();

    await page
      .getByTestId('preset-select')
      .selectOption('preset-conditional-sideletter-migration-gap');
    await expect(page.getByTestId('kpi-score-card')).toContainText('70/100');
    await expect(page.getByTestId('kpi-score-card')).toContainText('CONDITIONAL');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/03-conditional-migration-desktop.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.getByTestId('dual-registrar-checkbox').check();
    await page.getByTestId('share-class-select').selectOption('multi_class_moa_registered');
    await page.getByTestId('moa-classes-checkbox').check();
    await expect(page.getByTestId('kpi-score-card')).toContainText('100/100');
    await expect(page.getByTestId('kpi-score-card')).toContainText('READY');

    await page.getByTestId('tab-vault').click();
    await page.getByTestId('save-draft-btn').click();
    await expect(page.getByTestId(`dossier-card-${expectedCode}`)).toBeVisible();

    await page.getByTestId(`seal-btn-${expectedCode}`).click();
    await expect(page.getByTestId(`seal-btn-${expectedCode}`)).toHaveCount(0);
    await expect(page.getByTestId(`view-public-btn-${expectedCode}`)).toBeVisible();

    const dlPromise = page.waitForEvent('download');
    await page.getByTestId(`export-csv-btn-${expectedCode}`).click();
    const dl = await dlPromise;
    expect(dl.suggestedFilename()).toContain('.csv');
    const dlPath = await dl.path();
    expect(dlPath).toBeTruthy();
    if (dlPath) {
      const bytes = fs.readFileSync(dlPath);
      expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    }

    await page.screenshot({
      path: 'test-results/qa-screenshots/04-sealed-dossier-desktop.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.getByTestId(`view-public-btn-${expectedCode}`).click();
    await expect(page.locator('body')).toContainText(expectedCode);
    await expect(page.locator('body')).toContainText('Al Majaz Tech Solutions LLC');
    await expect(page.locator('body')).toContainText('SHA-256:');
    await expect(page.getByTestId('public-view-count')).toContainText('1');

    await page.reload();
    await expect(page.locator('body')).toContainText(expectedCode);
    await expect(page.getByTestId('public-view-count')).toContainText('2');

    expect(errors).toEqual([]);
  });

  test('verifies mobile 390x844 responsiveness in AR Alabaster Governance and EN Obsidian Corporate with zero overflow', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('svg[role="img"]').first()).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/05-mobile-ar-alabaster-governance.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.getByTestId('lang-toggle-btn').click();
    await page.getByTestId('theme-toggle-btn').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'obsidian-corporate');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/06-mobile-en-obsidian-corporate.png',
      fullPage: true,
      animations: 'disabled',
    });

    expect(errors).toEqual([]);
  });
});
