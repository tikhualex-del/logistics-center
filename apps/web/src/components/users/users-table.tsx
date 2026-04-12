'use client'

import Link from 'next/link'
import { useUsers } from '@/features/users/hooks'
import { Table, TableHead, TableBody, Th, Td } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'
import { ROUTES } from '@/constants/routes'
import { userStatusColor } from '@/lib/utils/status-colors'

export function UsersTable() {
  const { data: users, isLoading } = useUsers()

  if (isLoading) return <PageLoader />
  if (!users?.length) return <EmptyState title="No users yet" description="Invite your first team member." />

  return (
    <Table>
      <TableHead>
        <tr>
          <Th>Name</Th>
          <Th>Email</Th>
          <Th>Role</Th>
          <Th>Status</Th>
          <Th />
        </tr>
      </TableHead>
      <TableBody>
        {users.map((user) => (
          <tr key={user.id}>
            <Td className="font-medium">{user.name}</Td>
            <Td>{user.email}</Td>
            <Td className="capitalize">{user.role}</Td>
            <Td><Badge className={userStatusColor(user.status)}>{user.status}</Badge></Td>
            <Td>
              <Link href={ROUTES.USER(user.id)} className="text-blue-600 hover:underline text-sm">
                View
              </Link>
            </Td>
          </tr>
        ))}
      </TableBody>
    </Table>
  )
}
