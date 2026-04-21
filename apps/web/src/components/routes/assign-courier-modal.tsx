'use client'

import { useState } from 'react'
import { useCouriers } from '@/features/couriers/hooks'
import { useAssignCourierToRoute } from '@/features/routes/hooks'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface Props {
  routeId: string
  open: boolean
  onClose: () => void
}

export function AssignCourierModal({ routeId, open, onClose }: Props) {
  const { data: couriers } = useCouriers()
  const { mutate: assign, isPending } = useAssignCourierToRoute(routeId)
  const [courierId, setCourierId] = useState('')

  const options = (couriers ?? [])
    .filter((c) => c.status === 'active')
    .map((c) => ({ value: c.id, label: c.name }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    assign({ courierId }, { onSuccess: onClose })
  }

  return (
    <Modal open={open} onClose={onClose} title="Assign Courier">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          options={options}
          value={courierId}
          onChange={(e) => setCourierId(e.target.value)}
          label="Courier"
          placeholder="Select courier"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isPending} disabled={!courierId}>Assign</Button>
        </div>
      </form>
    </Modal>
  )
}
