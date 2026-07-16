import { writeFileSync } from 'fs'

const villages = [
  'Mos, Pontevedra, Spain',
  'Arcade, Pontevedra, Spain',
  'Soutomaior, Pontevedra, Spain',
  'Campo Lameiro, Pontevedra, Spain',
  'Portas, Pontevedra, Spain',
  'Valga, Pontevedra, Spain',
  'Infesta, Padrón, Spain',
  'Teo, A Coruña, Spain',
  'Milladoiro, Ames, Spain',
]

const results = {}
for (const q of villages) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'camino-companion-app-data-build/1.0' } })
  const data = await res.json()
  if (data[0]) {
    results[q] = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    console.log(q, '=>', results[q])
  } else {
    console.log(q, '=> NOT FOUND')
  }
  await new Promise((r) => setTimeout(r, 1100)) // Nominatim rate limit: 1 req/sec
}

writeFileSync(new URL('./village-coords.json', import.meta.url), JSON.stringify(results, null, 2))
