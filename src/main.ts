import './styles/tokens.css';
import './styles/base.css';
import './styles/world.css';
import './styles/panels.css';
import './styles/classic.css';
import { PERF } from './config';
import { portfolio } from './content/portfolio';
import { mountClassic } from './ui/classicMode';
import { requireElement } from './ui/component';
import { mountLoader, type Loader } from './ui/loader';
import { decideMode, measureFps, readDeviceSignals, type ClassicReason } from './utils/device';
import { readQueryFlags, type QueryFlags } from './utils/query';
import type { World } from './world/bootWorld';

/** Share of the loader bar reserved for downloading the 3D chunk itself. */
const CHUNK_PROGRESS = 0.15;

function showClassic(
  reason: ClassicReason | null,
  worldAvailable: boolean,
  onEnterWorld?: () => void,
): () => void {
  const root = requireElement('#main');
  document.body.dataset.state = 'journal';
  const classic = mountClassic({
    root,
    data: portfolio,
    reason,
    worldAvailable,
    ...(onEnterWorld ? { onEnterWorld } : {}),
  });
  window.scrollTo(0, 0);
  requireElement('.journal h1').focus({ preventScroll: true });
  return classic.dispose;
}

async function startWorld(loader: Loader, flags: QueryFlags): Promise<World> {
  loader.setProgress(CHUNK_PROGRESS / 3);
  const { bootWorld } = await import('./world/bootWorld');
  loader.setProgress(CHUNK_PROGRESS);
  const world = await bootWorld({
    data: portfolio,
    frozen: flags.freeze,
    quality: flags.quality,
    onProgress: (p) => {
      loader.setProgress(CHUNK_PROGRESS + p * (1 - CHUNK_PROGRESS));
    },
    onJournal: (onReturn) => {
      const dispose = showClassic(null, true, () => {
        dispose();
        onReturn();
      });
    },
  });
  document.body.classList.add('is-world');
  return world;
}

/** If the machine can't keep up on the title screen, swap to the journal rather than stutter. */
async function guardFrameRate(world: World, flags: QueryFlags): Promise<void> {
  if (flags.mode === 'world' || flags.freeze) return;
  const fps = await measureFps();
  if (fps >= PERF.classicFallbackBelowFps) return;
  world.dispose();
  document.body.classList.remove('is-world');
  showClassic('slow-fps', true);
}

async function boot(): Promise<void> {
  const flags = readQueryFlags();
  const signals = readDeviceSignals();
  const decision = decideMode(flags, signals);
  const loader = mountLoader();
  if (decision.mode === 'classic') {
    await loader.finish({ immediate: true });
    showClassic(decision.reason, signals.webgl);
    return;
  }
  try {
    const world = await startWorld(loader, flags);
    await loader.finish();
    world.showTitle();
    await guardFrameRate(world, flags);
  } catch (error) {
    // The journal carries 100% of the content, so any 3D failure degrades gracefully.
    console.warn('3D world unavailable, showing the journal instead.', error);
    await loader.finish();
    showClassic('no-webgl', false);
  }
}

void boot();
