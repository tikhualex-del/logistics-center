import { useEffect, useState } from 'react'
import { loadYandexMaps } from '@/lib/yandex-maps-loader'

export interface UseYandexMapOptions {
  /** Initial map center [lat, lng]. Default: Moscow [55.75, 37.62] */
  center?: ymaps.Coordinates
  /** Initial zoom level. Default: 10 */
  zoom?: number
}

export interface UseYandexMapResult {
  /** The initialized ymaps.Map instance, or null while loading */
  mapInstance: ymaps.Map | null
  /** True while the Yandex Maps API is loading */
  isLoading: boolean
  /** Error message if loading failed */
  error: string | null
}

/**
 * Hook for initialising a Yandex Maps 2.1 map instance.
 *
 * Binds the map to the provided container ref on mount,
 * destroys it on unmount to prevent memory leaks.
 *
 * @param containerRef - ref to the <div> where the map will render
 * @param options - optional center/zoom overrides
 *
 * @example
 * const containerRef = useRef<HTMLDivElement>(null)
 * const { mapInstance, isLoading, error } = useYandexMap(containerRef)
 */
export function useYandexMap(
  containerRef: React.RefObject<HTMLDivElement>,
  options: UseYandexMapOptions = {},
): UseYandexMapResult {
  const {
    center = [55.75, 37.62], // Moscow
    zoom = 10,
  } = options

  const [mapInstance, setMapInstance] = useState<ymaps.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Local cancelled flag — each effect invocation gets its own closure.
    // This prevents React StrictMode double-mount from creating duplicate maps:
    // the first effect's cleanup sets its own `cancelled = true`, so when
    // the shared loadYandexMaps() promise resolves for both, only the
    // second (surviving) effect creates a map instance.
    let cancelled = false
    let localMap: ymaps.Map | null = null

    setIsLoading(true)
    setError(null)

    loadYandexMaps()
      .then((ymaps) => {
        if (cancelled || !containerRef.current) return

        const map = new ymaps.Map(
          containerRef.current,
          {
            center,
            zoom,
            controls: ['zoomControl', 'fullscreenControl'],
          },
          {
            suppressMapOpenBlock: true,
          },
        )

        localMap = map

        if (!cancelled) {
          setMapInstance(map)
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Unknown error loading Yandex Maps'
        setError(message)
        setIsLoading(false)
      })

    return () => {
      cancelled = true
      if (localMap) {
        localMap.destroy()
        localMap = null
      }
      setMapInstance(null)
    }
    // center and zoom are intentionally excluded from deps —
    // they are init-time options and should not reinitialise the map.
    // Use mapInstance.setCenter() for programmatic pan/zoom after init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef])

  return { mapInstance, isLoading, error }
}
