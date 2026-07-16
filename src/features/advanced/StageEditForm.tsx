import { useEffect, useState } from 'react'
import { getStage, resetStageOverride, routes, updateStageOverride } from '../../data'
import { useEffectiveStage } from '../../lib/useEffectiveData'
import { useAppStore } from '../../state/store'

const ROUTE_ID = routes[0].id

export function StageEditForm({ stageId, onDone }: { stageId: string; onDone: () => void }) {
  const stage = useEffectiveStage(ROUTE_ID, stageId)
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion)

  const [startTown, setStartTown] = useState('')
  const [endTown, setEndTown] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    if (stage && !seeded) {
      setStartTown(stage.startTown)
      setEndTown(stage.endTown)
      setDistanceKm(String(stage.distanceKm))
      setSeeded(true)
    }
  }, [stage, seeded])

  const bundledDefault = getStage(stageId)
  const isModified =
    bundledDefault &&
    stage &&
    (stage.startTown !== bundledDefault.startTown ||
      stage.endTown !== bundledDefault.endTown ||
      stage.distanceKm !== bundledDefault.distanceKm)

  async function save() {
    const parsedDistance = parseFloat(distanceKm)
    await updateStageOverride(stageId, {
      startTown: startTown.trim(),
      endTown: endTown.trim(),
      distanceKm: Number.isFinite(parsedDistance) ? parsedDistance : undefined,
    })
    bumpDataVersion()
    onDone()
  }

  async function resetToDefault() {
    await resetStageOverride(stageId)
    bumpDataVersion()
    onDone()
  }

  if (!stage) return null

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' }}>
      <h1>Edit day details</h1>

      <div>
        <label className="field-label" htmlFor="stage-start">
          Starting town
        </label>
        <input
          id="stage-start"
          className="field-input"
          value={startTown}
          onChange={(e) => setStartTown(e.target.value)}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="stage-end">
          Ending town
        </label>
        <input id="stage-end" className="field-input" value={endTown} onChange={(e) => setEndTown(e.target.value)} />
      </div>

      <div>
        <label className="field-label" htmlFor="stage-distance">
          Distance (km)
        </label>
        <input
          id="stage-distance"
          className="field-input"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={distanceKm}
          onChange={(e) => setDistanceKm(e.target.value)}
        />
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
        Note: this only changes the names and numbers shown. The map trail itself doesn't change.
      </p>

      <button className="big-button big-button--primary" onClick={save}>
        Save
      </button>
      {isModified && (
        <button className="big-button" onClick={resetToDefault}>
          Reset to original
        </button>
      )}
      <button
        onClick={onDone}
        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 15, padding: 12 }}
      >
        Cancel
      </button>
    </div>
  )
}
