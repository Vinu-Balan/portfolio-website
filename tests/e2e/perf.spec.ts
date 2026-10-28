import { expect, test } from '@playwright/test';
import { waitForState } from './helpers';

const SAMPLE_MS = 5000;
/** Real-GPU target from the brief. */
const HARDWARE_FPS = Number(process.env.FPS_MIN ?? 50);
/**
 * Headless browsers often fall back to a CPU rasteriser (SwiftShader/llvmpipe), which
 * cannot reach real-GPU frame rates. We still enforce a floor so regressions show up,
 * and annotate the run so the log says which threshold applied.
 */
const SOFTWARE_FPS = Number(process.env.FPS_MIN_SOFTWARE ?? 2);
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|software|basic render/i;

test('map holds its frame-rate budget over 5 seconds', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium', 'Measured once, on desktop Chromium');
  await page.goto('/?mode=world');
  await waitForState(page, 'title');
  await page.getByRole('button', { name: /Begin the Journey/ }).click();
  await waitForState(page, 'map');
  await page.waitForTimeout(2500);

  const renderer = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return ext && gl ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown';
  });
  const fps = await page.evaluate(
    (duration) =>
      new Promise<number>((resolve) => {
        let frames = 0;
        const start = performance.now();
        const tick = (now: number): void => {
          frames += 1;
          if (now - start < duration) requestAnimationFrame(tick);
          else resolve((frames * 1000) / (now - start));
        };
        requestAnimationFrame(tick);
      }),
    SAMPLE_MS,
  );
  const software = SOFTWARE_RENDERER.test(renderer);
  const threshold = software ? SOFTWARE_FPS : HARDWARE_FPS;
  info.annotations.push({
    type: 'fps',
    description: `${fps.toFixed(1)} fps on "${renderer}" (min ${threshold})`,
  });
  console.warn(`[perf] ${fps.toFixed(1)} fps on ${renderer}; threshold ${threshold}`);
  expect(fps).toBeGreaterThanOrEqual(threshold);
});
