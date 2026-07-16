import { useEffect, useState } from 'react'
import { type EffectiveStage, getEffectivePoisForStage, getEffectiveStages } from '../data'
import { useAppStore } from '../state/store'
import type { Poi } from '../types'

export function useEffectiveStages(routeId: string): EffectiveStage[] {
  const dataVersion = useAppStore((s) => s.dataVersion)
  const [stages, setStages] = useState<EffectiveStage[]>([])

  useEffect(() => {
    let cancelled = false
    getEffectiveStages(routeId).then((result) => {
      if (!cancelled) setStages(result)
    })
    return () => {
      cancelled = true
    }
  }, [routeId, dataVersion])

  return stages
}

export function useEffectiveStage(routeId: string, stageId: string | null): EffectiveStage | undefined {
  const stages = useEffectiveStages(routeId)
  return stages.find((s) => s.id === stageId)
}

export function useEffectivePois(stageId: string | undefined): Poi[] {
  const dataVersion = useAppStore((s) => s.dataVersion)
  const [pois, setPois] = useState<Poi[]>([])

  useEffect(() => {
    if (!stageId) {
      setPois([])
      return
    }
    let cancelled = false
    getEffectivePoisForStage(stageId).then((result) => {
      if (!cancelled) setPois(result)
    })
    return () => {
      cancelled = true
    }
  }, [stageId, dataVersion])

  return pois
}
