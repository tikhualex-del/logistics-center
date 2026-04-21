import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { CompanySettingsForm } from '@/components/settings/company-settings-form'

export const metadata: Metadata = { title: 'Company Settings' }

export default function CompanySettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Company Settings" />
      <CompanySettingsForm />
    </div>
  )
}
