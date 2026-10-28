import { expect, type Page } from '@playwright/test';

/** Frozen world: no breathing camera, fixed lighting and instant fly-tos, so hotspots hold still. */
/** Pinned to high quality so snapshots do not depend on the test machine's GPU. */
export const WORLD_URL = '/?mode=world&freeze=1&quality=high';
export const CLASSIC_URL = '/?mode=classic';

export const LANDMARKS = [
  { id: 'camp', heading: 'About Vinu' },
  { id: 'sheriff', heading: 'Experience' },
  { id: 'workshop', heading: 'Skills' },
  { id: 'station', heading: 'Projects' },
  { id: 'telegraph', heading: 'Send a Telegram' },
] as const;

export async function waitForState(page: Page, state: string): Promise<void> {
  await expect(page.locator('body')).toHaveAttribute('data-state', state);
}

/** Load the frozen world and wait for the title menu. */
export async function gotoTitle(page: Page): Promise<void> {
  await page.goto(WORLD_URL);
  await waitForState(page, 'title');
  await expect(page.locator('#loader')).toHaveCount(0);
}

/** Title → map via "Begin the Journey". */
export async function gotoMap(page: Page): Promise<void> {
  await gotoTitle(page);
  await page.getByRole('button', { name: /Begin the Journey/ }).click();
  await waitForState(page, 'map');
}

export function panel(page: Page) {
  return page.getByRole('dialog');
}

/** Make WebGL unavailable before any page script runs. */
export async function disableWebGL(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound via .call below
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function patched(
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type.startsWith('webgl') || type === 'experimental-webgl') return null;
      return (original as (...args: unknown[]) => RenderingContext | null).call(
        this,
        type,
        ...rest,
      );
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

/** Desktop-only tests (keyboard, hover) skip on touch profiles. */
export function isMobileProject(projectName: string): boolean {
  return projectName === 'iphone-13' || projectName === 'pixel-7';
}
