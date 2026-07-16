import { readFileSync, writeFileSync } from 'fs'

const poisPath = new URL('../routes/tui-santiago-pois.json', import.meta.url)
const pois = JSON.parse(readFileSync(poisPath, 'utf-8'))

// Sourced from a stage-by-stage pilgrim food guide (caminodesantiagoreservas.com)
// plus a couple of well-known Pontevedra spots turned up in general search.
// Coordinates are either matched to the actual OSM listing (exact), geocoded
// via Nominatim and checked against the trail (village center, ~0.2-1.3km
// off), or anchored to the stage's town-boundary point (town center approx)
// when no better source was available — never guessed freehand.
const curated = [
  {
    id: 'curated-bar-o-novo',
    stageId: 'tui-oporrino',
    type: 'recommended',
    name: 'Bar O Novo',
    lat: 42.047298,
    lon: -8.64368,
    notes: 'Popular pilgrim breakfast stop in Tui: toasts, homemade pastries, Galician coffee. (Approximate location — Tui town center.)',
  },
  {
    id: 'curated-meson-las-bodegas',
    stageId: 'tui-oporrino',
    type: 'recommended',
    name: 'Mesón Las Bodegas',
    lat: 42.150928,
    lon: -8.623113,
    notes: 'Traditional Galician fare: octopus, empanada, grilled meats. (Approximate location — O Porriño town center.)',
  },
  {
    id: 'curated-casa-veiga',
    stageId: 'oporrino-redondela',
    type: 'recommended',
    name: 'Casa Veiga',
    lat: 42.1879926,
    lon: -8.6262198,
    notes: "Family-run, in Mos. Pilgrim's menu: stew and pork shoulder.",
  },
  {
    id: 'curated-a-tia-justa',
    stageId: 'oporrino-redondela',
    type: 'recommended',
    name: 'A Tía Justa',
    lat: 42.273133,
    lon: -8.61034,
    notes: 'Traditional Galician dishes, terrace, relaxed atmosphere. (Approximate location — Redondela town center.)',
  },
  {
    id: 'curated-marisqueria-o-recreo',
    stageId: 'redondela-pontevedra',
    type: 'recommended',
    name: 'Marisquería O Recreo',
    lat: 42.3404236,
    lon: -8.6104737,
    notes: 'In Arcade. Famous for oysters, clams, and lobster rice.',
  },
  {
    id: 'curated-casa-fidel',
    stageId: 'redondela-pontevedra',
    type: 'recommended',
    name: 'Casa Fidel O Pulpeiro',
    lat: 42.4337624,
    lon: -8.6457529,
    notes: 'Contemporary Galician cuisine in Pontevedra\'s historic center.',
  },
  {
    id: 'curated-la-estafeta',
    stageId: 'redondela-pontevedra',
    type: 'recommended',
    name: 'La Estafeta Taperia',
    lat: 42.4340437,
    lon: -8.6450228,
    notes: 'Right on the Camino near the Ponte do Burgo bridge into Pontevedra.',
  },
  {
    id: 'curated-casa-valentin',
    stageId: 'pontevedra-caldas',
    type: 'recommended',
    name: 'Casa Valentín',
    lat: 42.5639366,
    lon: -8.6570848,
    notes: 'Classic tavern in Portas: wood-fired cooking, garden vegetables.',
  },
  {
    id: 'curated-o-muino',
    stageId: 'pontevedra-caldas',
    type: 'recommended',
    name: 'O Muiño',
    lat: 42.596179,
    lon: -8.643639,
    notes: 'Charming riverside restaurant, fresh fish and Galician meats. (Approximate location — Caldas de Reis town center.)',
  },
  {
    id: 'curated-casa-chaves',
    stageId: 'caldas-padron',
    type: 'recommended',
    name: 'Casa Chaves',
    lat: 42.6892659,
    lon: -8.6481157,
    notes: 'In Valga. Famous among pilgrims for generous portions and homemade desserts.',
  },
  {
    id: 'curated-pulperia-rial',
    stageId: 'padron-santiago',
    type: 'recommended',
    name: 'Pulpería Rial',
    lat: 42.7375644,
    lon: -8.6611453,
    notes: 'In Padrón. Traditional Galician octopus with corn bread and wine.',
  },
  {
    id: 'curated-o-tangueiro',
    stageId: 'padron-santiago',
    type: 'recommended',
    name: 'Mesón O Tangueiro',
    lat: 42.8449509,
    lon: -8.5782157,
    notes: 'In Milladoiro. Seasonal tapas, omelets, and empanadas.',
  },
  {
    id: 'curated-a-moa',
    stageId: 'padron-santiago',
    type: 'recommended',
    name: 'A Moa',
    lat: 42.876036,
    lon: -8.549048,
    notes: 'Contemporary Galician dishes — a popular spot to celebrate arrival in Santiago. (Approximate location — city center.)',
  },
]

const merged = [...pois, ...curated]
writeFileSync(poisPath, JSON.stringify(merged))
console.log(`Added ${curated.length} curated recommendations. Total POIs: ${merged.length}`)
