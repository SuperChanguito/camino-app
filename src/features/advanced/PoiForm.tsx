import { useState } from 'react'
import { POI_TYPE_OPTIONS } from '../../lib/poiTypes'
import type { PoiType } from '../../types'

export interface PoiDraft {
  id?: string
  name: string
  type: PoiType
  notes: string
  lat: number
  lon: number
}

export function PoiForm({
  draft,
  onSave,
  onDelete,
  onMovePin,
  onCancel,
}: {
  draft: PoiDraft
  onSave: (draft: PoiDraft) => void
  onDelete?: () => void
  onMovePin: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(draft.name)
  const [type, setType] = useState<PoiType>(draft.type)
  const [notes, setNotes] = useState(draft.notes)

  const canSave = name.trim().length > 0

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' }}>
      <h1>{draft.id ? 'Edit point of interest' : 'New point of interest'}</h1>

      <div>
        <label className="field-label" htmlFor="poi-name">
          Name
        </label>
        <input
          id="poi-name"
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Albergue Municipal"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="poi-type">
          Type
        </label>
        <select id="poi-type" className="field-select" value={type} onChange={(e) => setType(e.target.value as PoiType)}>
          {POI_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor="poi-notes">
          Notes (optional)
        </label>
        <textarea
          id="poi-notes"
          className="field-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Reservation confirmed, arrive after 2pm"
        />
      </div>

      <button className="icon-button" style={{ width: 'auto', padding: '0 14px', fontSize: 14, alignSelf: 'flex-start' }} onClick={onMovePin}>
        📍 Move pin on map
      </button>

      <button
        className="big-button big-button--primary"
        disabled={!canSave}
        onClick={() => onSave({ ...draft, name: name.trim(), type, notes: notes.trim() })}
      >
        Save
      </button>

      {onDelete && (
        <button className="big-button" style={{ color: 'var(--danger)' }} onClick={onDelete}>
          Delete
        </button>
      )}

      <button
        onClick={onCancel}
        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 15, padding: 12 }}
      >
        Cancel
      </button>
    </div>
  )
}
