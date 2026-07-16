import {
  clearStageOverride,
  deleteCustomPoi,
  getAllPoiEdits,
  getAllStageOverrides,
  getCustomPoisForStage,
  getSetting,
  saveCustomPoi,
  setPoiEdit,
  setSetting,
  setStageOverride,
  clearPoiEdit,
} from '../lib/storage'
import type { NearbyPlace, Poi, PoiEdit, Route, Stage, StageOverride } from '../types'
import routeJson from './routes/tui-santiago-route.json'
import stagesJson from './routes/tui-santiago-stages.json'
import poisJson from './routes/tui-santiago-pois.json'
import nearbyPlacesJson from './routes/tui-santiago-nearby-places.json'

const bundledRoutes: Route[] = [routeJson as Route]
const bundledStages: Stage[] = stagesJson as Stage[]
const bundledPois: Poi[] = poisJson as Poi[]
const bundledNearbyPlaces: NearbyPlace[] = nearbyPlacesJson as NearbyPlace[]

export const routes = bundledRoutes
export const stages = bundledStages
export const pois = bundledPois

export function getNearbyPlacesForStage(stageId: string): NearbyPlace[] {
  return bundledNearbyPlaces.filter((p) => p.stageId === stageId)
}

export function getStage(stageId: string): Stage | undefined {
  return bundledStages.find((s) => s.id === stageId)
}

export function getRoute(routeId: string): Route | undefined {
  return bundledRoutes.find((r) => r.id === routeId)
}

const STAGE_ORDER_KEY = 'stageOrder'

/** A bundled Stage plus user overrides, always carrying a `skipped` flag. */
export type EffectiveStage = Stage & { skipped: boolean }

export async function getEffectiveStages(routeId: string): Promise<EffectiveStage[]> {
  const route = getRoute(routeId)
  if (!route) return []

  const customOrder = await getSetting<string[]>(STAGE_ORDER_KEY)
  const orderedIds = customOrder && customOrder.length === route.stageIds.length ? customOrder : route.stageIds

  const overrides = await getAllStageOverrides()
  const overrideByStageId = new Map(overrides.map((o) => [o.stageId, o]))

  return orderedIds
    .map((id) => getStage(id))
    .filter((s): s is Stage => !!s)
    .map((stage) => applyStageOverride(stage, overrideByStageId.get(stage.id)))
}

function applyStageOverride(stage: Stage, override: StageOverride | undefined): EffectiveStage {
  if (!override) return { ...stage, skipped: false }
  return {
    ...stage,
    startTown: override.startTown ?? stage.startTown,
    endTown: override.endTown ?? stage.endTown,
    distanceKm: override.distanceKm ?? stage.distanceKm,
    skipped: override.skipped ?? false,
  }
}

export async function setStageOrder(orderedStageIds: string[]): Promise<void> {
  await setSetting(STAGE_ORDER_KEY, orderedStageIds)
}

export async function updateStageOverride(
  stageId: string,
  partial: Omit<StageOverride, 'stageId'>,
): Promise<void> {
  const existing = (await getAllStageOverrides()).find((o) => o.stageId === stageId)
  await setStageOverride({ ...existing, ...partial, stageId })
}

export async function resetStageOverride(stageId: string): Promise<void> {
  await clearStageOverride(stageId)
}

export async function setStageSkipped(stageId: string, skipped: boolean): Promise<void> {
  await updateStageOverride(stageId, { skipped })
}

export async function getEffectivePoisForStage(stageId: string): Promise<Poi[]> {
  const [edits, custom] = await Promise.all([getAllPoiEdits(), getCustomPoisForStage(stageId)])
  const editByPoiId = new Map(edits.map((e) => [e.poiId, e]))

  const bundledForStage = bundledPois
    .filter((p) => p.stageId === stageId)
    .map((p) => applyPoiEdit(p, editByPoiId.get(p.id)))
    .filter((p): p is Poi => p !== null)

  return [...custom, ...bundledForStage]
}

function applyPoiEdit(poi: Poi, edit: PoiEdit | undefined): Poi | null {
  if (!edit) return poi
  if (edit.deleted) return null
  return {
    ...poi,
    name: edit.name ?? poi.name,
    type: edit.type ?? poi.type,
    lat: edit.lat ?? poi.lat,
    lon: edit.lon ?? poi.lon,
    notes: edit.notes ?? poi.notes,
  }
}

const CUSTOM_POI_PREFIX = 'custom-'

export function isCustomPoi(poiId: string): boolean {
  return poiId.startsWith(CUSTOM_POI_PREFIX)
}

export async function addCustomPoi(poi: Omit<Poi, 'id'>): Promise<void> {
  await saveCustomPoi({ ...poi, id: `${CUSTOM_POI_PREFIX}${crypto.randomUUID()}` })
}

export async function updatePoi(poi: Poi): Promise<void> {
  if (isCustomPoi(poi.id)) {
    await saveCustomPoi(poi)
  } else {
    await setPoiEdit({
      poiId: poi.id,
      name: poi.name,
      type: poi.type,
      lat: poi.lat,
      lon: poi.lon,
      notes: poi.notes,
    })
  }
}

export async function deletePoi(poiId: string): Promise<void> {
  if (isCustomPoi(poiId)) {
    await deleteCustomPoi(poiId)
  } else {
    await setPoiEdit({ poiId, deleted: true })
  }
}

export async function restoreDeletedPoi(poiId: string): Promise<void> {
  await clearPoiEdit(poiId)
}
