import { getNearbyPlacesForStage } from '../../data'
import { useAppStore } from '../../state/store'

export function NearbyPlaces() {
  const activeStageId = useAppStore((s) => s.activeStageId)
  const setScreen = useAppStore((s) => s.setScreen)

  if (!activeStageId) {
    return (
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <p>No day selected yet.</p>
        <button className="big-button big-button--primary" onClick={() => setScreen('stages')}>
          Choose today's walk
        </button>
      </div>
    )
  }

  const places = getNearbyPlacesForStage(activeStageId)

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' }}>
      <h1>More places nearby</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: 16 }}>
        Recommended spots for today — not exact enough to pin on the map, so ask around when you're near the
        village.
      </p>

      {places.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No extra recommendations for today.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {places.map((place) => (
          <div
            key={place.id}
            style={{
              border: '2px solid var(--border)',
              borderRadius: 16,
              overflow: 'hidden',
              background: 'var(--surface)',
            }}
          >
            {place.photo ? (
              <img
                src={`/nearby-photos/${place.photo}`}
                alt={place.name}
                style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40,
                  background: 'var(--accent-dim)',
                }}
              >
                🍽️
              </div>
            )}
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{place.name}</div>
              <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 6 }}>Near {place.area}</div>
              <div style={{ fontSize: 15 }}>{place.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
