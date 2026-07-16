import { readFileSync } from 'fs'

const villages = JSON.parse(readFileSync(new URL('./village-coords.json', import.meta.url), 'utf-8'))
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

function nearestTrackDist(lon, lat) {
  let best = Infinity
  let bestStage = null
  for (const stage of stages) {
    for (const [tLon, tLat] of stage.track) {
      const d = haversine([lon, lat], [tLon, tLat])
      if (d < best) {
        best = d
        bestStage = stage.id
      }
    }
  }
  return { dist: best, stage: bestStage }
}

for (const [name, coord] of Object.entries(villages)) {
  const { dist, stage } = nearestTrackDist(coord.lon, coord.lat)
  console.log(`${name}: ${dist.toFixed(2)} km from nearest track point (${stage})`)
}
