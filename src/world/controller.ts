import { Vector3 } from 'three';
import { CAMERA, WORLD } from '../config';
import type { Portfolio } from '../content/portfolio';
import { bindMapKeys, bindPointerPick, type MapCommand } from '../core/input';
import type { Landmark } from '../landmarks/Landmark';
import { requireElement, type ListenerBag } from '../ui/component';
import { createHud, type Hud } from '../ui/hud';
import { createPaperPanel, type PaperPanel } from '../ui/paperPanel';
import { renderPanel, type PanelId } from '../ui/panels';
import { createTitleMenu, type TitleAction, type TitleMenu } from '../ui/titleMenu';
import { showToast } from '../ui/toast';
import { flyCameraTo } from '../utils/flyCameraTo';
import { wrapIndex } from '../utils/math';
import { createAmbience, type Ambience } from './audio';
import { vec3, type Core } from './core';
import { createHotspots, type Hotspots } from './hotspots';

export type WorldState = 'title' | 'map' | 'panel' | 'journal';

export interface ControllerOptions {
  readonly data: Portfolio;
  readonly frozen: boolean;
  /** Show classic journal mode; call `onReturn` to come back to the world. */
  readonly onJournal: (onReturn: () => void) => void;
}

export interface Controller {
  readonly showTitle: () => void;
  readonly openJournal: () => void;
  readonly dispose: () => void;
}

/** How far towards a landmark the camera drifts when it is selected but not opened. */
const PREVIEW_BLEND = 0.35;
/** Side-step so the landmark stays visible beside the right-hand panel on wide screens. */
const PANEL_SIDE_OFFSET = 6;
const WIDE_QUERY = '(min-width: 900px)';
const UP = new Vector3(0, 1, 0);

interface View {
  readonly position: Vector3;
  readonly target: Vector3;
}

interface Ui {
  readonly hud: Hud;
  readonly title: TitleMenu;
  readonly panel: PaperPanel;
  readonly hotspots: Hotspots;
  readonly ambience: Ambience;
  readonly bags: ListenerBag[];
}

/** Shared state for the navigation functions below; one object instead of a god-class. */
interface Ctx {
  readonly core: Core;
  readonly options: ControllerOptions;
  readonly landmarks: readonly Landmark[];
  readonly ui: Ui;
  state: WorldState;
  selected: number;
  factIndex: number;
  panelReturn: WorldState;
}

// --- Camera views ------------------------------------------------------------------

function overview(): View {
  return { position: vec3(CAMERA.overviewPosition), target: vec3(CAMERA.overviewTarget) };
}

function previewView(landmark: Landmark | undefined): View {
  const view = overview();
  if (!landmark) return view;
  return {
    position: view.position.lerp(landmark.view.position, PREVIEW_BLEND),
    target: view.target.lerp(landmark.view.target, PREVIEW_BLEND),
  };
}

function panelView(landmark: Landmark): View {
  const position = landmark.view.position.clone();
  const target = landmark.view.target.clone();
  if (!window.matchMedia(WIDE_QUERY).matches) return { position, target };
  const right = target
    .clone()
    .sub(position)
    .cross(UP)
    .normalize()
    .multiplyScalar(PANEL_SIDE_OFFSET);
  return { position: position.add(right), target: target.add(right) };
}

function fly(ctx: Ctx, to: View): Promise<void> {
  return flyCameraTo(ctx.core.rig, to, { instant: ctx.options.frozen });
}

// --- State transitions ---------------------------------------------------------------

function setState(ctx: Ctx, state: WorldState): void {
  ctx.state = state;
  document.body.dataset.state = state;
  const { hud, title, hotspots } = ctx.ui;
  hotspots.setVisible(state === 'map');
  if (state === 'map') hud.show();
  else hud.hide();
  if (state === 'title') title.show();
  else title.hide();
}

function select(ctx: Ctx, index: number, move = true): void {
  ctx.selected = wrapIndex(index, ctx.landmarks.length);
  const landmark = ctx.landmarks[ctx.selected];
  if (!landmark) return;
  ctx.ui.hud.setSelected(landmark.id);
  ctx.ui.hotspots.setActive(landmark.id);
  if (move) void fly(ctx, previewView(landmark));
}

