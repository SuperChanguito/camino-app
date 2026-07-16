import { useEffect } from 'react'
import { watchPosition } from './gps'
import { useAppStore } from '../state/store'

/**
 * Runs one geolocation watch for the whole app, mounted once at the top
 * level, so every screen sees the same live position without starting its
 * own watch. Only updates while the app is open and in the foreground —
 * iOS Safari suspends this when the screen locks.
 */
export function useGpsWatch(): void {
  const setCurrentFix = useAppStore((s) => s.setCurrentFix)
  const setGpsError = useAppStore((s) => s.setGpsError)

  useEffect(() => {
    const stop = watchPosition(
      (fix) => {
        setGpsError(null)
        setCurrentFix(fix)
      },
      (reason) => setGpsError(reason),
    )
    return stop
  }, [setCurrentFix, setGpsError])
}
