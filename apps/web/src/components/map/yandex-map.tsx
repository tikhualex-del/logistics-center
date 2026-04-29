'use client'

import { useEffect, useRef, useState } from 'react'
import { DEFAULT_VIEWPORT } from '@/features/map/model'
import type { Order } from '@/features/orders/types'

type YandexMapInstance = {
  destroy(): void
  geoObjects: {
    removeAll(): void
    add(object: unknown): void
  }
}

interface Props {
  orders: Order[]
  selectedOrderId: string | null
  selectedOrderIds: string[]
  onSelectOrder: (id: string, multiSelect?: boolean) => void
}

export function YandexMap({
  orders,
  selectedOrderId,
  selectedOrderIds,
  onSelectOrder,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<YandexMapInstance | null>(null)
  const isMultiSelectKeyPressedRef = useRef(false)
  const pointerMultiSelectRef = useRef(false)
  const pointerMultiSelectTimerRef = useRef<number | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    const clearPointerModifier = () => {
      if (pointerMultiSelectTimerRef.current !== null) {
        window.clearTimeout(pointerMultiSelectTimerRef.current)
        pointerMultiSelectTimerRef.current = null
      }

      pointerMultiSelectRef.current = false
    }

    const syncMultiSelectKey = (event: KeyboardEvent) => {
      isMultiSelectKeyPressedRef.current = event.ctrlKey || event.metaKey
    }

    const syncPointerModifier = (event: MouseEvent | PointerEvent) => {
      pointerMultiSelectRef.current = event.ctrlKey || event.metaKey

      if (pointerMultiSelectTimerRef.current !== null) {
        window.clearTimeout(pointerMultiSelectTimerRef.current)
      }

      pointerMultiSelectTimerRef.current = window.setTimeout(() => {
        pointerMultiSelectRef.current = false
        pointerMultiSelectTimerRef.current = null
      }, 1500)
    }

    const clearMultiSelectState = () => {
      isMultiSelectKeyPressedRef.current = false
      clearPointerModifier()
    }

    window.addEventListener('keydown', syncMultiSelectKey, true)
    window.addEventListener('keyup', syncMultiSelectKey, true)
    window.addEventListener('pointerdown', syncPointerModifier, true)
    window.addEventListener('mousedown', syncPointerModifier, true)
    window.addEventListener('blur', clearMultiSelectState)
    document.addEventListener('visibilitychange', clearMultiSelectState)

    return () => {
      window.removeEventListener('keydown', syncMultiSelectKey, true)
      window.removeEventListener('keyup', syncMultiSelectKey, true)
      window.removeEventListener('pointerdown', syncPointerModifier, true)
      window.removeEventListener('mousedown', syncPointerModifier, true)
      window.removeEventListener('blur', clearMultiSelectState)
      document.removeEventListener('visibilitychange', clearMultiSelectState)
      clearPointerModifier()
    }
  }, [])

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

      const isSelected =
        order.id === selectedOrderId || selectedOrderIds.includes(order.id)
      const placemark = new ymaps.Placemark(
        [order.deliveryLat, order.deliveryLng],
        {
          hintContent: order.customerName,
          iconCaption: isSelected ? order.customerName : undefined,
        },
        {
          preset: isSelected ? 'islands#blueCircleDotIconWithCaption' : 'islands#grayCircleDotIcon',
          zIndex: isSelected ? 650 : 500,
        },
      )

      placemark.events.add('click', (event: unknown) => {
        const multiSelect =
          isMultiSelectKeyPressedRef.current ||
          pointerMultiSelectRef.current ||
          hasModifierKeyFromYandexEvent(event)
        pointerMultiSelectRef.current = false
        onSelectOrder(order.id, multiSelect)
      })
      map.geoObjects.add(placemark)
    })
  }, [mapReady, orders, selectedOrderId, selectedOrderIds, onSelectOrder])

  return <div ref={containerRef} className="absolute inset-0" />
}

function hasModifierKeyFromYandexEvent(event: unknown): boolean {
  if (!isYandexEvent(event)) return false

  const domEvent = event.get('domEvent')
  if (hasModifierKey(domEvent)) return true

  if (isRecord(domEvent) && hasModifierKey(domEvent['originalEvent'])) {
    return true
  }

  return false
}

function isYandexEvent(value: unknown): value is { get(key: string): unknown } {
  return isRecord(value) && typeof value['get'] === 'function'
}

function hasModifierKey(value: unknown): boolean {
  return (
    isRecord(value) &&
    (value['ctrlKey'] === true || value['metaKey'] === true)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
