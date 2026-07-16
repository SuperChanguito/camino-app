import { useState } from 'react'
import { routes, setStageOrder, setStageSkipped } from '../../data'
import { useEffectiveStages } from '../../lib/useEffectiveData'
import { useAppStore } from '../../state/store'
import { PoiListEditor } from './PoiListEditor'
import { StageEditForm } from './StageEditForm'

const ROUTE_ID = routes[0].id

type View = { type: 'stages' } | { type: 'edit-stage'; stageId: string } | { type: 'pois'; stageId: string }

export function AdvancedScreen() {
  const [view, setView] = useState<View>({ type: 'stages' })
  const setScreen = useAppStore((s) => s.setScreen)

  if (view.type === 'edit-stage') {
    return <StageEditForm stageId={view.stageId} onDone={() => setView({ type: 'stages' })} />
  }
  if (view.type === 'pois') {
    return <PoiListEditor stageId={view.stageId} onDone={() => setView({ type: 'stages' })} />
  }

  return (
    <StageListEditor
      onEditStage={(stageId) => setView({ type: 'edit-stage', stageId })}
      onEditPois={(stageId) => setView({ type: 'pois', stageId })}
      onDone={() => setScreen('stages')}
    />
  )
}

function StageListEditor({
  onEditStage,
  onEditPois,
  onDone,
}: {
  onEditStage: (stageId: string) => void
  onEditPois: (stageId: string) => void
  onDone: () => void
}) {
  const stages = useEffectiveStages(ROUTE_ID)
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion)

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= stages.length) return
    const reordered = [...stages]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    await setStageOrder(reordered.map((s) => s.id))
    bumpDataVersion()
  }

  async function toggleSkip(stageId: string, currentlySkipped: boolean) {
    await setStageSkipped(stageId, !currentlySkipped)
    bumpDataVersion()
  }

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' }}>
      <h1>Edit the trip</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: 16 }}>
        Reorder, skip, rename, or adjust days. Add or fix points of interest.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            style={{
              border: '2px solid var(--border)',
              borderRadius: 14,
              padding: 14,
              background: 'var(--surface)',
              opacity: stage.skipped ? 0.55 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
                  Day {index + 1}
                  {stage.skipped ? ' — skipped' : ''}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {stage.startTown} → {stage.endTown}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{stage.distanceKm} km</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  className="icon-button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Move day earlier"
                >
                  ↑
                </button>
                <button
                  className="icon-button"
                  disabled={index === stages.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move day later"
                >
                  ↓
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button className="icon-button" style={{ width: 'auto', padding: '0 14px', fontSize: 14 }} onClick={() => onEditStage(stage.id)}>
                ✏️ Edit details
              </button>
              <button className="icon-button" style={{ width: 'auto', padding: '0 14px', fontSize: 14 }} onClick={() => onEditPois(stage.id)}>
                📍 Points of interest
              </button>
              <button
                className="icon-button"
                style={{ width: 'auto', padding: '0 14px', fontSize: 14 }}
                onClick={() => toggleSkip(stage.id, stage.skipped)}
              >
                {stage.skipped ? '↺ Unskip' : '⏭ Skip'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="big-button big-button--primary" onClick={onDone}>
        Done
      </button>
    </div>
  )
}
