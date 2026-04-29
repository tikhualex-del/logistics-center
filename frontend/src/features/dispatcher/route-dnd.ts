export const MAP_ORDER_DROP_EVENT = 'dispatcher:map-order-drop'
export const ROUTE_DROP_TARGET_SELECTOR = '[data-route-drop-target="true"]'

export interface MapOrderDropDetail {
  orderId: string
}

export function dispatchMapOrderDrop(orderId: string): void {
  window.dispatchEvent(
    new CustomEvent<MapOrderDropDetail>(MAP_ORDER_DROP_EVENT, {
      detail: { orderId },
    }),
  )
}

export function isMapOrderDropEvent(
  event: Event,
): event is CustomEvent<MapOrderDropDetail> {
  if (event.type !== MAP_ORDER_DROP_EVENT) return false
  if (!('detail' in event)) return false

  const detail = (event as CustomEvent<unknown>).detail
  return (
    typeof detail === 'object' &&
    detail !== null &&
    'orderId' in detail &&
    typeof detail.orderId === 'string'
  )
}
