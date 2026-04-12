import { SettingsNav } from '@/components/settings/settings-nav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8">
      <aside className="w-48 shrink-0">
        <SettingsNav />
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  )
}
