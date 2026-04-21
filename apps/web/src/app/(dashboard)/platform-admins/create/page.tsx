import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { CreatePlatformAdminForm } from '@/components/platform/create-platform-admin-form'

export const metadata: Metadata = { title: 'Add Platform Admin' }

export default function CreatePlatformAdminPage() {
  return (
    <div className="max-w-lg">
      <PageHeader title="Add Platform Admin" />
      <CreatePlatformAdminForm />
    </div>
  )
}
