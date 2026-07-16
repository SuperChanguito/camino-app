import { readFileSync, writeFileSync } from 'fs'

const poisPath = new URL('../routes/tui-santiago-pois.json', import.meta.url)
const pois = JSON.parse(readFileSync(poisPath, 'utf-8'))

// IDs of curated recommendations that only had approximate (village/town
// center, not verified exact) coordinates — moved out of the map entirely
// per user request: an approximate pin risks sending someone to a spot
// where the place isn't actually located.
const APPROX_IDS = new Set([
  'curated-bar-o-novo',
  'curated-meson-las-bodegas',
  'curated-casa-veiga',
  'curated-a-tia-justa',
  'curated-marisqueria-o-recreo',
  'curated-casa-valentin',
  'curated-o-muino',
  'curated-casa-chaves',
  'curated-o-tangueiro',
  'curated-a-moa',
])

const keptPois = pois.filter((p) => !APPROX_IDS.has(p.id))
writeFileSync(poisPath, JSON.stringify(keptPois))
console.log(`Removed ${pois.length - keptPois.length} approximate-location POIs from the map. Remaining: ${keptPois.length}`)

// One-sentence descriptions + photo (when a verified real one was found) for
// the "More places" list — informational only, never pinned on the map.
const nearbyPlaces = [
  {
    id: 'nearby-bar-o-novo',
    stageId: 'tui-oporrino',
    name: 'Bar O Novo',
    area: 'Tui',
    description: 'A popular pilgrim breakfast stop in Tui serving toasts, homemade pastries, and traditional Galician coffee.',
    photo: null,
  },
  {
    id: 'nearby-meson-las-bodegas',
    stageId: 'tui-oporrino',
    name: 'Mesón Las Bodegas',
    area: 'O Porriño',
    description: 'Traditional Galician fare in O Porriño — octopus, empanada, and grilled meats.',
    photo: null,
  },
  {
    id: 'nearby-casa-veiga',
    stageId: 'oporrino-redondela',
    name: 'Casa Veiga',
    area: 'Mos',
    description: "Family-run bar in Mos with a pilgrim's menu of Galician stew and pork shoulder.",
    photo: 'casa-veiga.jpg',
  },
  {
    id: 'nearby-a-tia-justa',
    stageId: 'oporrino-redondela',
    name: 'A Tía Justa',
    area: 'Redondela',
    description: 'Traditional Galician dishes on a relaxed terrace in Redondela.',
    photo: null,
  },
  {
    id: 'nearby-o-recreo',
    stageId: 'redondela-pontevedra',
    name: 'Marisquería O Recreo',
    area: 'Arcade',
    description: 'Seafood restaurant in Arcade famous for oysters, clams, and lobster rice.',
    photo: 'o-recreo-arcade.jpg',
  },
  {
    id: 'nearby-casa-valentin',
    stageId: 'pontevedra-caldas',
    name: 'Casa Valentín',
    area: 'Portas',
    description: 'Classic tavern in Portas with wood-fired cooking and garden vegetables.',
    photo: null,
  },
  {
    id: 'nearby-o-muino',
    stageId: 'pontevedra-caldas',
    name: 'O Muiño',
    area: 'Caldas de Reis',
    description: 'Charming riverside restaurant in Caldas de Reis serving fresh fish and Galician meats.',
    photo: 'o-muino.jpg',
  },
  {
    id: 'nearby-casa-chaves',
    stageId: 'caldas-padron',
    name: 'Casa Chaves',
    area: 'Valga / Pontecesures',
    description: 'Family-run spot near Valga, famous among pilgrims for generous portions and homemade desserts.',
    photo: null,
  },
  {
    id: 'nearby-o-tangueiro',
    stageId: 'padron-santiago',
    name: 'Mesón O Tangueiro',
    area: 'Milladoiro',
    description: 'Traditional tavern in Milladoiro serving seasonal tapas, omelets, and empanadas.',
    photo: 'o-tangueiro.jpg',
  },
  {
    id: 'nearby-a-moa',
    stageId: 'padron-santiago',
    name: 'A Moa',
    area: 'Santiago',
    description: 'Contemporary Galician restaurant in Santiago — a popular spot to celebrate arrival.',
    photo: 'a-moa.jpg',
  },
]

writeFileSync(
  new URL('../routes/tui-santiago-nearby-places.json', import.meta.url),
  JSON.stringify(nearbyPlaces),
)
console.log(`Wrote ${nearbyPlaces.length} nearby places (${nearbyPlaces.filter((p) => p.photo).length} with photos).`)
