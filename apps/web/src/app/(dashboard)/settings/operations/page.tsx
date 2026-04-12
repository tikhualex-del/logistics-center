import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { OperationsSettingsForm } from '@/components/settings/operations-settings-form'

export const metadata: Metadata = { title: 'Operations Settings' }

export default function OperationsSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Operations Settings" />
      <OperationsSettingsForm />
    </div>
  )
}
