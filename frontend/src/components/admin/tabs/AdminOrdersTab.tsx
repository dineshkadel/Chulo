import { useState } from 'react'
import {
  Search,
  ShoppingBag,
} from 'lucide-react'
import type { OrderStatus } from '../../../types/order'
import { OrderStatusBadge } from '../../order/OrderStatusBadge'

interface AdminOrderRecord {
  id: number
  order_code: string
  customer_name: string
  customer_phone: string
  restaurant_name: string
  delivery_person_name?: string
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  total: number
  delivery_address: string
  created_at: string
}

const ALL_STATUSES: (OrderStatus | 'ALL')[] = [
  'ALL',
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'ASSIGNED',
  'PICKED_UP',
  'DELIVERED',
  'CANCELLED',
  'REJECTED',
]

const INITIAL_ORDERS: AdminOrderRecord[] = [
  { id: 1094, order_code: 'ORD-1094', customer_name: 'Sujit Maharjan', customer_phone: '+977 9841234567', restaurant_name: 'Himalayan Momo Ghar', status: 'PREPARING', subtotal: 900, delivery_fee: 80, total: 980, delivery_address: 'Bakhundole, Lalitpur', created_at: '2026-11-15 17:42' },
  { id: 1093, order_code: 'ORD-1093', customer_name: 'Aastha Shrestha', customer_phone: '+977 9812345678', restaurant_name: 'Thakali Kitchen Hub', delivery_person_name: 'Kiran Gurung', status: 'ASSIGNED', subtotal: 1350, delivery_fee: 100, total: 1450, delivery_address: 'Lazimpat, Kathmandu', created_at: '2026-11-15 17:35' },
  { id: 1092, order_code: 'ORD-1092', customer_name: 'Bikash Karki', customer_phone: '+977 9801122334', restaurant_name: 'Bawarchi Biryani House', delivery_person_name: 'Suman Basnet', status: 'PICKED_UP', subtotal: 750, delivery_fee: 70, total: 820, delivery_address: 'Kupondole, Lalitpur', created_at: '2026-11-15 17:28' },
  { id: 1091, order_code: 'ORD-1091', customer_name: 'Pooja Thapa', customer_phone: '+977 9866554433', restaurant_name: 'Newari Khaja Ghar', delivery_person_name: 'Dipesh Shrestha', status: 'DELIVERED', subtotal: 580, delivery_fee: 60, total: 640, delivery_address: 'Sallaghari, Bhaktapur', created_at: '2026-11-15 17:10' },
  { id: 1090, order_code: 'ORD-1090', customer_name: 'Rohan Dangol', customer_phone: '+977 9849988776', restaurant_name: 'Kathmandu Pizza Co.', status: 'PLACED', subtotal: 1120, delivery_fee: 80, total: 1200, delivery_address: 'Maharajgunj, Kathmandu', created_at: '2026-11-15 17:05' },
  { id: 1089, order_code: 'ORD-1089', customer_name: 'Nabin Rawal', customer_phone: '+977 9811223344', restaurant_name: 'Dragon Wok Express', status: 'CANCELLED', subtotal: 450, delivery_fee: 50, total: 500, delivery_address: 'Mid Baneshwor', created_at: '2026-11-15 16:30' },
]

export function AdminOrdersTab() {
  const [orders, setOrders] = useState<AdminOrderRecord[]>(INITIAL_ORDERS)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')

  const filtered = orders.filter((o) => {
    const matchStatus = selectedStatus === 'ALL' || o.status === selectedStatus
    const matchSearch =
      o.order_code.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.restaurant_name.toLowerCase().includes(search.toLowerCase()) ||
      (o.delivery_person_name && o.delivery_person_name.toLowerCase().includes(search.toLowerCase()))
    return matchStatus && matchSearch
  })

  const handleAdminOverride = (id: number, nextStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
    )
  }

  return (
    <div className="space-y-6">
      {/* Search & Status Pill Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="m-0 text-lg font-bold text-[var(--ink)]">Master Order Management</h2>
            <p className="m-0 text-xs text-stone-500">
              Audit trail and lifecycle management across all restaurants, riders, and customers
            </p>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              placeholder="Filter by Order ID, Customer, Restaurant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-64 sm:w-72 rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-xs focus:border-[var(--red)] focus:outline-none shadow-xs"
            />
          </div>
        </div>

        {/* Status Scroll Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {ALL_STATUSES.map((status) => {
            const count =
              status === 'ALL' ? orders.length : orders.filter((o) => o.status === status).length
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 font-bold transition-all cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-[var(--red)] text-white shadow-xs'
                    : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>{status}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    selectedStatus === status ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-[#eadfd2] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fffaf4] border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="py-3.5 px-4">Order Code</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Restaurant</th>
                <th className="py-3.5 px-4">Assigned Rider</th>
                <th className="py-3.5 px-4">Total (Rs.)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--ink)]">
                    {order.order_code}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="m-0 font-bold text-[var(--ink)]">{order.customer_name}</p>
                    <p className="m-0 text-[11px] text-stone-400">{order.customer_phone}</p>
                  </td>
                  <td className="py-3.5 px-4 text-stone-700">{order.restaurant_name}</td>
                  <td className="py-3.5 px-4">
                    {order.delivery_person_name ? (
                      <span className="font-semibold text-blue-700">{order.delivery_person_name}</span>
                    ) : (
                      <span className="text-stone-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="m-0 font-bold text-[var(--ink)]">Rs.{order.total}</p>
                    <p className="m-0 text-[10px] text-stone-400">
                      Fee: Rs.{order.delivery_fee}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-stone-500">{order.created_at}</td>
                  <td className="py-3.5 px-4 text-right">
                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === 'READY' && (
                          <button
                            onClick={() => handleAdminOverride(order.id, 'ASSIGNED')}
                            className="rounded-lg bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-800 hover:bg-blue-200 cursor-pointer"
                          >
                            Assign
                          </button>
                        )}
                        <button
                          onClick={() => handleAdminOverride(order.id, 'CANCELLED')}
                          className="rounded-lg bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-200 cursor-pointer"
                          title="Admin cancel override"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <ShoppingBag size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="font-bold">No orders found</p>
                    <p className="text-xs">Adjust your status filter or search parameters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
