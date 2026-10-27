import type { Material, Object3D, Texture } from 'three';

function isTexture(value: unknown): value is Texture {
  return typeof value === 'object' && value !== null && 'isTexture' in value;
}

function disposeMaterial(material: Material): void {
  for (const value of Object.values(material)) {
    if (isTexture(value)) value.dispose();
  }
  material.dispose();
}

interface Disposable3D {
  geometry?: { dispose: () => void };
  material?: Material | Material[];
}

/** Recursively free GPU resources owned by an object tree, then detach it. */
export function disposeObject3D(root: Object3D): void {
  root.traverse((child) => {
    const node = child as Object3D & Disposable3D;
    node.geometry?.dispose();
    const { material } = node;
    if (Array.isArray(material)) material.forEach(disposeMaterial);
    else if (material) disposeMaterial(material);
  });
  root.removeFromParent();
}
