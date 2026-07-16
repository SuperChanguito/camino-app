import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, offlineTileSourceUrl, registerOfflineProtocol } from '../../lib/offlineTiles'
import type { Stage } from '../../types'

registerOfflineProtocol()

export function PoiMapPicker({
  stage,
  initialLat,
  initialLon,
  onConfirm,
  onCancel,
}: {
  stage: Stage
  initialLat: number | null
  initialLon: number | null
  onConfirm: (lat: number, lon: number) => void
  onCancel: () => void
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const [picked, setPicked] = useState<{ lat: number; lon: number } | null>(
    initialLat != null && initialLon != null ? { lat: initialLat, lon: initialLon } : null,
  )

  useEffect(() => {
    if (!mapContainerRef.current) return

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
      const center: [number, number] =
        picked != null ? [picked.lon, picked.lat] : stage.track[Math.floor(stage.track.length / 2)]
      map.jumpTo({ center, zoom: 15 })

      if (picked) placeMarker(picked.lat, picked.lon)
    })

    map.on('click', (e) => {
      setPicked({ lat: e.lngLat.lat, lon: e.lngLat.lng })
      placeMarker(e.lngLat.lat, e.lngLat.lng)
    })

    function placeMarker(lat: number, lon: number) {
      if (!markerRef.current) {
        const el = document.createElement('div')
        el.style.fontSize = '32px'
        el.style.lineHeight = '1'
        el.textContent = '📍'
        el.style.transform = 'translateY(8px)' // pin tip roughly at the coordinate
        markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lon, lat]).addTo(map)
      } else {
        markerRef.current.setLngLat([lon, lat])
      }
    }

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 16 }}>Tap the map where this point of interest is.</p>
      </div>

      <div ref={mapContainerRef} style={{ flex: 1, minHeight: 0 }} />

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface)' }}>
        <button
          className="big-button big-button--primary"
          disabled={!picked}
          onClick={() => picked && onConfirm(picked.lat, picked.lon)}
        >
          Use this location
        </button>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 15, padding: 8 }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
