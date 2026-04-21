import { ProtectedLayout } from '@/components/layout/protected-layout'
import { AppShell } from '@/components/layout/app-shell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout>
      <AppShell>{children}</AppShell>
    </ProtectedLayout>
  )
}
