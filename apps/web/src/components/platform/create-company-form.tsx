'use client'

import { useRouter } from 'next/navigation'
import { useCreateCompany } from '@/features/platform/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

export function CreateCompanyForm() {
  const router = useRouter()
  const { mutate: createCompany, isPending, error } = useCreateCompany()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    createCompany(
      {
        name: data.get('name') as string,
        slug: data.get('slug') as string,
        ownerEmail: data.get('ownerEmail') as string,
        ownerName: data.get('ownerName') as string,
        ownerPassword: data.get('ownerPassword') as string,
      },
      { onSuccess: (company) => router.push(ROUTES.COMPANY(company.id)) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <Input id="name" name="name" label="Company Name" required />
      <Input id="slug" name="slug" label="Slug" required />
      <Input id="ownerName" name="ownerName" label="Owner Name" required />
      <Input id="ownerEmail" name="ownerEmail" type="email" label="Owner Email" required />
      <Input id="ownerPassword" name="ownerPassword" type="password" label="Owner Password" required />
      {error ? <p className="text-sm text-red-600">{(error as Error).message}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>Create Company</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
