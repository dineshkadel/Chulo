import type { OrderStatus } from '../../types/order'
import { Badge } from '../ui/Badge'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant = {
    PENDING: 'warning',
    CONFIRMED: 'info',
    PREPARING: 'info',
    READY_FOR_PICKUP: 'warning',
    OUT_FOR_DELIVERY: 'warning',
    DELIVERED: 'success',
    CANCELLED: 'danger',
  }[status] as 'warning' | 'info' | 'success' | 'danger'

  return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>
}

