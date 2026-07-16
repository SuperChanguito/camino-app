import maplibregl from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import { POI_TYPE_META } from '../../lib/poiTypes'
import type { Poi } from '../../types'

export function PoiMarkers({ map, pois }: { map: maplibregl.Map | null; pois: Poi[] }) {
  const markersRef = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (!map) return

    // Markers are plain DOM overlays positioned via the map's transform —
    // unlike style layers, they don't need the style to finish loading, so
    // there's no need to gate on 'load' (which is one-shot and can already
    // have fired by the time this effect first sees a non-null map, since
    // setting a ref doesn't trigger a re-render).
    for (const poi of pois) {
      const meta = POI_TYPE_META[poi.type] ?? POI_TYPE_META.other
      const el = document.createElement('div')
      el.style.width = '30px'
      el.style.height = '30px'
      el.style.borderRadius = '50%'
      el.style.background = meta.color
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.fontSize = '15px'
      el.style.border = '2px solid white'
      el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)'
      el.textContent = meta.icon

      const popup = new maplibregl.Popup({ offset: 18, closeButton: true }).setHTML(
        `<div style="font-size:16px;font-weight:600;">${escapeHtml(poi.name)}</div>
         <div style="font-size:13px;color:#666;">${escapeHtml(meta.label)}</div>`,
      )

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([poi.lon, poi.lat])
        .setPopup(popup)
        .addTo(map)
      markersRef.current.push(marker)
    }

    return () => {
      for (const marker of markersRef.current) marker.remove()
      markersRef.current = []
    }
  }, [map, pois])

  return null
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
