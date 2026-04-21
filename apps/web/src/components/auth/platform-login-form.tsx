'use client'

import { useRouter } from 'next/navigation'
import { usePlatformLogin } from '@/features/auth/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

export function PlatformLoginForm() {
  const router = useRouter()
  const { mutate: login, isPending, error } = usePlatformLogin()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    login(
      {
        email: data.get('email') as string,
        password: data.get('password') as string,
      },
      { onSuccess: () => router.replace(ROUTES.COMPANIES) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="email" name="email" type="email" label="Email" required />
      <Input id="password" name="password" type="password" label="Password" required />
      {error ? <p className="text-sm text-red-600">{(error as Error).message}</p> : null}
      <Button type="submit" loading={isPending} className="w-full">
        Sign in as Platform Admin
      </Button>
    </form>
  )
}
