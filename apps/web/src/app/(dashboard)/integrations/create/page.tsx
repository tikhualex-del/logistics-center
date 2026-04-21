import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { CreateIntegrationForm } from '@/components/integrations/create-integration-form'

export const metadata: Metadata = { title: 'Add Integration' }

export default function CreateIntegrationPage() {
  return (
    <div className="max-w-lg">
      <PageHeader title="Add Integration" description="Connect an external service" />
      <CreateIntegrationForm />
    </div>
  )
}
