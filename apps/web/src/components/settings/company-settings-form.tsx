'use client'

import { useCompanySettings, useUpdateCompanySettings } from '@/features/settings/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/loader'

export function CompanySettingsForm() {
  const { data: settings, isLoading } = useCompanySettings()
  const { mutate: updateSettings, isPending } = useUpdateCompanySettings()

  if (isLoading) return <PageLoader />

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    updateSettings({ name: data.get('name') as string })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <Input
        id="name"
        name="name"
        label="Company Name"
        defaultValue={settings?.name ?? ''}
        required
      />
      <Button type="submit" loading={isPending}>Save Changes</Button>
    </form>
  )
}
