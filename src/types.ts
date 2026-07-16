export interface LatLon {
  lat: number
  lon: number
}

export interface Stage {
  id: string
  routeId: string
  order: number
  name: string
  startTown: string
  endTown: string
  distanceKm: number
  /** Trail track as [lon, lat] pairs, ordered start to end. */
  track: [number, number][]
}

export interface Route {
  id: string
  name: string
  stageIds: string[]
}

export type PoiType =
  | 'albergue'
  | 'cafe'
  | 'church'
  | 'historic'
  | 'water'
  | 'viewpoint'
  | 'recommended'
  | 'other'

export interface Poi {
  id: string
  stageId: string
  type: PoiType
  name: string
  lat: number
  lon: number
  notes?: string
}

/**
 * A recommendation without a verified exact location — shown in its own
 * list rather than pinned on the map, so an approximate/wrong guess never
 * sends someone walking to a spot where the place isn't actually located.
 */
export interface NearbyPlace {
  id: string
  stageId: string
  name: string
  /** Town/village it's near, for context (not a precise address). */
  area: string
  description: string
  /** Filename under /nearby-photos/, or null to show a generic icon. */
  photo: string | null
}

/** User edits to a bundled stage's display fields, keyed by stageId. The
 * trail track itself is never overridden — only labels/metadata. */
export interface StageOverride {
  stageId: string
  startTown?: string
  endTown?: string
  distanceKm?: number
  skipped?: boolean
}

/** User edits to a bundled POI, or a tombstone marking it deleted. */
export interface PoiEdit {
  poiId: string
  name?: string
  type?: PoiType
  lat?: number
  lon?: number
  notes?: string
  deleted?: boolean
}

export interface Progress {
  /** Distance walked along the stage track, in km. */
  kmWalked: number
  /** Remaining distance to the stage end, in km. */
  kmRemaining: number
  /** Total stage distance, in km. */
  kmTotal: number
  /** Perpendicular distance from the current GPS fix to the track, in km. */
  distanceOffTrackKm: number
}
