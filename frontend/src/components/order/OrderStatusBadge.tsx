import type { OrderStatus } from '../../types/order'
import { Badge } from '../ui/Badge'

const variantMap: Record<OrderStatus, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  PLACED: 'warning',
  ACCEPTED: 'info',
  PREPARING: 'info',
  READY: 'info',
  ASSIGNED: 'info',
  PICKED_UP: 'warning',
  DELIVERED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
}

const labels: Record<OrderStatus, string> = {
  PLACED: 'Order Placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready for Pickup',
  ASSIGNED: 'Rider Assigned',
  PICKED_UP: 'Out for Delivery',
  DELIVERED: 'Delivered',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant = variantMap[status] ?? 'neutral'
  return <Badge variant={variant}>{labels[status] || status}</Badge>
}
