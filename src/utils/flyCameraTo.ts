import gsap from 'gsap';
import type { Vector3 } from 'three';
import { CAMERA } from '../config';

/** Where the camera wants to be; the frame loop adds breathing on top. */
export interface CameraRig {
  readonly position: Vector3;
  readonly target: Vector3;
}

export interface FlyOptions {
  readonly duration?: number;
  readonly ease?: string;
  /** Skip the tween entirely (reduced motion, frozen test runs). */
  readonly instant?: boolean;
}

function tweenVector(vector: Vector3, to: Vector3, duration: number, ease: string): Promise<void> {
  return new Promise((resolve) => {
    gsap.to(vector, {
      x: to.x,
      y: to.y,
      z: to.z,
      duration,
      ease,
      overwrite: true,
      onComplete: resolve,
    });
  });
}

/** Glide the camera rig to a new viewpoint. Resolves when both position and target arrive. */
export async function flyCameraTo(
  rig: CameraRig,
  destination: { readonly position: Vector3; readonly target: Vector3 },
  options: FlyOptions = {},
): Promise<void> {
  if (options.instant) {
    gsap.killTweensOf([rig.position, rig.target]);
    rig.position.copy(destination.position);
    rig.target.copy(destination.target);
    return;
  }
  const duration = options.duration ?? CAMERA.flyDurationSec;
  const ease = options.ease ?? 'power2.inOut';
  await Promise.all([
    tweenVector(rig.position, destination.position, duration, ease),
    tweenVector(rig.target, destination.target, duration, ease),
  ]);
}
