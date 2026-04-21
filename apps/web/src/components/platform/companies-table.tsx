'use client'

import Link from 'next/link'
import { useCompanies } from '@/features/platform/hooks'
import { Table, TableHead, TableBody, Th, Td } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'
import { ROUTES } from '@/constants/routes'

export function CompaniesTable() {
  const { data: companies, isLoading } = useCompanies()

  if (isLoading) return <PageLoader />
  if (!companies?.length) return <EmptyState title="No companies yet" />

  return (
    <Table>
      <TableHead>
        <tr>
          <Th>Name</Th>
          <Th>Slug</Th>
          <Th>Status</Th>
          <Th>Plan</Th>
          <Th />
        </tr>
      </TableHead>
      <TableBody>
        {companies.map((company) => (
          <tr key={company.id}>
            <Td className="font-medium">{company.name}</Td>
            <Td className="font-mono text-xs">{company.slug}</Td>
            <Td><Badge>{company.status}</Badge></Td>
            <Td>{company.plan ?? '—'}</Td>
            <Td>
              <Link href={ROUTES.COMPANY(company.id)} className="text-blue-600 hover:underline text-sm">
                View
              </Link>
            </Td>
          </tr>
        ))}
      </TableBody>
    </Table>
  )
}
