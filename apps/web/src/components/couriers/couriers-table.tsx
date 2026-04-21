'use client'

import Link from 'next/link'
import { useCouriers } from '@/features/couriers/hooks'
import { Table, TableHead, TableBody, Th, Td } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'
import { ROUTES } from '@/constants/routes'
import { courierStatusColor } from '@/lib/utils/status-colors'

export function CouriersTable() {
  const { data: couriers, isLoading } = useCouriers()

  if (isLoading) return <PageLoader />
  if (!couriers?.length) return <EmptyState title="No couriers yet" description="Add your first courier to get started." />

  return (
    <Table>
      <TableHead>
        <tr>
          <Th>Name</Th>
          <Th>Phone</Th>
          <Th>Status</Th>
          <Th>Vehicle</Th>
          <Th />
        </tr>
      </TableHead>
      <TableBody>
        {couriers.map((courier) => (
          <tr key={courier.id}>
            <Td className="font-medium">{courier.name}</Td>
            <Td>{courier.phone ?? '—'}</Td>
            <Td><Badge className={courierStatusColor(courier.status)}>{courier.status}</Badge></Td>
            <Td>{courier.vehicleType ?? '—'}</Td>
            <Td>
              <Link href={ROUTES.COURIER(courier.id)} className="text-blue-600 hover:underline text-sm">
                View
              </Link>
            </Td>
          </tr>
        ))}
      </TableBody>
    </Table>
  )
}
