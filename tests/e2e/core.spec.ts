import { expect, test, type ConsoleMessage, type Request } from '@playwright/test';
import { portfolio } from '../../src/content/portfolio';
import {
  CLASSIC_URL,
  gotoMap,
  gotoTitle,
  LANDMARKS,
  panel,
  waitForState,
  WORLD_URL,
} from './helpers';

const LOAD_LIMIT_MS = 20_000;
/**
 * Chrome's GPU process forwards driver diagnostics (e.g. "GPU stall due to ReadPixels"
 * while headless captures frames) as console warnings. They do not come from page code.
 */
const DRIVER_NOISE = /GL Driver Message/;

test.describe('health', () => {
  for (const url of [WORLD_URL, CLASSIC_URL]) {
    test(`no console errors or failed requests on ${url}`, async ({ page }) => {
      const problems: string[] = [];
      page.on('console', (msg: ConsoleMessage) => {
        if (DRIVER_NOISE.test(msg.text())) return;
        if (msg.type() === 'error' || msg.type() === 'warning')
          problems.push(`${msg.type()}: ${msg.text()}`);
      });
      page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
      page.on('requestfailed', (request: Request) => problems.push(`failed: ${request.url()}`));
      page.on('response', (response) => {
        if (response.status() >= 400) problems.push(`${response.status()}: ${response.url()}`);
      });
      await page.goto(url);
      await waitForState(page, url === WORLD_URL ? 'title' : 'journal');
      await page.waitForTimeout(1000);
      expect(problems).toEqual([]);
    });
  }

  test('loader finishes and the title menu appears in time', async ({ page }) => {
    const start = Date.now();
    await page.goto(WORLD_URL);
    await expect(page.getByRole('button', { name: /Begin the Journey/ })).toBeVisible({
      timeout: LOAD_LIMIT_MS,
    });
    expect(Date.now() - start).toBeLessThan(LOAD_LIMIT_MS);
  });
});

test.describe('resume', () => {
  test('"Skip to resume" is visible immediately and serves the PDF', async ({ page, request }) => {
    await page.goto(WORLD_URL, { waitUntil: 'commit' });
    const skip = page.getByRole('link', { name: 'Skip to resume' });
    await expect(skip).toBeVisible();
    const href = await skip.getAttribute('href');
    expect(href).toBe('resume.pdf');
    const response = await request.get(`/${href ?? ''}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
  });

  test('wanted poster downloads the resume', async ({ page }) => {
    await gotoTitle(page);
    await page.getByRole('button', { name: /Wanted Poster/ }).click();
    await expect(panel(page).getByRole('heading', { name: 'Wanted Poster' })).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('resume-download').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('Vinu_Balan_J_Resume.pdf');
  });
});

test.describe('landmarks', () => {
  for (const [index, landmark] of LANDMARKS.entries()) {
    test(`${landmark.id}: click opens "${landmark.heading}", Esc closes`, async ({ page }) => {
      await gotoMap(page);
      await page.locator(`[data-landmark="${landmark.id}"]`).click();
      await expect(
        panel(page).getByRole('heading', { level: 2, name: landmark.heading }),
      ).toBeVisible();
      await waitForState(page, 'panel');
      await page.keyboard.press('Escape');
      await expect(panel(page)).toBeHidden();
      await waitForState(page, 'map');
    });

    test(`${landmark.id}: keyboard cycles and Enter opens "${landmark.heading}"`, async ({
      page,
    }, info) => {
      test.skip(
        info.project.name === 'iphone-13' || info.project.name === 'pixel-7',
        'Keyboard-only flow',
      );
      await gotoMap(page);
      await page.locator('body').focus();
      for (let i = 0; i < index; i++) await page.keyboard.press(i % 2 === 0 ? 'ArrowRight' : 'd');
      await page.keyboard.press('Enter');
      await expect(
        panel(page).getByRole('heading', { level: 2, name: landmark.heading }),
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await waitForState(page, 'map');
    });
  }

  test('"Return to map" closes the panel', async ({ page }) => {
    await gotoMap(page);
    await page.locator('[data-landmark="camp"]').click();
    await page.getByRole('button', { name: 'Return to map' }).click();
    await waitForState(page, 'map');
  });
});

test.describe('projects', () => {
  test('every train car shows links that match portfolio.ts', async ({ page }) => {
    await gotoMap(page);
    await page.locator('[data-landmark="station"]').click();
    for (const project of portfolio.projects) {
      await page.locator(`[data-car="${project.id}"]`).click();
      const card = panel(page).locator(`[data-project="${project.id}"]`);
      await expect(card.getByRole('heading', { name: project.name })).toBeVisible();
      const hrefs = await card
        .locator('.dispatch-links a')
        .evaluateAll((links) => links.map((a) => a.getAttribute('href')));
      const expected = [project.liveUrl, project.repoUrl].filter(Boolean);
      expect(hrefs).toEqual(expected);
    }
  });

  test('classic mode lists every project with the same links', async ({ page }) => {
    await page.goto(CLASSIC_URL);
    for (const project of portfolio.projects) {
      const card = page.locator(`[data-project="${project.id}"]`);
      if (project.repoUrl)
        await expect(card.locator(`a[href="${project.repoUrl}"]`)).toHaveCount(1);
      if (project.liveUrl)
        await expect(card.locator(`a[href="${project.liveUrl}"]`)).toHaveCount(1);
    }
  });
});

test.describe('contact telegram', () => {
  test('validates empty, bad email, then succeeds', async ({ page }) => {
    await page.addInitScript(() => {
      const opened: string[] = [];
      (window as unknown as { __opened: string[] }).__opened = opened;
      window.open = (url?: string | URL) => {
        opened.push(String(url));
        return null;
      };
    });
    await gotoTitle(page);
    await page.getByRole('button', { name: /Send a Telegram/ }).click();
    const form = panel(page).getByRole('form', { name: 'Send a telegram' });
    await form.getByRole('button', { name: 'Send telegram' }).click();
    await expect(form.locator('[data-error-for="name"]')).not.toBeEmpty();
    await expect(form.locator('[data-error-for="email"]')).not.toBeEmpty();
    await expect(form.locator('[data-error-for="message"]')).not.toBeEmpty();

    await form.getByLabel('Your name').fill('Ada Lovelace');
    await form.getByLabel('Reply-to email').fill('ada@nowhere');
    await form.getByLabel('Message').fill('We would love to talk about a role.');
    await form.getByRole('button', { name: 'Send telegram' }).click();
    await expect(form.locator('[data-error-for="email"]')).toContainText('looks off');
    await expect(form.getByLabel('Reply-to email')).toHaveAttribute('aria-invalid', 'true');

    await form.getByLabel('Reply-to email').fill('ada@example.com');
    await form.getByRole('button', { name: 'Send telegram' }).click();
    await expect(form.getByRole('status')).toContainText('STOP');
    const opened = await page.evaluate(
      () => (window as unknown as { __opened: string[] }).__opened,
    );
    expect(opened[0]).toContain(`mailto:${portfolio.contact.email}`);
  });
});
