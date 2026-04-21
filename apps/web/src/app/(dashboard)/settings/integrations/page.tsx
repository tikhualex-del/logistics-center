import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { IntegrationsSettingsPanel } from '@/components/settings/integrations-settings-panel'

export const metadata: Metadata = { title: 'Integrations Settings' }

export default function IntegrationsSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Integrations Settings" />
      <IntegrationsSettingsPanel />
    </div>
  )
}
