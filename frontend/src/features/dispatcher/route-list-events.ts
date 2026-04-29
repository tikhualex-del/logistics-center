export const ADD_SELECTED_ORDERS_TO_ROUTE_EVENT =
  'dispatcher:add-selected-orders-to-route'

export function dispatchAddSelectedOrdersToRoute(): void {
  window.dispatchEvent(new Event(ADD_SELECTED_ORDERS_TO_ROUTE_EVENT))
}
