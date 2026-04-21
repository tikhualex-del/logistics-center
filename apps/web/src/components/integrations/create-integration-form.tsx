'use client'

import { useRouter } from 'next/navigation'
import { useCreateIntegration } from '@/features/integrations/hooks'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

const TYPE_OPTIONS = [
  { value: 'webhook', label: 'Webhook' },
  { value: 'api', label: 'API' },
]

export function CreateIntegrationForm() {
  const router = useRouter()
  const { mutate: createIntegration, isPending, error } = useCreateIntegration()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    createIntegration(
      {
        name: data.get('name') as string,
        type: data.get('type') as string,
        endpoint: data.get('endpoint') as string || undefined,
      },
      { onSuccess: (integration) => router.push(ROUTES.INTEGRATION(integration.id)) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <Input id="name" name="name" label="Name" required />
      <Select id="type" name="type" label="Type" options={TYPE_OPTIONS} required />
      <Input id="endpoint" name="endpoint" label="Endpoint URL" type="url" />
      {error ? <p className="text-sm text-red-600">{(error as Error).message}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>Add Integration</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
