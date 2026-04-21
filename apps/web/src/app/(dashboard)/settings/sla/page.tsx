import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { SlaSettingsForm } from '@/components/settings/sla-settings-form'

export const metadata: Metadata = { title: 'SLA Settings' }

export default function SlaSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="SLA Settings" />
      <SlaSettingsForm />
    </div>
  )
}
