'use client'

import { useRouter } from 'next/navigation'
import { useCreatePlatformAdmin } from '@/features/platform/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

export function CreatePlatformAdminForm() {
  const router = useRouter()
  const { mutate: createAdmin, isPending, error } = useCreatePlatformAdmin()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    createAdmin(
      {
        name: data.get('name') as string,
        email: data.get('email') as string,
        password: data.get('password') as string,
      },
      { onSuccess: () => router.push(ROUTES.PLATFORM_ADMINS) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <Input id="name" name="name" label="Full Name" required />
      <Input id="email" name="email" type="email" label="Email" required />
      <Input id="password" name="password" type="password" label="Password" required />
      {error ? <p className="text-sm text-red-600">{(error as Error).message}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>Add Admin</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
