'use client'

import { useSlaSettings, useUpdateSlaSettings } from '@/features/settings/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/loader'

export function SlaSettingsForm() {
  const { data: settings, isLoading } = useSlaSettings()
  const { mutate: updateSettings, isPending } = useUpdateSlaSettings()

  if (isLoading) return <PageLoader />

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    updateSettings({ atRiskWindowMinutes: Number(data.get('atRiskWindowMinutes')) })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <Input
        id="atRiskWindowMinutes"
        name="atRiskWindowMinutes"
        type="number"
        label="At-Risk Window (minutes)"
        defaultValue={settings?.atRiskWindowMinutes ?? 30}
        min={1}
      />
      <Button type="submit" loading={isPending}>Save Changes</Button>
    </form>
  )
}
