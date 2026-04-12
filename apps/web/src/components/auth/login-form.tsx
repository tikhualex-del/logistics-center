'use client'

import { useRouter } from 'next/navigation'
import { useLogin } from '@/features/auth/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

export function LoginForm() {
  const router = useRouter()
  const { mutate: login, isPending, error } = useLogin()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    login(
      {
        email: data.get('email') as string,
        password: data.get('password') as string,
        companySlug: data.get('companySlug') as string,
      },
      { onSuccess: () => router.replace(ROUTES.ORDERS) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="companySlug" name="companySlug" label="Company Slug" required />
      <Input id="email" name="email" type="email" label="Email" required />
      <Input id="password" name="password" type="password" label="Password" required />
      {error ? <p className="text-sm text-red-600">{(error as Error).message}</p> : null}
      <Button type="submit" loading={isPending} className="w-full">
        Sign in
      </Button>
    </form>
  )
}
