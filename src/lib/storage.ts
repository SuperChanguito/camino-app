import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { PoiEdit, Poi, StageOverride } from '../types'

interface CaminoDB extends DBSchema {
  tiles: {
    key: string // `${z}/${x}/${y}`
    value: { key: string; blob: Blob }
  }
  settings: {
    key: string
    value: unknown
  }
  stageOverrides: {
    key: string // stageId
    value: StageOverride
  }
  customPois: {
    key: string // poi id
    value: Poi
    indexes: { stageId: string }
  }
  poiEdits: {
    key: string // poiId (of a bundled POI)
    value: PoiEdit
  }
}

let dbPromise: Promise<IDBPDatabase<CaminoDB>> | null = null

function getDb(): Promise<IDBPDatabase<CaminoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CaminoDB>('camino-companion', 1, {
      upgrade(db) {
        db.createObjectStore('tiles', { keyPath: 'key' })
        db.createObjectStore('settings')
        db.createObjectStore('stageOverrides', { keyPath: 'stageId' })

        const customPois = db.createObjectStore('customPois', { keyPath: 'id' })
        customPois.createIndex('stageId', 'stageId')

        db.createObjectStore('poiEdits', { keyPath: 'poiId' })
      },
    })
  }
  return dbPromise
}

export function tileKey(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}`
}

export async function saveTile(z: number, x: number, y: number, blob: Blob): Promise<void> {
  const db = await getDb()
  await db.put('tiles', { key: tileKey(z, x, y), blob })
}

export async function getTile(z: number, x: number, y: number): Promise<Blob | undefined> {
  const db = await getDb()
  const record = await db.get('tiles', tileKey(z, x, y))
  return record?.blob
}

export async function hasTile(z: number, x: number, y: number): Promise<boolean> {
  const db = await getDb()
  return (await db.getKey('tiles', tileKey(z, x, y))) !== undefined
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDb()
  return db.get('settings', key) as Promise<T | undefined>
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDb()
  await db.put('settings', value, key)
}

export async function getAllStageOverrides(): Promise<StageOverride[]> {
  const db = await getDb()
  return db.getAll('stageOverrides')
}

export async function setStageOverride(override: StageOverride): Promise<void> {
  const db = await getDb()
  await db.put('stageOverrides', override)
}

export async function clearStageOverride(stageId: string): Promise<void> {
  const db = await getDb()
  await db.delete('stageOverrides', stageId)
}

export async function getCustomPoisForStage(stageId: string): Promise<Poi[]> {
  const db = await getDb()
  return db.getAllFromIndex('customPois', 'stageId', stageId)
}

export async function saveCustomPoi(poi: Poi): Promise<void> {
  const db = await getDb()
  await db.put('customPois', poi)
}

export async function deleteCustomPoi(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('customPois', id)
}

export async function getAllPoiEdits(): Promise<PoiEdit[]> {
  const db = await getDb()
  return db.getAll('poiEdits')
}

export async function setPoiEdit(edit: PoiEdit): Promise<void> {
  const db = await getDb()
  await db.put('poiEdits', edit)
}

export async function clearPoiEdit(poiId: string): Promise<void> {
  const db = await getDb()
  await db.delete('poiEdits', poiId)
}
