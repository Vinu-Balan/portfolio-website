/** Minimal hyperscript helper: typed element creation without a framework. */
export type Child = Node | string | null | undefined | false;

export type Attrs = Record<string, string | number | boolean | undefined>;

function applyAttr(el: HTMLElement | SVGElement, key: string, value: Attrs[string]): void {
  if (value === undefined || value === false) return;
  if (value === true) el.setAttribute(key, '');
  else el.setAttribute(key, String(value));
}

function appendChildren(el: Element, children: readonly Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child);
  }
}

/** Create an HTML element with attributes and children. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) applyAttr(el, key, value);
  appendChildren(el, children);
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Create an SVG element (namespaced) with attributes and children. */
export function svg(tag: string, attrs: Attrs = {}, ...children: Child[]): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) applyAttr(el, key, value);
  appendChildren(el, children);
  return el;
}

/** Query that throws a clear error instead of returning null; for elements index.html guarantees. */
export function requireElement(selector: string, root: ParentNode = document): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Missing required element: ${selector}`);
  return el;
}

/** Track listeners so components can remove all of them on teardown. */
export class ListenerBag {
  private readonly removers: (() => void)[] = [];

  on<K extends keyof HTMLElementEventMap>(
    target: HTMLElement | Window | Document,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void {
    const listener = handler as EventListener;
    target.addEventListener(type, listener, options);
    this.removers.push(() => {
      target.removeEventListener(type, listener, options);
    });
  }

  dispose(): void {
    this.removers.splice(0).forEach((remove) => {
      remove();
    });
  }
}

/** Resolve a public asset path against Vite's base so GitHub Pages sub-paths work. */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
