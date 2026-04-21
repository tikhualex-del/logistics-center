'use client'

import { useOrder, useUpdateOrderStatus } from '@/features/orders/hooks'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/layout/role-guard'

interface Props {
  orderId: string
}

export function OrderActions({ orderId }: Props) {
  const { data: order } = useOrder(orderId)
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus(orderId)

  if (!order) return null

  return (
    <RoleGuard roles={['owner', 'dispatcher']}>
      <div className="flex gap-2">
        {order.status === 'new' && (
          <Button size="sm" variant="secondary" onClick={() => updateStatus('assigned')} disabled={isPending}>
            Assign
          </Button>
        )}
        {order.status === 'assigned' && (
          <Button size="sm" variant="secondary" onClick={() => updateStatus('picked_up')} disabled={isPending}>
            Mark Picked Up
          </Button>
        )}
        {order.status === 'picked_up' && (
          <Button size="sm" onClick={() => updateStatus('delivered')} disabled={isPending}>
            Mark Delivered
          </Button>
        )}
        {['new', 'assigned', 'picked_up'].includes(order.status) && (
          <Button size="sm" variant="danger" onClick={() => updateStatus('cancelled')} disabled={isPending}>
            Cancel
          </Button>
        )}
      </div>
    </RoleGuard>
  )
}
