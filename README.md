# Camino Companion

A PWA for walking the Camino Portugués (Central route, Tui → Santiago). Built
for a non-technical user on an iPhone, with spotty trail connectivity in mind.

## What's here

- **Pick today's stage** — 6 days, Tui to Santiago, distances sourced from
  published guides (`src/data/routes/`).
- **Live map** — MapLibre GL, GPS position, walked/remaining distance
  projected onto the real trail track.
- **POIs** — albergues, cafés, churches along each stage, sourced from
  OpenStreetMap.
- **Offline** — the app shell and route/POI data work with zero network via
  the service worker + IndexedDB. Map tiles need an explicit
  "Save map for offline" tap per stage *while still on WiFi* — iOS Safari
  evicts the browser's tile cache aggressively, so tiles are stored in
  IndexedDB instead, which is much more durable.
- **Advanced mode** (gear icon, bottom of the day-picker) — reorder or skip
  days, edit a day's towns/distance, and add/edit/delete POIs by tapping the
  map. Meant to be used sitting with the device in hand, not remotely — there's
  no sync between devices, edits only affect the device they're made on. The
  underlying trail track never changes, only the labels/numbers shown and the
  POI list.
- **"More" tab** — pilgrim-recommended restaurants/bars that only have an
  approximate (village/town-level) location, not a verified exact one. Kept
  off the map entirely and shown as a plain list instead, on purpose: a wrong
  pin could send someone walking to a spot where the place isn't actually
  located. Each entry has a one-sentence description and, where a real photo
  of the specific place could be verified, a picture — otherwise a generic
  icon, never a guessed/mismatched photo.

## Before the trip

1. **Get a MapTiler key** (free tier): https://www.maptiler.com — sign up,
   copy the API key, put it in a `.env.local` file at the project root:
   ```
   VITE_MAPTILER_KEY=your_key_here
   ```
   Without a key the app falls back to the public OpenStreetMap raster
   tiles, which work for testing but aren't meant for heavy/production use —
   get the key before relying on this for the actual trip.
2. Run `npm run build`, deploy `dist/` somewhere reachable over HTTPS (a
   static host — Netlify, Vercel, GitHub Pages, etc. all work), and have him
   open it in Safari once on WiFi, then **Share → Add to Home Screen**.
3. Open the app once per stage the day before (or morning of, on hotel
   WiFi) and tap **Save map for offline** — this is what makes the map usable
   with no signal on the trail.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build       # production build, generates the service worker
npm run preview     # serve the production build to test offline behavior
```

Note: offline behavior (service worker precaching) only works meaningfully
against the production build (`build` + `preview`), not `npm run dev`.

## GPS / background behavior (iOS constraint, not a bug)

iOS Safari suspends JavaScript — including GPS updates — once the screen
locks or the app is backgrounded. There's no PWA API to work around this.
Position only updates while the app is open and the screen is on; that's a
platform limitation, not something this app can fix.

## Regenerating route/POI data

`src/data/raw/` has the scripts used to build `src/data/routes/*.json`:

1. `build-stages.mjs` — slices the source GPX track (Central Way,
   Porto→Santiago) into the 6 stages, anchored to published stage distances.
2. `fetch-pois.mjs` + `process-pois.mjs` — Overpass query for albergues,
   cafés/bars, churches, historic markers/cruceiros, water fountains, and
   viewpoints along the trail corridor.
3. `geocode-villages.mjs` + `add-curated-recommendations.mjs` — a small
   hand-curated set of pilgrim-recommended restaurants/bars (sourced from a
   published Camino food guide, not OSM), geocoded and validated against the
   trail before being added as `recommended`-type POIs.
4. `split-recommendations.mjs` — moves any curated recommendation without a
   *verified exact* location (i.e. not matched to a real OSM listing for that
   specific business) out of the map POI data and into
   `tui-santiago-nearby-places.json` instead, shown in the app's "More" tab.
   `process-place-photos.mjs` (run from the repo root, not `raw/`) resizes
   any real photos found for those places into `public/nearby-photos/`.

Re-run in that order if the route ever needs adjusting. POI categories are
narrower than "everything OSM knows about" by design — see `classify()` in
`process-pois.mjs` to add more.
