import { Raycaster, Vector2, type Camera, type Object3D } from 'three';
import { ListenerBag } from '../ui/component';

export type MapCommand = 'next' | 'previous' | 'open' | 'close';

const KEY_COMMANDS: Record<string, MapCommand> = {
  ArrowRight: 'next',
  ArrowDown: 'next',
  d: 'next',
  s: 'next',
  ArrowLeft: 'previous',
  ArrowUp: 'previous',
  a: 'previous',
  w: 'previous',
  Enter: 'open',
  Escape: 'close',
};

/** Map a key to a navigation command; case-insensitive for WASD. */
export function commandForKey(key: string): MapCommand | null {
  return KEY_COMMANDS[key] ?? KEY_COMMANDS[key.toLowerCase()] ?? null;
}

/** Keys typed into form fields or used to activate focused buttons belong to that element. */
function isOwnedByControl(target: EventTarget | null, command: MapCommand): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]'))
    return true;
  return command === 'open' && target.closest('button, a') !== null;
}

/** Global keyboard bindings for the map. `isActive` lets the world gate them by state. */
export function bindMapKeys(
  isActive: () => boolean,
  onCommand: (command: MapCommand) => void,
): ListenerBag {
  const bag = new ListenerBag();
  bag.on(window, 'keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const command = commandForKey(event.key);
    if (!command || !isActive() || isOwnedByControl(event.target, command)) return;
    event.preventDefault();
    onCommand(command);
  });
  return bag;
}

/** Pointer picking on the canvas: resolves the clicked object's top-level pickable id. */
export function bindPointerPick(
  canvas: HTMLCanvasElement,
  camera: Camera,
  pickables: () => readonly Object3D[],
  onPick: (id: string) => void,
): ListenerBag {
  const bag = new ListenerBag();
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  bag.on(canvas, 'click', (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects([...pickables()], true)[0];
    let node: Object3D | null = hit?.object ?? null;
    while (node && typeof node.userData.pickId !== 'string') node = node.parent;
    const id: unknown = node?.userData.pickId;
    if (typeof id === 'string') onPick(id);
  });
  return bag;
}
