import type { Group, Object3D, Vector3 } from 'three';
import type { Portfolio } from '../content/portfolio';
import type { HeightFn } from '../scene/terrain';
import type { PanelId } from '../ui/panels';
import type { Random } from '../utils/random';

export type LandmarkId = 'camp' | 'sheriff' | 'workshop' | 'station' | 'telegraph';

/** Inputs every landmark builder receives. */
export interface LandmarkContext {
  readonly heightAt: HeightFn;
  readonly random: Random;
  readonly content: Portfolio;
}

/** What a landmark module builds, in local space with its front facing +Z. */
export interface LandmarkBuild {
  readonly group: Group;
  /** Height above the base where the floating signpost hotspot sits. */
  readonly signHeight: number;
  /** Footprint radius kept clear of grass, rocks and cacti. */
  readonly clearance: number;
  /** Named child objects other systems attach to (e.g. "fire" for embers). */
  readonly attachments?: Readonly<Record<string, Object3D>>;
  readonly update?: (elapsed: number) => void;
}

/** Static description of a landmark: identity, placement and its builder. */
export interface LandmarkSpec {
  readonly id: LandmarkId;
  readonly label: string;
  readonly section: string;
  readonly panel: PanelId;
  /** Position on the landmark ring, in degrees; 90° faces the title camera. */
  readonly angleDeg: number;
  readonly build: (context: LandmarkContext) => LandmarkBuild;
}

/** A placed, live landmark in the world. */
export interface Landmark {
  readonly id: LandmarkId;
  readonly label: string;
  readonly section: string;
  readonly panel: PanelId;
  readonly group: Group;
  readonly anchor: Vector3;
  readonly clearance: number;
  readonly view: { readonly position: Vector3; readonly target: Vector3 };
  /** Ground point in front of the landmark (valley side) where the rider stops. */
  readonly riderSpot: Vector3;
  readonly attachments: Readonly<Record<string, Object3D>>;
  readonly update: (elapsed: number) => void;
}
