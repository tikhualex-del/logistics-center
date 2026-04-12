'use client'

import Link from 'next/link'
import { usePlatformAdmins } from '@/features/platform/hooks'
import { Table, TableHead, TableBody, Th, Td } from '@/components/ui/table'
import { PageLoader } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'
import { ROUTES } from '@/constants/routes'

export function PlatformAdminsTable() {
  const { data: admins, isLoading } = usePlatformAdmins()

  if (isLoading) return <PageLoader />
  if (!admins?.length) return <EmptyState title="No platform admins yet" />

  return (
    <Table>
      <TableHead>
        <tr>
          <Th>Name</Th>
          <Th>Email</Th>
          <Th>Created</Th>
          <Th />
        </tr>
      </TableHead>
      <TableBody>
        {admins.map((admin) => (
          <tr key={admin.id}>
            <Td className="font-medium">{admin.name}</Td>
            <Td>{admin.email}</Td>
            <Td>{new Date(admin.createdAt).toLocaleDateString()}</Td>
            <Td>
              <Link href={ROUTES.PLATFORM_ADMIN(admin.id)} className="text-blue-600 hover:underline text-sm">
                View
              </Link>
            </Td>
          </tr>
        ))}
      </TableBody>
    </Table>
  )
}
