import { useState } from 'react'
import { addCustomPoi, deletePoi, getStage, updatePoi } from '../../data'
import { POI_TYPE_META } from '../../lib/poiTypes'
import { useEffectivePois } from '../../lib/useEffectiveData'
import { useAppStore } from '../../state/store'
import type { Poi } from '../../types'
import { PoiForm, type PoiDraft } from './PoiForm'
import { PoiMapPicker } from './PoiMapPicker'

type SubView = { type: 'list' } | { type: 'picker' } | { type: 'form' }

export function PoiListEditor({ stageId, onDone }: { stageId: string; onDone: () => void }) {
  const stage = getStage(stageId)
  const pois = useEffectivePois(stageId)
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion)

  const [subView, setSubView] = useState<SubView>({ type: 'list' })
  const [draft, setDraft] = useState<PoiDraft | null>(null)

  if (!stage) return null

  function startAdd() {
    setDraft({ name: '', type: 'other', notes: '', lat: NaN, lon: NaN })
    setSubView({ type: 'picker' })
  }

  function startEdit(poi: Poi) {
    setDraft({ id: poi.id, name: poi.name, type: poi.type, notes: poi.notes ?? '', lat: poi.lat, lon: poi.lon })
    setSubView({ type: 'form' })
  }

  async function handleSave(saved: PoiDraft) {
    if (saved.id) {
      await updatePoi({
        id: saved.id,
        stageId,
        name: saved.name,
        type: saved.type,
        lat: saved.lat,
        lon: saved.lon,
        notes: saved.notes || undefined,
      })
    } else {
      await addCustomPoi({
        stageId,
        name: saved.name,
        type: saved.type,
        lat: saved.lat,
        lon: saved.lon,
        notes: saved.notes || undefined,
      })
    }
    bumpDataVersion()
    setDraft(null)
    setSubView({ type: 'list' })
  }

  async function handleDelete() {
    if (!draft?.id) return
    if (!window.confirm(`Delete "${draft.name}"?`)) return
    await deletePoi(draft.id)
    bumpDataVersion()
    setDraft(null)
    setSubView({ type: 'list' })
  }

  if (subView.type === 'picker' && draft) {
    return (
      <PoiMapPicker
        stage={stage}
        initialLat={Number.isNaN(draft.lat) ? null : draft.lat}
        initialLon={Number.isNaN(draft.lon) ? null : draft.lon}
        onConfirm={(lat, lon) => {
          setDraft({ ...draft, lat, lon })
          setSubView({ type: 'form' })
        }}
        onCancel={() => {
          setDraft(null)
          setSubView({ type: 'list' })
        }}
      />
    )
  }

  if (subView.type === 'form' && draft) {
    return (
      <PoiForm
        draft={draft}
        onSave={handleSave}
        onDelete={draft.id ? handleDelete : undefined}
        onMovePin={() => setSubView({ type: 'picker' })}
        onCancel={() => {
          setDraft(null)
          setSubView({ type: 'list' })
        }}
      />
    )
  }

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' }}>
      <h1>Points of interest</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: 16 }}>
        {stage.startTown} → {stage.endTown}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pois.map((poi) => (
          <div
            key={poi.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: '2px solid var(--border)',
              borderRadius: 12,
              padding: '10px 14px',
              background: 'var(--surface)',
            }}
          >
            <span style={{ fontSize: 22 }}>{POI_TYPE_META[poi.type]?.icon ?? POI_TYPE_META.other.icon}</span>
            <span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{poi.name}</span>
            <button className="icon-button" style={{ width: 'auto', padding: '0 12px', fontSize: 14 }} onClick={() => startEdit(poi)}>
              Edit
            </button>
          </div>
        ))}
        {pois.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No points of interest yet.</p>}
      </div>

      <button className="big-button big-button--primary" onClick={startAdd}>
        + Add point of interest
      </button>

      <button
        onClick={onDone}
        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 15, padding: 12 }}
      >
        Back
      </button>
    </div>
  )
}
