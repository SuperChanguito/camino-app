import type { LatLon, Progress } from '../types'

const EARTH_RADIUS_KM = 6371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance between two points, in km. */
export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Projects `point` onto the closest segment of `track` (an array of
 * [lon, lat] pairs) and returns the walked/remaining distance along the
 * track plus how far off-track the point is.
 *
 * Uses local equirectangular projection for the segment math (fine at
 * walking-trail scale) and haversine for the reported distances.
 */
export function projectOntoTrack(point: LatLon, track: [number, number][]): Progress {
  if (track.length < 2) {
    return { kmWalked: 0, kmRemaining: 0, kmTotal: 0, distanceOffTrackKm: 0 }
  }

  const trackLatLon: LatLon[] = track.map(([lon, lat]) => ({ lat, lon }))

  const cumulative: number[] = [0]
  for (let i = 1; i < trackLatLon.length; i++) {
    cumulative.push(cumulative[i - 1] + haversineKm(trackLatLon[i - 1], trackLatLon[i]))
  }
  const kmTotal = cumulative[cumulative.length - 1]

  let bestDistKm = Infinity
  let bestWalkedKm = 0

  for (let i = 0; i < trackLatLon.length - 1; i++) {
    const segStart = trackLatLon[i]
    const segEnd = trackLatLon[i + 1]
    const { closest, fraction } = closestPointOnSegment(point, segStart, segEnd)
    const distKm = haversineKm(point, closest)

    if (distKm < bestDistKm) {
      bestDistKm = distKm
      const segLenKm = cumulative[i + 1] - cumulative[i]
      bestWalkedKm = cumulative[i] + fraction * segLenKm
    }
  }

  return {
    kmWalked: bestWalkedKm,
    kmRemaining: Math.max(0, kmTotal - bestWalkedKm),
    kmTotal,
    distanceOffTrackKm: bestDistKm,
  }
}

/**
 * Approximates the closest point on segment [a, b] to `point` using a flat
 * local projection (degrees scaled by latitude), then returns that point
 * back in lat/lon plus how far along the segment it falls (0..1).
 */
function closestPointOnSegment(
  point: LatLon,
  a: LatLon,
  b: LatLon,
): { closest: LatLon; fraction: number } {
  const latScale = Math.cos(toRad((a.lat + b.lat) / 2))

  const px = point.lon * latScale
  const py = point.lat
  const ax = a.lon * latScale
  const ay = a.lat
  const bx = b.lon * latScale
  const by = b.lat

  const abx = bx - ax
  const aby = by - ay
  const abLenSq = abx * abx + aby * aby

  let t = abLenSq === 0 ? 0 : ((px - ax) * abx + (py - ay) * aby) / abLenSq
  t = Math.max(0, Math.min(1, t))

  const closestX = ax + t * abx
  const closestY = ay + t * aby

  return {
    closest: { lon: closestX / latScale, lat: closestY },
    fraction: t,
  }
}
