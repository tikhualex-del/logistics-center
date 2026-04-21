import type { Order } from '@/features/orders/types'
import { SelectedOrderOverlay } from './selected-order-overlay'
import { YandexMap } from './yandex-map'

interface Props {
  orders: Order[]           // markable orders (deliveryLat/Lng non-null)
  selectedOrder: Order | null
  onSelectOrder: (id: string) => void
  onClearSelection: () => void
}

export function MapCanvas({ orders, selectedOrder, onSelectOrder, onClearSelection }: Props) {
  return (
    <div className="absolute inset-0">
      <YandexMap
        orders={orders}
        selectedOrderId={selectedOrder?.id ?? null}
        onSelectOrder={onSelectOrder}
      />

      {selectedOrder && (
        <SelectedOrderOverlay order={selectedOrder} onClose={onClearSelection} />
      )}
    </div>
  )
}
