'use client'

import { useState } from 'react'
import { useUpdateUserRole } from '@/features/users/hooks'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface Props {
  userId: string
  currentRole: string
  open: boolean
  onClose: () => void
}

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'viewer', label: 'Viewer' },
]

export function ChangeRoleModal({ userId, currentRole, open, onClose }: Props) {
  const [role, setRole] = useState(currentRole)
  const { mutate: updateRole, isPending } = useUpdateUserRole(userId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateRole({ role }, { onSuccess: onClose })
  }

  return (
    <Modal open={open} onClose={onClose} title="Change Role">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          options={ROLE_OPTIONS}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          label="Role"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isPending}>Save</Button>
        </div>
      </form>
    </Modal>
  )
}
