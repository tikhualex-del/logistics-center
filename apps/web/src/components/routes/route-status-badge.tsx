import { Badge } from '@/components/ui/badge'
import { routeStatusColor } from '@/lib/utils/status-colors'

interface Props {
  status: string
}

export function RouteStatusBadge({ status }: Props) {
  return <Badge className={routeStatusColor(status)}>{status}</Badge>
}
