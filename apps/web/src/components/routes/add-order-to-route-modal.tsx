'use client'

import { useState } from 'react'
import { useOrders } from '@/features/orders/hooks'
import { useAddOrderToRoute } from '@/features/routes/hooks'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface Props {
  routeId: string
  open: boolean
  onClose: () => void
}

export function AddOrderToRouteModal({ routeId, open, onClose }: Props) {
  const { data: orders } = useOrders()
  const { mutate: addOrder, isPending } = useAddOrderToRoute(routeId)
  const [orderId, setOrderId] = useState('')

  const options = (orders ?? [])
    .filter((o) => o.status === 'new')
    .map((o) => ({ value: o.id, label: `${o.customerName} — ${o.deliveryAddress}` }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addOrder({ orderId }, { onSuccess: onClose })
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Order to Route">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          options={options}
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          label="Order"
          placeholder="Select order"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isPending} disabled={!orderId}>Add Order</Button>
        </div>
      </form>
    </Modal>
  )
}
