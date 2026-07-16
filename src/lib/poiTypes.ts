import type { PoiType } from '../types'

export const POI_TYPE_META: Record<PoiType, { icon: string; label: string; color: string }> = {
  albergue: { icon: '🛏️', label: 'Albergue', color: '#2d6a4f' },
  cafe: { icon: '☕', label: 'Café / Bar', color: '#a86b1c' },
  church: { icon: '⛪', label: 'Church', color: '#5b4b8a' },
  historic: { icon: '🗿', label: 'Historic marker', color: '#6b5b3e' },
  water: { icon: '💧', label: 'Water fountain', color: '#1a73e8' },
  viewpoint: { icon: '🌄', label: 'Viewpoint', color: '#2e8b8b' },
  recommended: { icon: '⭐', label: 'Pilgrim recommended', color: '#c9a227' },
  other: { icon: '📍', label: 'Point of interest', color: '#555555' },
}

export const POI_TYPE_OPTIONS: { value: PoiType; label: string }[] = (
  Object.keys(POI_TYPE_META) as PoiType[]
).map((value) => ({ value, label: `${POI_TYPE_META[value].icon} ${POI_TYPE_META[value].label}` }))
