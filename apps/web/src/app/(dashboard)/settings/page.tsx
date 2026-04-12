import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage() {
  redirect(ROUTES.SETTINGS_COMPANY)
}
