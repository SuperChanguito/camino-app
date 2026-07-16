import { readFileSync, writeFileSync } from 'fs'

const gpx = readFileSync(new URL('./central-way-full.gpx', import.meta.url), 'utf-8')

const trkptRe = /<trkpt lat="([-\d.]+)" lon="([-\d.]+)">/g
const points = []
let m
while ((m = trkptRe.exec(gpx))) {
  points.push([parseFloat(m[2]), parseFloat(m[1])]) // [lon, lat]
}

const EARTH_RADIUS_KM = 6371
function toRad(d) {
  return (d * Math.PI) / 180
}
function haversine([lon1, lat1], [lon2, lat2]) {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

function trackDistanceKm(track) {
  let d = 0
  for (let i = 1; i < track.length; i++) d += haversine(track[i - 1], track[i])
  return d
}

// Ramer-Douglas-Peucker simplification, tolerance in km (perpendicular distance approx via haversine to segment)
function perpDistKm(p, a, b) {
  // flat local projection, fine at this scale
  const latScale = Math.cos(toRad((a[1] + b[1]) / 2))
  const px = p[0] * latScale, py = p[1]
  const ax = a[0] * latScale, ay = a[1]
  const bx = b[0] * latScale, by = b[1]
  const abx = bx - ax, aby = by - ay
  const abLenSq = abx * abx + aby * aby
  let t = abLenSq === 0 ? 0 : ((px - ax) * abx + (py - ay) * aby) / abLenSq
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * abx, cy = ay + t * aby
  return haversine([cx / latScale, cy], p)
}

function rdp(pts, toleranceKm) {
  if (pts.length < 3) return pts
  let maxDist = 0
  let index = 0
  const [first, last] = [pts[0], pts[pts.length - 1]]
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDistKm(pts[i], first, last)
    if (d > maxDist) {
      maxDist = d
      index = i
    }
  }
  if (maxDist > toleranceKm) {
    const left = rdp(pts.slice(0, index + 1), toleranceKm)
    const right = rdp(pts.slice(index), toleranceKm)
    return left.slice(0, -1).concat(right)
  }
  return [first, last]
}

const townIndices = JSON.parse(
  readFileSync(new URL('./town-indices.json', import.meta.url), 'utf-8'),
).results

// Reference cumulative distances from Tui (km), per stingynomads.com's
// published stage breakdown, used to anchor stage boundaries along the
// track rather than trusting a town-center coordinate snap (which can
// land a few km off from where the guidebooks actually split the day).
const REFERENCE_CUMULATIVE_KM = {
  Tui: 0,
  'O Porriño': 15.5,
  Redondela: 31.5,
  Pontevedra: 52.1,
  'Caldas de Reis': 73.1,
  Padrón: 91.6,
  Santiago: 117.1,
}

const stageDefs = [
  { key: 'tui-oporrino', name: 'Tui to O Porriño', startTown: 'Tui', endTown: 'O Porriño' },
  { key: 'oporrino-redondela', name: 'O Porriño to Redondela', startTown: 'O Porriño', endTown: 'Redondela' },
  { key: 'redondela-pontevedra', name: 'Redondela to Pontevedra', startTown: 'Redondela', endTown: 'Pontevedra' },
  { key: 'pontevedra-caldas', name: 'Pontevedra to Caldas de Reis', startTown: 'Pontevedra', endTown: 'Caldas de Reis' },
  { key: 'caldas-padron', name: 'Caldas de Reis to Padrón', startTown: 'Caldas de Reis', endTown: 'Padrón' },
  { key: 'padron-santiago', name: 'Padrón to Santiago', startTown: 'Padrón', endTown: 'Santiago' },
]

// Build a cumulative-distance array from the Tui anchor point so we can
// look up the track index for any target km-from-Tui value.
const tuiIdx = townIndices.Tui.index
const santiagoIdx = townIndices.Santiago.index
const spine = points.slice(tuiIdx, santiagoIdx + 1)
const spineCumKm = [0]
for (let i = 1; i < spine.length; i++) {
  spineCumKm.push(spineCumKm[i - 1] + haversine(spine[i - 1], spine[i]))
}

function indexForCumKm(targetKm) {
  let best = 0
  let bestDiff = Infinity
  for (let i = 0; i < spineCumKm.length; i++) {
    const diff = Math.abs(spineCumKm[i] - targetKm)
    if (diff < bestDiff) {
      bestDiff = diff
      best = i
    }
  }
  return best // index into `spine`
}

const TOLERANCE_KM = 0.008 // ~8m simplification tolerance

const stages = stageDefs.map((def, i) => {
  const startIdx = indexForCumKm(REFERENCE_CUMULATIVE_KM[def.startTown])
  const endIdx = indexForCumKm(REFERENCE_CUMULATIVE_KM[def.endTown])
  const rawTrack = spine.slice(startIdx, endIdx + 1)
  const simplified = rdp(rawTrack, TOLERANCE_KM)
  const distanceKm = trackDistanceKm(rawTrack)
  return {
    id: def.key,
    routeId: 'camino-portugues-central-tui-santiago',
    order: i + 1,
    name: def.name,
    startTown: def.startTown,
    endTown: def.endTown,
    distanceKm: Math.round(distanceKm * 10) / 10,
    track: simplified,
  }
})

for (const s of stages) {
  console.log(`${s.name}: ${s.distanceKm} km, ${s.track.length} pts (from ${points.slice(0,1).length ? '' : ''}raw)`)
}

const totalKm = stages.reduce((sum, s) => sum + s.distanceKm, 0)
console.log('Total:', Math.round(totalKm * 10) / 10, 'km')

writeFileSync(
  new URL('../routes/tui-santiago-stages.json', import.meta.url),
  JSON.stringify(stages),
)

writeFileSync(
  new URL('../routes/tui-santiago-route.json', import.meta.url),
  JSON.stringify({
    id: 'camino-portugues-central-tui-santiago',
    name: 'Camino Portugués (Central) — Tui to Santiago',
    stageIds: stages.map((s) => s.id),
  }),
)

console.log('Wrote stage and route JSON.')
