'use client'

import { useState } from 'react'
import { useCompanies, useImpersonate } from '@/features/platform/hooks'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export function ImpersonationPanel() {
  const { data: companies } = useCompanies()
  const { mutate: impersonate, isPending } = useImpersonate()
  const [companyId, setCompanyId] = useState('')

  const options = (companies ?? []).map((c) => ({ value: c.id, label: c.name }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    impersonate({ companyId })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <p className="mb-4 text-sm text-gray-600">
        Select a company to access its dashboard as a platform admin.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1">
          <Select
            options={options}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            label="Company"
            placeholder="Select company"
          />
        </div>
        <Button type="submit" loading={isPending} disabled={!companyId}>
          Impersonate
        </Button>
      </form>
    </div>
  )
}
