import { readFileSync, writeFileSync } from 'fs'

const gpx = readFileSync(new URL('./central-way-full.gpx', import.meta.url), 'utf-8')

const trkptRe = /<trkpt lat="([-\d.]+)" lon="([-\d.]+)">/g
const points = []
let m
while ((m = trkptRe.exec(gpx))) {
  points.push([parseFloat(m[2]), parseFloat(m[1])]) // [lon, lat]
}
console.log(`Parsed ${points.length} track points`)

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

// Approximate town-center coordinates [lon, lat]
const towns = {
  Tui: [-8.6448, 42.0486],
  'O Porriño': [-8.6402, 42.1355],
  Redondela: [-8.6089, 42.2836],
  Pontevedra: [-8.6444, 42.431],
  'Caldas de Reis': [-8.6425, 42.6023],
  Padrón: [-8.6605, 42.7434],
  Santiago: [-8.5445, 42.8806],
}

function nearestIndex(target) {
  let best = -1
  let bestDist = Infinity
  for (let i = 0; i < points.length; i++) {
    const d = haversine(points[i], target)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  }
  return { index: best, distKm: bestDist }
}

const results = {}
for (const [name, coord] of Object.entries(towns)) {
  results[name] = nearestIndex(coord)
  console.log(name, results[name], points[results[name].index])
}

writeFileSync(
  new URL('./town-indices.json', import.meta.url),
  JSON.stringify({ results, totalPoints: points.length }, null, 2),
)
