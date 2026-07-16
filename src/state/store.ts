import { create } from 'zustand'
import type { GpsErrorReason, GpsFix } from '../lib/gps'
import { getSetting, setSetting } from '../lib/storage'

export type Screen = 'map' | 'stages' | 'advanced' | 'nearby'

interface AppState {
  activeStageId: string | null
  screen: Screen
  currentFix: GpsFix | null
  gpsError: GpsErrorReason | null
  /** Bumped whenever advanced-mode edits change stage/POI data, so screens
   * reading the overlay-merged data know to refetch. */
  dataVersion: number

  setScreen: (screen: Screen) => void
  setActiveStage: (stageId: string) => void
  setCurrentFix: (fix: GpsFix | null) => void
  setGpsError: (reason: GpsErrorReason | null) => void
  bumpDataVersion: () => void
  loadPersistedStage: () => Promise<void>
}

const ACTIVE_STAGE_KEY = 'activeStageId'

export const useAppStore = create<AppState>((set, get) => ({
  activeStageId: null,
  screen: 'map',
  currentFix: null,
  gpsError: null,
  dataVersion: 0,

  setScreen: (screen) => set({ screen }),

  setActiveStage: (stageId) => {
    set({ activeStageId: stageId })
    void setSetting(ACTIVE_STAGE_KEY, stageId)
  },

  setCurrentFix: (fix) => set({ currentFix: fix }),
  setGpsError: (reason) => set({ gpsError: reason }),

  bumpDataVersion: () => set({ dataVersion: get().dataVersion + 1 }),

  loadPersistedStage: async () => {
    const stageId = await getSetting<string>(ACTIVE_STAGE_KEY)
    if (stageId) set({ activeStageId: stageId })
  },
}))
