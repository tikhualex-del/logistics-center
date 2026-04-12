import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth/auth-context'
import { QueryProvider } from '@/lib/query/query-client'

export const metadata: Metadata = {
  title: {
    default: 'Logistics Center',
    template: '%s | Logistics Center',
  },
  description: 'Multi-tenant logistics management platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
