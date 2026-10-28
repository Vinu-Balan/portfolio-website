# Optimization log

Measurements taken on the development machine (Windows 11, **no hardware GPU**: headless browsers
render WebGL with SwiftShader, a CPU rasteriser). Lighthouse uses its default mobile emulation
(simulated slow 4G and 4x CPU slowdown).

## Iteration 1: first complete build

| Page     | Performance | Accessibility | Best practices | SEO |
| -------- | ----------- | ------------- | -------------- | --- |
| 3D world | 52–58       | 100           | 100            | 100 |
| Classic  | 70–71       | 100           | 100            | 100 |

Findings: FCP 4.1 s (Google Fonts stylesheet was render-blocking, about 3 s), LCP fired only when the
3D title appeared, TBT up to 890 ms while building the world.

## Iteration 2: unblock first paint

- Google Fonts loaded asynchronously (`preload` + `media="print"` swap, `font-display: swap`).
- Loader now shows the name, title and pitch in the first frame (fast LCP, and recruiters see who this
  is immediately).
- Classic mode skips the loader's minimum display time.
- Grass and ember buffers sized for the starting quality tier instead of the maximum.
- `compileAsync` for shaders where `KHR_parallel_shader_compile` exists.

Result: FCP 4.1 s → 1.5 s, LCP 4.7 s → 1.5 s. 3D world 75–79, Classic 85–100.

## Iteration 3: remove hidden main-thread costs

- Replaced a full-screen SVG `feTurbulence` paper texture with a 13 KB pre-rendered PNG tile.
- Removed the up-front WebGL probe context (about 500 ms on a throttled phone); the renderer's own
  context now supplies GPU limits, and a failed context falls back to Classic mode.

| Page     | Performance (3 runs) | Accessibility | Best practices | SEO |
| -------- | -------------------- | ------------- | -------------- | --- |
| 3D world | 71 / 84 / 91         | 100           | 96–100         | 100 |
| Classic  | 100 / 100 / 100      | 100           | 96             | 100 |

All Lighthouse CI assertions pass on the median run. The 3D page still varies between runs because
its score depends on how long the scene takes to build under a 4x CPU slowdown.

## Iteration 4: rider, wider map, full skills, music

- Software-rendered GPUs (SwiftShader, llvmpipe) are detected and start on the lowest quality tier.
  Same probe, same machine: previous build 1.3 fps on the map, this build 3.8 fps.
- Grain no longer animates in frozen test mode, so visual snapshots are stable.
- Background music is now a synthesised guitar loop; a unit test checks it is tonal, not noise
  (zero-crossing rate < 0.08; white noise is about 0.5).

## Bundle budget (`npm run budget`, GitHub Pages build)

| Measure                                        | Result   | Limit  |
| ---------------------------------------------- | -------- | ------ |
| Initial JS, gzipped (excludes lazy 3D chunks)  | 28.8 KB  | 250 KB |
| Lazy 3D vendors (three, gsap, howler), gzipped | 167.9 KB | n/a    |
| Total `dist/` size                             | 0.94 MB  | 3 MB   |

## Frame rate: what is and is not verified

- **Not verified here:** the 60 fps (laptop) and 30 fps (phone) targets. This machine has no GPU, so
  every measurement is software rendering. Please check on real hardware after deploying, for
  example with Chrome DevTools > Performance, or by watching the map for stutter.
- **Verified:** the adaptive quality manager steps down under load (unit tested), rendering pauses
  behind panels and in hidden tabs, and the Playwright FPS test enforces 50 fps on a hardware GPU and
  a "still rendering" floor of 2 fps on software GL.
