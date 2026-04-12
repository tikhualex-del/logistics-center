'use client'

import { useRouter } from 'next/navigation'
import { useCreateRoute } from '@/features/routes/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

export function CreateRouteForm() {
  const router = useRouter()
  const { mutate: createRoute, isPending, error } = useCreateRoute()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    createRoute(
      { name: data.get('name') as string },
      { onSuccess: (route) => router.push(ROUTES.ROUTE(route.id)) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <Input id="name" name="name" label="Route Name" required />
      {error ? <p className="text-sm text-red-600">{(error as Error).message}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>Create Route</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
