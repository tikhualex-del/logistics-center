'use client'

import { useOperationsSettings, useUpdateOperationsSettings } from '@/features/settings/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/loader'

export function OperationsSettingsForm() {
  const { data: settings, isLoading } = useOperationsSettings()
  const { mutate: updateSettings, isPending } = useUpdateOperationsSettings()

  if (isLoading) return <PageLoader />

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    updateSettings({ timezone: data.get('timezone') as string })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <Input
        id="timezone"
        name="timezone"
        label="Timezone"
        defaultValue={settings?.timezone ?? 'UTC'}
      />
      <Button type="submit" loading={isPending}>Save Changes</Button>
    </form>
  )
}
