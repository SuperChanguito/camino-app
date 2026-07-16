import { useEffect } from 'react'
import { AdvancedScreen } from './features/advanced/AdvancedScreen'
import { MapView } from './features/map/MapView'
import { NearbyPlaces } from './features/nearby/NearbyPlaces'
import { StageSelect } from './features/route-select/StageSelect'
import { useGpsWatch } from './lib/useGpsWatch'
import { useAppStore, type Screen } from './state/store'

function App() {
  useGpsWatch()

  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)
  const activeStageId = useAppStore((s) => s.activeStageId)
  const loadPersistedStage = useAppStore((s) => s.loadPersistedStage)

  useEffect(() => {
    void loadPersistedStage()
  }, [loadPersistedStage])

  // First launch, before any day has been picked: force the stage picker
  // (advanced mode is reachable from there regardless of stage selection).
  const effectiveScreen: Screen = screen === 'advanced' ? 'advanced' : activeStageId ? screen : 'stages'

  return (
    <>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {effectiveScreen === 'stages' && <StageSelect />}
        {effectiveScreen === 'map' && <MapView />}
        {effectiveScreen === 'nearby' && <NearbyPlaces />}
        {effectiveScreen === 'advanced' && <AdvancedScreen />}
      </main>

      {activeStageId && effectiveScreen !== 'advanced' && <BottomNav screen={effectiveScreen} setScreen={setScreen} />}
    </>
  )
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  return (
    <nav
      style={{
        display: 'flex',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <NavButton label="Map" icon="🗺️" active={screen === 'map'} onClick={() => setScreen('map')} />
      <NavButton label="More" icon="🍽️" active={screen === 'nearby'} onClick={() => setScreen('nearby')} />
      <NavButton label="Day" icon="📅" active={screen === 'stages'} onClick={() => setScreen('stages')} />
    </nav>
  )
}

function NavButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '10px 0 8px',
        border: 'none',
        background: 'none',
        color: active ? 'var(--accent)' : 'var(--text-dim)',
        fontWeight: active ? 700 : 500,
        fontSize: 14,
      }}
    >
      <span style={{ fontSize: 26 }}>{icon}</span>
      {label}
    </button>
  )
}

export default App
