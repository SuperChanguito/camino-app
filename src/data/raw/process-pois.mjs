import { readFileSync, writeFileSync } from 'fs'

const raw = JSON.parse(readFileSync(new URL('./overpass-raw.json', import.meta.url), 'utf-8'))
const stages = JSON.parse(
  readFileSync(new URL('../routes/tui-santiago-stages.json', import.meta.url), 'utf-8'),
)

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

function classify(tags) {
  if (tags.tourism === 'hostel') return 'albergue'
  if (tags.amenity === 'cafe' || tags.amenity === 'bar') return 'cafe'
  if (tags.amenity === 'place_of_worship') return 'church'
  if (tags.historic === 'wayside_cross' || tags.historic === 'monument' || tags.historic === 'memorial')
    return 'historic'
  if (tags.amenity === 'drinking_water') return 'water'
  if (tags.tourism === 'viewpoint') return 'viewpoint'
  return null
}

// Fallback display names for unnamed-but-still-worth-showing historic
// waymarkers (many Camino cruceiros/crosses have no OSM `name` tag).
function fallbackName(tags, type) {
  if (type === 'historic' && tags.historic === 'wayside_cross') return 'Cruceiro (wayside cross)'
  if (type === 'historic' && tags.historic === 'monument') return 'Monument'
  if (type === 'historic' && tags.historic === 'memorial') return 'Memorial'
  if (type === 'water') return 'Drinking fountain'
  if (type === 'viewpoint') return 'Viewpoint'
  return null
}

function nearestStageAndDistance(lon, lat) {
  let bestStage = null
  let bestDist = Infinity
  for (const stage of stages) {
    for (const [tLon, tLat] of stage.track) {
      const d = haversine([lon, lat], [tLon, tLat])
      if (d < bestDist) {
        bestDist = d
        bestStage = stage.id
      }
    }
  }
  return { stageId: bestStage, distKm: bestDist }
}

const MAX_DIST_FROM_TRACK_KM = 0.6

const candidates = []
const restaurantWineryPool = [] // lookup pool for the curated "recommended" pass, not auto-imported

for (const el of raw.elements) {
  const tags = el.tags || {}
  const lat = el.type === 'node' ? el.lat : el.center?.lat
  const lon = el.type === 'node' ? el.lon : el.center?.lon
  if (lat == null || lon == null) continue

  if (tags.amenity === 'restaurant' || tags.craft === 'winery' || tags.shop === 'wine') {
    if (!tags.name) continue
    const { stageId, distKm } = nearestStageAndDistance(lon, lat)
    if (distKm > MAX_DIST_FROM_TRACK_KM) continue
    restaurantWineryPool.push({
      osmId: `osm-${el.type}-${el.id}`,
      stageId,
      name: tags.name,
      kind: tags.craft === 'winery' ? 'winery' : tags.shop === 'wine' ? 'wine shop' : 'restaurant',
      lat,
      lon,
    })
    continue
  }

  const type = classify(tags)
  if (!type) continue
  const name = tags.name || fallbackName(tags, type)
  if (!name) continue // skip unnamed POIs with no sensible fallback label

  const { stageId, distKm } = nearestStageAndDistance(lon, lat)
  if (distKm > MAX_DIST_FROM_TRACK_KM) continue // too far from the trail to be relevant

  candidates.push({
    id: `osm-${el.type}-${el.id}`,
    stageId,
    type,
    name,
    lat,
    lon,
    notes: tags.opening_hours ? `Hours: ${tags.opening_hours}` : undefined,
  })
}

writeFileSync(
  new URL('./restaurant-winery-pool.json', import.meta.url),
  JSON.stringify(restaurantWineryPool, null, 2),
)
console.log(`Restaurant/winery lookup pool: ${restaurantWineryPool.length} candidates`)

// Dedupe POIs that are essentially the same place (e.g. a node + way for
// the same building) by collapsing anything within 40m of the same type.
const deduped = []
for (const c of candidates) {
  const dupe = deduped.find(
    (d) => d.type === c.type && haversine([c.lon, c.lat], [d.lon, d.lat]) < 0.04,
  )
  if (!dupe) deduped.push(c)
}

console.log(`Candidates: ${candidates.length}, deduped: ${deduped.length}`)

const counts = {}
for (const p of deduped) counts[p.type] = (counts[p.type] || 0) + 1
console.log('By type:', counts)

const byStage = {}
for (const p of deduped) byStage[p.stageId] = (byStage[p.stageId] || 0) + 1
console.log('By stage:', byStage)

writeFileSync(new URL('../routes/tui-santiago-pois.json', import.meta.url), JSON.stringify(deduped))
console.log('Wrote tui-santiago-pois.json')
