'use client'

import { useRouter } from 'next/navigation'
import { useInviteUser } from '@/features/users/hooks'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

const ROLE_OPTIONS = [
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'owner', label: 'Owner' },
]

export function InviteUserForm() {
  const router = useRouter()
  const { mutate: inviteUser, isPending, error } = useInviteUser()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    inviteUser(
      {
        name: data.get('name') as string,
        email: data.get('email') as string,
        role: data.get('role') as string,
        password: data.get('password') as string,
      },
      { onSuccess: () => router.push(ROUTES.USERS) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <Input id="name" name="name" label="Full Name" required />
      <Input id="email" name="email" type="email" label="Email" required />
      <Select id="role" name="role" label="Role" options={ROLE_OPTIONS} required />
      <Input id="password" name="password" type="password" label="Password" required />
      {error ? <p className="text-sm text-red-600">{(error as Error).message}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>Invite User</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
