import type { Progress, Stage } from '../../types'

export function ProgressBar({ stage, progress }: { stage: Stage; progress: Progress | null }) {
  const walked = progress ? progress.kmWalked.toFixed(1) : '—'
  const remaining = progress ? progress.kmRemaining.toFixed(1) : stage.distanceKm.toFixed(1)
  const percent = progress ? Math.min(100, (progress.kmWalked / progress.kmTotal) * 100) : 0

  return (
    <div style={{ padding: '12px 16px 10px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: 'var(--text-dim)', marginBottom: 6 }}>
        <span>
          {stage.startTown} → {stage.endTown}
        </span>
      </div>
      <div style={{ height: 14, borderRadius: 7, background: 'var(--accent-dim)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: 'var(--accent)', transition: 'width 0.5s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <Stat label="Walked" value={`${walked} km`} />
        <Stat label="To go" value={`${remaining} km`} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{label}</div>
    </div>
  )
}
