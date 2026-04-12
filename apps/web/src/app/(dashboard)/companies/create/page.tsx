import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { CreateCompanyForm } from '@/components/platform/create-company-form'

export const metadata: Metadata = { title: 'Add Company' }

export default function CreateCompanyPage() {
  return (
    <div className="max-w-lg">
      <PageHeader title="Add Company" description="Provision a new tenant" />
      <CreateCompanyForm />
    </div>
  )
}
