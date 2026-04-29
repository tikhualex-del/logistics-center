import type { Order } from '@/features/orders/types'
import { SelectedOrderOverlay } from './selected-order-overlay'
import { YandexMap } from './yandex-map'

interface Props {
  orders: Order[]
  selectedOrder: Order | null
  selectedOrderIds: string[]
  onSelectOrder: (id: string, multiSelect?: boolean) => void
  onClearSelection: () => void
}

export function MapCanvas({
  orders,
  selectedOrder,
  selectedOrderIds,
  onSelectOrder,
  onClearSelection,
}: Props) {
  return (
    <div className="absolute inset-0">
      <YandexMap
        orders={orders}
        selectedOrderId={selectedOrder?.id ?? null}
        selectedOrderIds={selectedOrderIds}
        onSelectOrder={onSelectOrder}
      />

      {selectedOrder && (
        <SelectedOrderOverlay order={selectedOrder} onClose={onClearSelection} />
      )}
    </div>
  )
}