function openPanel(ctx: Ctx, panelId: PanelId, returnTo: WorldState): void {
  ctx.panelReturn = returnTo;
  const label = returnTo === 'title' ? 'Back to title' : 'Return to map';
  setState(ctx, 'panel');
  ctx.ui.panel.open(renderPanel(panelId, ctx.options.data, { interactive: true }), label);
  // Draw the arrival frame, then stop rendering: the panel covers the scene.
  ctx.core.loop.renderOnce();
  ctx.core.loop.pause('panel');
}

async function openLandmark(ctx: Ctx, id: string): Promise<void> {
  const index = ctx.landmarks.findIndex((l) => l.id === id);
  const landmark = ctx.landmarks[index];
  if (!landmark || ctx.state === 'panel') return;
  select(ctx, index, false);
  await fly(ctx, panelView(landmark));
  openPanel(ctx, landmark.panel, 'map');
}

function onPanelClosed(ctx: Ctx): void {
  ctx.core.loop.resume('panel');
  setState(ctx, ctx.panelReturn);
  if (ctx.panelReturn === 'map') select(ctx, ctx.selected);
}

async function startJourney(ctx: Ctx): Promise<void> {
  setState(ctx, 'map');
  select(ctx, ctx.selected, false);
  await fly(ctx, previewView(ctx.landmarks[ctx.selected]));
}

function showTitle(ctx: Ctx): void {
  setState(ctx, 'title');
  const { titleView } = ctx.core.world;
  void fly(ctx, { position: titleView.position.clone(), target: titleView.target.clone() });
}

function openJournal(ctx: Ctx): void {
  const previous = ctx.state === 'panel' ? ctx.panelReturn : ctx.state;
  ctx.ui.panel.close();
  setState(ctx, 'journal');
  ctx.core.loop.pause('classic');
  ctx.options.onJournal(() => {
    ctx.core.loop.resume('classic');
    setState(ctx, previous === 'journal' ? 'title' : previous);
  });
}

async function toggleSound(ctx: Ctx): Promise<void> {
  ctx.ui.hud.setSoundOn(await ctx.ui.ambience.toggle());
}

function catchTumbleweed(ctx: Ctx): void {
  const facts = ctx.options.data.funFacts;
  const fact = facts[ctx.factIndex % facts.length];
  ctx.factIndex += 1;
  if (fact) showToast(`Tumbleweed caught! ${fact}`);
}

// --- Input routing ---------------------------------------------------------------------

function onTitleAction(ctx: Ctx, action: TitleAction): void {
  if (action === 'journey') void startJourney(ctx);
  else if (action === 'journal') openJournal(ctx);
  else openPanel(ctx, action === 'wanted' ? 'wanted' : 'contact', 'title');
}

function onCommand(ctx: Ctx, command: MapCommand): void {
  if (command === 'next') select(ctx, ctx.selected + 1);
  else if (command === 'previous') select(ctx, ctx.selected - 1);
  else if (command === 'open') void openLandmark(ctx, ctx.landmarks[ctx.selected]?.id ?? '');
  else void fly(ctx, previewView(ctx.landmarks[ctx.selected]));
}

function onPick(ctx: Ctx, id: string): void {
  if (ctx.state !== 'map') return;
  if (id === 'tumbleweed') catchTumbleweed(ctx);
  else void openLandmark(ctx, id);
}

// --- UI construction ---------------------------------------------------------------------

/** Late-bound callbacks: the UI is built before the context that the handlers need exists. */
type Handlers = { ctx: Ctx | null };

function withCtx<A extends unknown[]>(
  handlers: Handlers,
  fn: (ctx: Ctx, ...args: A) => void,
): (...args: A) => void {
  return (...args) => {
    if (handlers.ctx) fn(handlers.ctx, ...args);
  };
}

