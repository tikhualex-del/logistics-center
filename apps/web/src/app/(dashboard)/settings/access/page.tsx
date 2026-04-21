import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { AccessSettingsPanel } from '@/components/settings/access-settings-panel'

export const metadata: Metadata = { title: 'Access Settings' }

export default function AccessSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Access Settings" />
      <AccessSettingsPanel />
    </div>
  )
}
