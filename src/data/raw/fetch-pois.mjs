import { readFileSync, writeFileSync } from 'fs'

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

// Resample each stage track to ~500m spacing to keep the Overpass "around"
// point list small while still covering the whole corridor.
function resample(track, spacingKm) {
  const out = [track[0]]
  let lastKept = track[0]
  for (let i = 1; i < track.length; i++) {
    if (haversine(lastKept, track[i]) >= spacingKm) {
      out.push(track[i])
      lastKept = track[i]
    }
  }
  out.push(track[track.length - 1])
  return out
}

const samplePoints = [] // [lat, lon]
for (const stage of stages) {
  for (const [lon, lat] of resample(stage.track, 0.5)) {
    samplePoints.push([lat, lon])
  }
}
console.log(`Sample points for Overpass "around": ${samplePoints.length}`)

const aroundList = samplePoints.map(([lat, lon]) => `${lat.toFixed(6)},${lon.toFixed(6)}`).join(',')

const query = `
[out:json][timeout:120];
(
  node["tourism"="hostel"](around:400,${aroundList});
  way["tourism"="hostel"](around:400,${aroundList});
  node["amenity"="cafe"](around:300,${aroundList});
  node["amenity"="bar"](around:250,${aroundList});
  node["amenity"="place_of_worship"](around:300,${aroundList});
  way["amenity"="place_of_worship"](around:300,${aroundList});
  node["historic"="wayside_cross"](around:250,${aroundList});
  way["historic"="wayside_cross"](around:250,${aroundList});
  node["historic"="monument"](around:300,${aroundList});
  node["historic"="memorial"](around:250,${aroundList});
  node["amenity"="drinking_water"](around:250,${aroundList});
  node["tourism"="viewpoint"](around:300,${aroundList});
  node["amenity"="restaurant"](around:400,${aroundList});
  node["craft"="winery"](around:500,${aroundList});
  node["shop"="wine"](around:500,${aroundList});
);
out center tags;
`

writeFileSync(new URL('./overpass-query.txt', import.meta.url), query)
console.log('Wrote overpass-query.txt, length:', query.length)

const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: '*/*',
    'User-Agent': 'camino-companion-app-data-build/1.0',
  },
  body: 'data=' + encodeURIComponent(query),
})

if (!res.ok) {
  console.error('Overpass request failed:', res.status, await res.text())
  process.exit(1)
}

const data = await res.json()
console.log(`Overpass returned ${data.elements.length} elements`)
writeFileSync(new URL('./overpass-raw.json', import.meta.url), JSON.stringify(data))
