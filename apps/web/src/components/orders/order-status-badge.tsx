import { Badge } from '@/components/ui/badge'
import { orderStatusColor } from '@/lib/utils/status-colors'

interface Props {
  status: string
}

export function OrderStatusBadge({ status }: Props) {
  return <Badge className={orderStatusColor(status)}>{status}</Badge>
}
