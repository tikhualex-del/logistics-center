'use client'

import { useState } from 'react'
import { useUpdateOrderDeadline } from '@/features/orders/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  orderId: string
  currentDeadline?: string | null
}

export function DeadlineEditor({ orderId, currentDeadline }: Props) {
  const [editing, setEditing] = useState(false)
  const { mutate: updateDeadline, isPending } = useUpdateOrderDeadline(orderId)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const deadline = data.get('deadline') as string
    updateDeadline(
      { deadline: deadline || null },
      { onSuccess: () => setEditing(false) },
    )
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{currentDeadline ? new Date(currentDeadline).toLocaleString() : 'No deadline'}</span>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Input
        id="deadline"
        name="deadline"
        type="datetime-local"
        defaultValue={currentDeadline ? new Date(currentDeadline).toISOString().slice(0, 16) : ''}
      />
      <Button type="submit" size="sm" loading={isPending}>Save</Button>
      <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
    </form>
  )
}