function createHotspotLayer(core: Core, handlers: Handlers): Hotspots {
  const landmarkSpots = core.world.landmarks.map((l) => ({
    id: l.id,
    label: l.section,
    ariaLabel: `Open ${l.section} at the ${l.label}`,
    anchor: () => l.anchor,
    onActivate: withCtx(handlers, (ctx) => {
      void openLandmark(ctx, l.id);
    }),
  }));
  const tumbleSpot = {
    id: 'tumbleweed',
    label: '?',
    ariaLabel: 'Catch the tumbleweed for a fun fact',
    className: 'tumble-spot',
    anchor: () => core.world.tumbleweed.anchor(),
    onActivate: withCtx(handlers, catchTumbleweed),
  };
  const hotspots = createHotspots(requireElement('#hotspots'), [...landmarkSpots, tumbleSpot]);
  core.onFrame(() => {
    hotspots.update(core.world.camera, core.stage.clientWidth, core.stage.clientHeight);
  });
  return hotspots;
}

function createHudFor(core: Core, data: Portfolio, handlers: Handlers): Hud {
  const hudLandmarks = core.world.landmarks.map((l) => ({
    id: l.id,
    label: l.label,
    section: l.section,
    x: l.group.position.x,
    z: l.group.position.z,
  }));
  return createHud(data, hudLandmarks, {
    onSelect: withCtx(handlers, (ctx, id: string) => {
      select(
        ctx,
        ctx.landmarks.findIndex((l) => l.id === id),
      );
    }),
    onOpen: withCtx(handlers, (ctx, id: string) => {
      void openLandmark(ctx, id);
    }),
    onStep: withCtx(handlers, (ctx, direction: 1 | -1) => {
      select(ctx, ctx.selected + direction);
    }),
    onResume: withCtx(handlers, (ctx) => {
      openPanel(ctx, 'wanted', 'map');
    }),
    onJournal: withCtx(handlers, openJournal),
    onToggleSound: withCtx(handlers, (ctx) => {
      void toggleSound(ctx);
    }),
    onTitle: withCtx(handlers, showTitle),
  });
}

function createUi(core: Core, data: Portfolio, handlers: Handlers): Ui {
  const hud = createHudFor(core, data, handlers);
  const title = createTitleMenu(data, withCtx(handlers, onTitleAction));
  const panel = createPaperPanel({
    root: requireElement('#panel-root'),
    onClose: withCtx(handlers, onPanelClosed),
  });
  const hotspots = createHotspotLayer(core, handlers);
  requireElement('#main').append(title.element, hud.element);
  const pickables = [...core.world.landmarks.map((l) => l.group), core.world.tumbleweed.group];
  const bags = [
    bindPointerPick(
      core.renderer.domElement,
      core.world.camera,
      () => pickables,
      withCtx(handlers, onPick),
    ),
    bindMapKeys(() => handlers.ctx?.state === 'map', withCtx(handlers, onCommand)),
  ];
  return { hud, title, panel, hotspots, ambience: createAmbience(WORLD.seed), bags };
}

function disposeUi(ui: Ui): void {
  ui.bags.forEach((bag) => {
    bag.dispose();
  });
  ui.hotspots.dispose();
  ui.panel.dispose();
  ui.ambience.dispose();
  ui.hud.element.remove();
  ui.title.element.remove();
}

/**
 * Navigation state machine for the world: title → map ⇄ panel, plus the journal.
 * Owns all world-mode UI so every transition is defined in one place.
 */
export function createController(core: Core, options: ControllerOptions): Controller {
  const handlers: Handlers = { ctx: null };
  const ui = createUi(core, options.data, handlers);
  const ctx: Ctx = {
    core,
    options,
    landmarks: core.world.landmarks,
    ui,
    state: 'title',
    selected: 0,
    factIndex: 0,
    panelReturn: 'map',
  };
  handlers.ctx = ctx;
  select(ctx, 0, false);
  return {
    showTitle: () => {
      showTitle(ctx);
    },
    openJournal: () => {
      openJournal(ctx);
    },
    dispose: () => {
      disposeUi(ui);
    },
  };
}
