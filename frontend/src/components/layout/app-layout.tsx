import { AlertToastViewport } from './alert-toast-viewport'
import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'

interface AppLayoutProps {
  children: React.ReactNode
}

/**
 * Layout wrapper for all authenticated protected pages.
 *
 * Structure:
 * +----------+---------------------------------------+
 * | Sidebar  |  TopBar (h-14, fixed)                 |
 * | (left,   +---------------------------------------+
 * | fixed    |  Page content (children)              |
 * | width)   |  fills remaining vertical space       |
 * +----------+---------------------------------------+
 *
 * - Sidebar: vertical navigation, collapsible
 * - TopBar: date picker, search, alerts, user info — fixed 56px height
 * - Children: full remaining space (dispatcher map, couriers list, etc.)
 *
 * Per CLAUDE.md §21: map must remain the dominant element.
 * The sidebar + top bar together use minimal chrome to maximise content area.
 */
export function AppLayout({ children }: AppLayoutProps): React.ReactElement {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
      <AlertToastViewport />
    </div>
  )
}
