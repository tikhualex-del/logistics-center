import { Badge } from '@/components/ui/badge'
import { slaStatusColor } from '@/lib/utils/status-colors'

interface Props {
  status: string
}

export function SlaStatusBadge({ status }: Props) {
  return <Badge className={slaStatusColor(status)}>{status.replace('_', ' ')}</Badge>
}
