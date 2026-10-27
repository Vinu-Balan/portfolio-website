import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { portfolio } from '../../src/content/portfolio';
import {
  CLASSIC_URL,
  disableWebGL,
  gotoMap,
  gotoTitle,
  isMobileProject,
  LANDMARKS,
  panel,
  waitForState,
} from './helpers';

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

async function expectAccessible(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).exclude('#stage').analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

test.describe('classic mode', () => {
  test('is served when reduced motion is preferred', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForState(page, 'journal');
    await expect(page.locator('.journal')).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.getByText('prefers reduced motion')).toBeVisible();
  });

  test('is served when WebGL is unavailable', async ({ page }) => {
    await disableWebGL(page);
    await page.goto('/');
    await waitForState(page, 'journal');
    await expect(page.getByText('3D graphics are unavailable')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Enter the 3D world' })).toHaveCount(0);
  });

  test('contains every section and the resume link', async ({ page }) => {
    await page.goto(CLASSIC_URL);
    for (const name of ['About Vinu', 'Experience', 'Projects', 'Skills', 'Send a Telegram']) {
      await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'Download resume (PDF)' })).toHaveAttribute(
      'href',
      /resume\.pdf$/,
    );
    for (const job of portfolio.jobs) await expect(page.getByText(job.role)).toBeVisible();
  });

  test('"Read the Journal" switches from the world and back', async ({ page }) => {
    await gotoTitle(page);
    await page.getByRole('button', { name: /Read the Journal/ }).click();
    await waitForState(page, 'journal');
    await page.getByRole('button', { name: 'Return to the 3D world' }).click();
    await waitForState(page, 'title');
  });
});

test.describe('mobile & layout', () => {
  test('no horizontal scroll on title, map, panel and journal', async ({ page }) => {
    await gotoMap(page);
    await expectNoHorizontalScroll(page);
    await page.locator('[data-landmark="sheriff"]').click();
    await expectNoHorizontalScroll(page);
    await page.goto(CLASSIC_URL);
    await expectNoHorizontalScroll(page);
  });

  test('touch navigation: next + open buttons reach a landmark', async ({ page }, info) => {
    test.skip(!isMobileProject(info.project.name), 'Touch profiles only');
    await gotoMap(page);
    await page.getByRole('button', { name: 'Next landmark' }).tap();
    await page.locator('.hud-open').tap();
    await expect(panel(page).getByRole('heading', { level: 2, name: 'Experience' })).toBeVisible();
  });
});

test.describe('accessibility (axe)', () => {
  test('title, map and classic have no serious violations', async ({ page }) => {
    await gotoTitle(page);
    await expectAccessible(page);
    await page.getByRole('button', { name: /Begin the Journey/ }).click();
    await waitForState(page, 'map');
    await expectAccessible(page);
    await page.goto(CLASSIC_URL);
    await waitForState(page, 'journal');
    await expectAccessible(page);
  });

  test('every panel has no serious violations', async ({ page }) => {
    await gotoMap(page);
    for (const landmark of LANDMARKS) {
      await page.locator(`[data-landmark="${landmark.id}"]`).click();
      await waitForState(page, 'panel');
      await expectAccessible(page);
      await page.keyboard.press('Escape');
      await waitForState(page, 'map');
    }
  });
});

test.describe('visual regression', () => {
  test('title screen', async ({ page }) => {
    await gotoTitle(page);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('title.png');
  });

  test('map', async ({ page }) => {
    await gotoMap(page);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('map.png');
  });

  for (const landmark of LANDMARKS) {
    test(`panel: ${landmark.id}`, async ({ page }) => {
      await gotoMap(page);
      await page.locator(`[data-landmark="${landmark.id}"]`).click();
      await waitForState(page, 'panel');
      await page.waitForTimeout(600);
      // Snapshot the panel itself; the scene behind it is covered by the title/map shots.
      await expect(panel(page)).toHaveScreenshot(`panel-${landmark.id}.png`);
    });
  }

  test('classic journal', async ({ page }) => {
    await page.goto(CLASSIC_URL);
    await waitForState(page, 'journal');
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot('classic.png');
  });
});
