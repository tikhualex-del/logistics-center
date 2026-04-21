import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { InviteUserForm } from '@/components/users/invite-user-form'

export const metadata: Metadata = { title: 'Invite User' }

export default function CreateUserPage() {
  return (
    <div className="max-w-lg">
      <PageHeader title="Invite User" description="Add a new team member" />
      <InviteUserForm />
    </div>
  )
}
