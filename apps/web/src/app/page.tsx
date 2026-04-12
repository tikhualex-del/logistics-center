import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'

// Root — redirect to orders (ProtectedLayout will gate if not authenticated)
export default function RootPage() {
  redirect(ROUTES.ORDERS)
}
