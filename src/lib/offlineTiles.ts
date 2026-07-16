import maplibregl from 'maplibre-gl'
import type { Stage } from '../types'
import { getTile, hasTile, saveTile } from './storage'
import { tilesForBBox, trackBBox } from './tileMath'

// Swap in a MapTiler (or similar) key via env var once you have one; falls
// back to the public OpenStreetMap raster tiles, which is fine for
// development/light use but not for heavy or commercial traffic.
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined

export const TILE_URL_TEMPLATE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

export const DOWNLOAD_ZOOM_LEVELS = [13, 14, 15, 16]

// Zoom range the map itself is allowed to request live (a couple levels
// beyond the pre-downloaded set, for when a connection happens to be up).
export const MAP_MIN_ZOOM = 12
export const MAP_MAX_ZOOM = 17

const PROTOCOL = 'offline'

function tileUrl(z: number, x: number, y: number): string {
  return TILE_URL_TEMPLATE.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y))
}

let protocolRegistered = false

/** Routes MapLibre tile requests through IndexedDB first, network second. */
export function registerOfflineProtocol(): void {
  if (protocolRegistered) return
  protocolRegistered = true

  maplibregl.addProtocol(PROTOCOL, async (params, abortController) => {
    const match = params.url.match(new RegExp(`^${PROTOCOL}://(\\d+)/(\\d+)/(\\d+)`))
    if (!match) throw new Error(`Malformed offline tile URL: ${params.url}`)
    const [, zStr, xStr, yStr] = match
    const z = Number(zStr)
    const x = Number(xStr)
    const y = Number(yStr)

    const cached = await getTile(z, x, y)
    if (cached) {
      return { data: await cached.arrayBuffer() }
    }

    const response = await fetch(tileUrl(z, x, y), { signal: abortController.signal })
    if (!response.ok) throw new Error(`Tile fetch failed: ${response.status}`)
    const blob = await response.blob()
    void saveTile(z, x, y, blob) // opportunistic cache-as-you-go
    return { data: await blob.arrayBuffer() }
  })
}

export function offlineTileSourceUrl(): string {
  return `${PROTOCOL}://{z}/{x}/{y}`
}

export interface DownloadProgress {
  downloaded: number
  total: number
}

export async function downloadStageTiles(
  stage: Stage,
  onProgress: (progress: DownloadProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  const bbox = trackBBox(stage.track)
  const tiles = tilesForBBox(bbox, DOWNLOAD_ZOOM_LEVELS)

  let downloaded = 0
  onProgress({ downloaded, total: tiles.length })

  const CONCURRENCY = 6
  let cursor = 0

  async function worker() {
    while (cursor < tiles.length) {
      if (signal?.aborted) return
      const tile = tiles[cursor++]
      if (await hasTile(tile.z, tile.x, tile.y)) {
        downloaded++
        onProgress({ downloaded, total: tiles.length })
        continue
      }
      try {
        const response = await fetch(tileUrl(tile.z, tile.x, tile.y), { signal })
        if (response.ok) {
          const blob = await response.blob()
          await saveTile(tile.z, tile.x, tile.y, blob)
        }
      } catch {
        // Skip failed tiles; the map will fall back to a network fetch
        // (or a blank tile) for that square when it's actually viewed.
      }
      downloaded++
      onProgress({ downloaded, total: tiles.length })
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
}

export async function countCachedTilesForStage(stage: Stage): Promise<{ cached: number; total: number }> {
  const bbox = trackBBox(stage.track)
  const tiles = tilesForBBox(bbox, DOWNLOAD_ZOOM_LEVELS)
  let cached = 0
  for (const tile of tiles) {
    if (await hasTile(tile.z, tile.x, tile.y)) cached++
  }
  return { cached, total: tiles.length }
}
