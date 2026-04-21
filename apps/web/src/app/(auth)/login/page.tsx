import type { Metadata } from 'next'
import Image from 'next/image'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/logo.svg" alt="Logistics Center" width={48} height={48} />
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Logistics Center</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
