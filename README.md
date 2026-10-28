# Vinu Balan J — Frontier Portfolio

A cinematic, western-themed "open world" portfolio: a campfire title screen, a low-poly valley with
five landmarks, a rider who travels between them, and paper-style panels for each section. A fully
accessible **Classic mode** (a plain scrolling journal) contains 100% of the content and is served
automatically on reduced-motion, no-WebGL and low-end devices.

Built with Vite, strict TypeScript, Three.js, GSAP and Howler. Everything in the 3D world and the
music is generated procedurally in code, so there are no downloaded models, textures or audio.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

URL options: `/?mode=classic` (journal), `/?mode=world` (force 3D),
`/?mode=world&freeze=1` (no animation, used by the visual tests).

In the 3D map: click a signpost, or use ←/→ (or A/D) to choose a place, **Enter** to open it,
**Esc** to close it.

## Scripts

| Command                | What it does                                          |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Dev server with hot reload                            |
| `npm run build`        | Production build to `dist/`                           |
| `npm run build:pages`  | Build with the GitHub Pages base path                 |
| `npm run preview`      | Serve `dist/` on http://localhost:4173                |
| `npm run lint`         | ESLint (strict, type-aware) + Prettier check          |
| `npm run typecheck`    | `tsc --noEmit`                                        |
| `npm test`             | Vitest unit tests                                     |
| `npx playwright test`  | End-to-end, visual, a11y and FPS tests on 5 profiles  |
| `npm run budget`       | Checks the build against the size budget              |
| `npm run lhci`         | Lighthouse CI (mobile) against `dist/`                |
| `npm run og`           | Regenerates `public/og-image.png` and the touch icon  |
| `npm run check:resume` | Warns if `public/resume.pdf` is still the placeholder |

## Editing your content

All text lives in **[src/content/portfolio.ts](src/content/portfolio.ts)**: profile, jobs, projects,
skills, education, accomplishments, contact details and the site URL. Scene code never contains copy.
The 3D panels and Classic mode render from the same data, so they cannot drift apart.

- **Resume PDF:** replace `public/resume.pdf` with your real file. The deploy workflow refuses to
  publish while it is still the generated placeholder.
- **Project screenshots:** put images in `public/` and set `image: 'shot.webp'` on a project.
  Without one, a drawn placeholder card is shown.
- **Live demo links:** add `liveUrl` to a project; a "Visit" button appears automatically.
- **Contact form:** with `formspreeId: ''` (the default) the telegram opens the visitor's email app
  with the message filled in. To send directly instead, create a form at formspree.io and paste its
  id into `formspreeId`.
- **Skill meters:** the `level` values are self-assessed numbers; change them freely.

## Architecture

```
src/
  main.ts           boot: loader -> pick mode -> lazy-load the 3D world
  config.ts         every named constant (colours, camera, quality tiers, rider, audio)
  content/          portfolio.ts (typed data only)
  core/             renderer, frame loop, resize, adaptive quality, input, loading manager
  scene/            terrain, sky, lighting cycle, grass, embers, tumbleweed, rider, post-FX
  landmarks/        one module per landmark behind a shared Landmark interface
  world/            core (rendering), controller (navigation state machine), hotspots, audio
  ui/               paper panel, HUD, title menu, loader, classic mode, panel renderers
  utils/            math, easing, seeded random, device detection, disposal, camera fly-to
  shaders/          GLSL (sky, grass wind, embers, film-grain post-process)
  styles/           tokens + base + world + panels + classic CSS
```

Design notes:

- **Lazy 3D:** the loader and Classic mode ship in about 11 KB of gzipped JS. Three.js, GSAP and the
  world code load afterwards, so first paint does not wait for them.
- **Mode choice:** Classic mode is used for `prefers-reduced-motion`, missing WebGL, low-memory or
  low-core devices, or if a short frame-rate probe on the title screen is too slow.
- **Adaptive quality:** pixel ratio, shadows, particle and grass counts and post-processing step down
  when the frame rate sags and only step back up after a sustained streak.
- **Rendering pauses** when the tab is hidden or a panel covers the scene.
- **Accessibility:** panels are real DOM with headings; landmarks have keyboard-reachable buttons
  pinned over the canvas; focus is trapped in open dialogs; text meets WCAG AA contrast.

## Deploying to GitHub Pages

The repository is `https://github.com/Vinu-Balan/portfolio-website`, so the site is served from
`https://vinu-balan.github.io/portfolio-website/`.

1. Put your real resume at `public/resume.pdf`.
2. Push to the `main` branch of the repository.
3. In GitHub: **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` lints, type-checks, tests, builds with
   `BASE_PATH=/portfolio-website/`, checks the size budget and publishes `dist/`.

Using a custom domain or a differently named repo? Change `siteUrl` in `portfolio.ts` and the
`BASE_PATH` value in the workflow (use `/` for a custom domain).

## Testing

`npx playwright test` builds the site and runs, on Chromium, Firefox, WebKit, iPhone 13 and Pixel 7:
console/network health, loader timing, resume download, every landmark by click and keyboard,
project links, contact validation, Classic mode under reduced motion and without WebGL, mobile
layout, an axe accessibility scan, visual snapshots, and a 5-second FPS sample.

Headless browsers usually render with a software GPU, so the FPS test applies a lower floor there and
reports which renderer it measured. Visual snapshots are stored per browser in
`tests/e2e/__screenshots__`; regenerate them with `npx playwright test -g visual --update-snapshots`
after an intentional visual change.

See [OPTIMIZATION_LOG.md](OPTIMIZATION_LOG.md) for measured scores and [CREDITS.md](CREDITS.md) for
licences.
