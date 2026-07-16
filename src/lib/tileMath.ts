export interface TileCoord {
  z: number
  x: number
  y: number
}

export function lonLatToTile(lon: number, lat: number, z: number): TileCoord {
  const latRad = (lat * Math.PI) / 180
  const n = 2 ** z
  const x = Math.floor(((lon + 180) / 360) * n)
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n)
  return { z, x, y }
}

export interface BBox {
  minLon: number
  minLat: number
  maxLon: number
  maxLat: number
}

export function trackBBox(track: [number, number][], bufferDeg = 0.01): BBox {
  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity
  for (const [lon, lat] of track) {
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  return {
    minLon: minLon - bufferDeg,
    minLat: minLat - bufferDeg,
    maxLon: maxLon + bufferDeg,
    maxLat: maxLat + bufferDeg,
  }
}

/** All tiles covering `bbox` at each zoom level in `zooms`. */
export function tilesForBBox(bbox: BBox, zooms: number[]): TileCoord[] {
  const tiles: TileCoord[] = []
  for (const z of zooms) {
    const topLeft = lonLatToTile(bbox.minLon, bbox.maxLat, z)
    const bottomRight = lonLatToTile(bbox.maxLon, bbox.minLat, z)
    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        tiles.push({ z, x, y })
      }
    }
  }
  return tiles
}
