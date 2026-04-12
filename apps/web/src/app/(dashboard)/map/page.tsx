import type { Metadata } from 'next'
import Script from 'next/script'
import { MapShell } from '@/components/map/map-shell'

export const metadata: Metadata = { title: 'Карта' }

// MapShell uses fixed inset-0 z-40 — covers the dashboard layout fullscreen.
// The Yandex Maps script is loaded here so it's available before MapShell mounts.
export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_YMAPS_API_KEY ?? ''

  return (
    <>
      <Script
        src={`https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`}
        strategy="afterInteractive"
      />
      <MapShell />
    </>
  )
}
