import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import { routes } from '../../data'
import { projectOntoTrack } from '../../lib/geo'
import type { GpsErrorReason } from '../../lib/gps'
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, offlineTileSourceUrl, registerOfflineProtocol } from '../../lib/offlineTiles'
import { useEffectivePois, useEffectiveStage } from '../../lib/useEffectiveData'
import { useAppStore } from '../../state/store'
import type { Progress } from '../../types'
import { OfflineDownloadButton } from './OfflineDownloadButton'
import { PoiMarkers } from './PoiMarkers'
import { ProgressBar } from './ProgressBar'

registerOfflineProtocol()

const ROUTE_ID = routes[0].id

export function MapView() {
  const activeStageId = useAppStore((s) => s.activeStageId)
  const setScreen = useAppStore((s) => s.setScreen)
  const stage = useEffectiveStage(ROUTE_ID, activeStageId)
  const pois = useEffectivePois(stage?.id)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const positionMarkerRef = useRef<maplibregl.Marker | null>(null)

  const currentFix = useAppStore((s) => s.currentFix)
  const gpsError = useAppStore((s) => s.gpsError)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [followMe, setFollowMe] = useState(true)

  // Init map once per stage.
  useEffect(() => {
    if (!mapContainerRef.current || !stage) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          base: {
            type: 'raster',
            tiles: [offlineTileSourceUrl()],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
            minzoom: MAP_MIN_ZOOM,
            maxzoom: MAP_MAX_ZOOM,
          },
        },
        layers: [{ id: 'base', type: 'raster', source: 'base' }],
      },
      attributionControl: { compact: true },
    })
    mapRef.current = map

    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: stage.track },
        },
      })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#2d6a4f', 'line-width': 5, 'line-opacity': 0.85 },
      })

      const bounds = stage.track.reduce(
        (b, coord) => b.extend(coord as [number, number]),
        new maplibregl.LngLatBounds(stage.track[0], stage.track[0]),
      )
      map.fitBounds(bounds, { padding: 40, duration: 0 })
    })

    // Manual interaction should pause auto-follow so the user can look
    // around without the map yanking back to their position.
    map.on('dragstart', () => setFollowMe(false))

    return () => {
      map.remove()
      mapRef.current = null
      positionMarkerRef.current = null
    }
  }, [stage])

  // React to the shared GPS position (watched once at the app root).
  useEffect(() => {
    if (!stage || !currentFix) return

    const prog = projectOntoTrack({ lat: currentFix.lat, lon: currentFix.lon }, stage.track)
    setProgress(prog)

    const map = mapRef.current
    if (!map) return

    if (!positionMarkerRef.current) {
      const el = document.createElement('div')
      el.style.width = '22px'
      el.style.height = '22px'
      el.style.borderRadius = '50%'
      el.style.background = '#1a73e8'
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 0 0 2px rgba(26,115,232,0.4)'
      positionMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([currentFix.lon, currentFix.lat])
        .addTo(map)
    } else {
      positionMarkerRef.current.setLngLat([currentFix.lon, currentFix.lat])
    }

    if (followMe) {
      map.easeTo({ center: [currentFix.lon, currentFix.lat], duration: 500 })
    }
  }, [stage, currentFix, followMe])

  if (!stage) {
    return (
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <p>No day selected yet.</p>
        <button className="big-button big-button--primary" onClick={() => setScreen('stages')}>
          Choose today's walk
        </button>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <ProgressBar stage={stage} progress={progress} />

      {gpsError && <GpsErrorBanner reason={gpsError} />}

      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />

        <PoiMarkers map={mapRef.current} pois={pois} />

        {!followMe && (
          <button
            onClick={() => setFollowMe(true)}
            className="big-button big-button--primary"
            style={{
              position: 'absolute',
              bottom: 16,
              left: 20,
              right: 20,
              width: 'auto',
              minHeight: 56,
              zIndex: 5,
            }}
          >
            Recenter on me
          </button>
        )}

        <OfflineDownloadButton stage={stage} />
      </div>
    </div>
  )
}

function GpsErrorBanner({ reason }: { reason: GpsErrorReason }) {
  const message =
    reason === 'permission-denied'
      ? 'Location access is off. Turn it on in Settings to see your position.'
      : reason === 'timeout'
        ? "Still looking for your location — this can take a moment outdoors."
        : 'Location is not available right now.'

  return (
    <div
      style={{
        background: '#fff3cd',
        color: '#664d03',
        padding: '10px 16px',
        fontSize: 16,
        textAlign: 'center',
      }}
    >
      {message}
    </div>
  )
}
