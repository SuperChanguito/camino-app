import { useEffect, useState } from 'react'
import { countCachedTilesForStage, downloadStageTiles } from '../../lib/offlineTiles'
import type { Stage } from '../../types'

export function OfflineDownloadButton({ stage }: { stage: Stage }) {
  const [status, setStatus] = useState<'checking' | 'ready' | 'downloading' | 'done'>('checking')
  const [progress, setProgress] = useState({ downloaded: 0, total: 0 })

  useEffect(() => {
    let cancelled = false
    setStatus('checking')
    countCachedTilesForStage(stage).then(({ cached, total }) => {
      if (cancelled) return
      setProgress({ downloaded: cached, total })
      setStatus(cached >= total ? 'done' : 'ready')
    })
    return () => {
      cancelled = true
    }
  }, [stage])

  async function startDownload() {
    setStatus('downloading')
    await downloadStageTiles(stage, (p) => setProgress(p))
    setStatus('done')
  }

  if (status === 'checking') return null

  const percent = progress.total > 0 ? Math.round((progress.downloaded / progress.total) * 100) : 0

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 5,
        display: 'inline-flex',
      }}
    >
      {status === 'ready' && (
        <button
          className="big-button big-button--primary"
          style={{ minHeight: 48, padding: '10px 16px', fontSize: 17, whiteSpace: 'nowrap' }}
          onClick={startDownload}
        >
          ⬇ Save map for offline
        </button>
      )}
      {status === 'downloading' && (
        <div className="big-button" style={{ minHeight: 48, padding: '10px 16px', fontSize: 17, background: 'var(--surface)' }}>
          Downloading map… {percent}%
        </div>
      )}
      {status === 'done' && (
        <div
          style={{
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--text-dim)',
            background: 'var(--surface)',
            borderRadius: 10,
            padding: '6px 10px',
            border: '1px solid var(--border)',
          }}
        >
          ✓ Today's map is saved for offline use
        </div>
      )}
    </div>
  )
}
