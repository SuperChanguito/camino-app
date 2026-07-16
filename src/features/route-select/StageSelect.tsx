import { routes } from '../../data'
import { useEffectiveStages } from '../../lib/useEffectiveData'
import { useAppStore } from '../../state/store'

const ROUTE_ID = routes[0].id

export function StageSelect() {
  const allStages = useEffectiveStages(ROUTE_ID)
  const stages = allStages.filter((s) => !s.skipped)

  const activeStageId = useAppStore((s) => s.activeStageId)
  const setActiveStage = useAppStore((s) => s.setActiveStage)
  const setScreen = useAppStore((s) => s.setScreen)

  function choose(stageId: string) {
    setActiveStage(stageId)
    setScreen('map')
  }

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' }}>
      <h1>Which day is it?</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: 18 }}>Pick today's walk.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {stages.map((stage, index) => {
          const isActive = stage.id === activeStageId
          return (
            <button
              key={stage.id}
              className={`big-button ${isActive ? 'big-button--primary' : ''}`}
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left' }}
              onClick={() => choose(stage.id)}
            >
              <span style={{ fontSize: 15, fontWeight: 500, opacity: 0.8 }}>Day {index + 1}</span>
              <span>
                {stage.startTown} → {stage.endTown}
              </span>
              <span style={{ fontSize: 16, fontWeight: 400, opacity: 0.85 }}>{stage.distanceKm} km</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={() => setScreen('advanced')}
        style={{
          marginTop: 'auto',
          alignSelf: 'center',
          background: 'none',
          border: 'none',
          color: 'var(--text-dim)',
          fontSize: 14,
          padding: 12,
        }}
        aria-label="Advanced settings"
      >
        ⚙︎
      </button>
    </div>
  )
}
