'use client'

import { useEffect, useRef, useState } from 'react'
import { DEFAULT_VIEWPORT } from '@/features/map/model'
import type { Order } from '@/features/orders/types'

interface Props {
  orders: Order[]
  selectedOrderId: string | null
  onSelectOrder: (id: string) => void
}

export function YandexMap({ orders, selectedOrderId, onSelectOrder }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)

  // Initialize map once on mount
  useEffect(() => {
    if (!containerRef.current) return
    if (typeof ymaps === 'undefined') return

    let destroyed = false

    ymaps.ready(() => {
      if (destroyed || mapRef.current || !containerRef.current) return

      mapRef.current = new ymaps.Map(
        containerRef.current,
        {
          center: [DEFAULT_VIEWPORT.lat, DEFAULT_VIEWPORT.lng],
          zoom: DEFAULT_VIEWPORT.zoom,
          controls: ['zoomControl', 'fullscreenControl'],
        },
        { suppressMapOpenBlock: true },
      )

      setMapReady(true)
    })

    return () => {
      destroyed = true
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
  }, [])

  // Sync placemarks whenever map is ready, orders, or selection changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    map.geoObjects.removeAll()

    orders.forEach((order) => {
      if (order.deliveryLat == null || order.deliveryLng == null) return

      const isSelected = order.id === selectedOrderId
      const placemark = new ymaps.Placemark(
        [order.deliveryLat, order.deliveryLng],
        { hintContent: order.customerName },
        {
          preset: isSelected
            ? 'islands#blueCircleDotIconWithCaption'
            : 'islands#grayCircleDotIcon',
        },
      )

      placemark.events.add('click', () => onSelectOrder(order.id))
      map.geoObjects.add(placemark)
    })
  }, [mapReady, orders, selectedOrderId, onSelectOrder])

  return <div ref={containerRef} className="absolute inset-0" />
}
