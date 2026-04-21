import { YANDEX_MAPS_API_KEY } from '@/lib/constants'

/**
 * Singleton Yandex Maps JS API 2.1 loader.
 *
 * Injects a <script> tag once, returns a promise that resolves when
 * window.ymaps is initialised and ready. Subsequent calls return the
 * same promise — safe to call from multiple components.
 *
 * Throws if VITE_YANDEX_MAPS_API_KEY is not set.
 */

const YMAPS_SCRIPT_ID = 'yandex-maps-api-script'
const YMAPS_API_URL = 'https://api-maps.yandex.ru/2.1/'

let loadPromise: Promise<typeof window.ymaps> | null = null

export function loadYandexMaps(): Promise<typeof window.ymaps> {
  // Already loaded — resolve immediately
  if (window.ymaps && typeof window.ymaps.ready === 'function') {
    return Promise.resolve(window.ymaps)
  }

  // Already loading — return same promise
  if (loadPromise) {
    return loadPromise
  }

  if (!YANDEX_MAPS_API_KEY) {
    loadPromise = Promise.reject(
      new Error(
        'VITE_YANDEX_MAPS_API_KEY is not set. ' +
        'Add it to your .env file to enable the map.',
      ),
    )
    return loadPromise
  }

  loadPromise = new Promise<typeof window.ymaps>((resolve, reject) => {
    // Prevent duplicate script injection
    if (document.getElementById(YMAPS_SCRIPT_ID)) {
      // Script tag exists but ymaps not ready yet — wait for it
      const poll = setInterval(() => {
        if (window.ymaps && typeof window.ymaps.ready === 'function') {
          clearInterval(poll)
          window.ymaps.ready(() => resolve(window.ymaps))
        }
      }, 100)
      return
    }

    const script = document.createElement('script')
    script.id = YMAPS_SCRIPT_ID
    script.type = 'text/javascript'
    script.src = `${YMAPS_API_URL}?apikey=${encodeURIComponent(YANDEX_MAPS_API_KEY)}&lang=ru_RU&load=package.full`
    script.async = true

    script.onload = () => {
      if (!window.ymaps) {
        reject(new Error('Yandex Maps script loaded but window.ymaps is undefined'))
        return
      }
      // ymaps.ready fires when internal SDK is initialised
      void window.ymaps.ready(() => resolve(window.ymaps))
    }

    script.onerror = () => {
      loadPromise = null // allow retry on next call
      reject(new Error('Failed to load Yandex Maps script. Check your API key and network.'))
    }

    document.head.appendChild(script)
  })

  return loadPromise
}
