export interface GpsFix {
  lat: number
  lon: number
  accuracyM: number
  timestamp: number
}

export type GpsErrorReason = 'permission-denied' | 'unavailable' | 'timeout'

/**
 * Watches device position while the app is open/foregrounded. iOS Safari
 * suspends geolocation callbacks once the screen locks or the app is
 * backgrounded — there is no PWA API to keep this alive in the background,
 * so callers should treat fixes as "last known while app was open," not a
 * continuous background track.
 */
export function watchPosition(
  onFix: (fix: GpsFix) => void,
  onError: (reason: GpsErrorReason) => void,
): () => void {
  if (!('geolocation' in navigator)) {
    onError('unavailable')
    return () => {}
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      onFix({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracyM: pos.coords.accuracy,
        timestamp: pos.timestamp,
      })
    },
    (err) => {
      if (err.code === err.PERMISSION_DENIED) onError('permission-denied')
      else if (err.code === err.TIMEOUT) onError('timeout')
      else onError('unavailable')
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    },
  )

  return () => navigator.geolocation.clearWatch(watchId)
}

export function getCurrentPosition(): Promise<GpsFix> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
          timestamp: pos.timestamp,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    )
  })
}
