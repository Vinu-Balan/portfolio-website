import { Vector3, type PerspectiveCamera } from 'three';
import { h } from '../ui/component';

export interface HotspotSpec {
  readonly id: string;
  readonly label: string;
  readonly ariaLabel: string;
  readonly className?: string;
  /** World position to follow; null hides the hotspot (e.g. tumbleweed off-stage). */
  readonly anchor: () => Vector3 | null;
  readonly onActivate: () => void;
}

export interface Hotspots {
  update(camera: PerspectiveCamera, width: number, height: number): void;
  setVisible(visible: boolean): void;
  setActive(id: string): void;
  dispose(): void;
}

const projected = new Vector3();

/**
 * Real DOM buttons pinned over 3D landmarks. They make canvas content keyboard- and
 * screen-reader-accessible and give touch users generous tap targets.
 */
export function createHotspots(root: HTMLElement, specs: readonly HotspotSpec[]): Hotspots {
  const buttons = specs.map((spec) => {
    const button = h(
      'button',
      {
        type: 'button',
        class: `hotspot ${spec.className ?? 'signpost'}`,
        'aria-label': spec.ariaLabel,
        'data-landmark': spec.id,
      },
      h('span', { class: 'hotspot-label' }, spec.label),
    );
    button.addEventListener('click', spec.onActivate);
    root.append(button);
    return button;
  });

  const place = (
    button: HTMLButtonElement,
    anchor: Vector3 | null,
    camera: PerspectiveCamera,
    width: number,
    height: number,
  ): void => {
    if (!anchor) {
      button.hidden = true;
      return;
    }
    projected.copy(anchor).project(camera);
    const behind = projected.z > 1;
    button.hidden = behind;
    if (behind) return;
    const x = (projected.x * 0.5 + 0.5) * width;
    const y = (-projected.y * 0.5 + 0.5) * height;
    button.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
  };

  return {
    update: (camera, width, height) => {
      specs.forEach((spec, i) => {
        const button = buttons[i];
        if (button) place(button, spec.anchor(), camera, width, height);
      });
    },
    setVisible: (visible) => {
      root.classList.toggle('is-visible', visible);
    },
    setActive: (id) => {
      buttons.forEach((b) => b.classList.toggle('is-active', b.dataset.landmark === id));
    },
    dispose: () => {
      buttons.forEach((b) => {
        b.remove();
      });
    },
  };
}
