import { useEffect, useState } from 'react'
import { Activity, CheckCircle2, CircleDollarSign, ClipboardList, RefreshCw } from 'lucide-react'
import { getRestaurantOrders } from '../../api/orders'
import type { Order } from '../../types/order'
import { OrderStatusBadge } from '../order/OrderStatusBadge'
import { formatCurrency, formatDateTime } from '../../utils/format'

const activeStatuses = new Set(['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'ASSIGNED', 'PICKED_UP'])

export function RestaurantOverview({ onManageOrders }: { onManageOrders: () => void }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const result = await getRestaurantOrders(undefined, 50)
      setOrders(result.orders ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const active = orders.filter((order) => activeStatuses.has(order.status))
  const delivered = orders.filter((order) => order.status === 'DELIVERED')
  const revenue = delivered.reduce((total, order) => total + order.total, 0)
  const latest = [...orders].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5)

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[.16em] text-(--red)">Restaurant overview</p>
          <h1 className="mt-2 font-[family-name:var(--display)] text-4xl">Dashboard</h1>
          <p className="mb-0 mt-2 text-sm text-stone-500">Keep track of today’s restaurant activity.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold hover:bg-stone-50">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total orders" value={loading ? '—' : String(orders.length)} icon={ClipboardList} tone="bg-orange-100 text-orange-700" />
        <Stat label="Total revenue" value={loading ? '—' : formatCurrency(revenue)} icon={CircleDollarSign} tone="bg-emerald-100 text-emerald-700" />
        <Stat label="Active orders" value={loading ? '—' : String(active.length)} icon={Activity} tone="bg-sky-100 text-sky-700" />
        <Stat label="Delivered orders" value={loading ? '—' : String(delivered.length)} icon={CheckCircle2} tone="bg-violet-100 text-violet-700" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#eadfd2] bg-white">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div><h2 className="m-0 text-lg">Latest orders</h2><p className="mb-0 mt-1 text-sm text-stone-500">The five most recent orders.</p></div>
          <button onClick={onManageOrders} className="text-sm font-bold text-(--red)">Manage orders</button>
        </div>
        {loading ? <div className="p-8 text-center text-sm text-stone-400">Loading orders…</div> : latest.length === 0 ? <div className="p-8 text-center text-sm text-stone-400">No orders yet.</div> : (
          <div className="divide-y divide-stone-100">
            {latest.map((order) => <div key={order.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-28"><p className="m-0 font-bold">Order #{order.id}</p><p className="mb-0 mt-1 text-xs text-stone-500">{formatDateTime(order.created_at)}</p></div>
              <p className="m-0 min-w-0 flex-1 truncate text-sm text-stone-600">{order.customer?.display_name ?? 'Customer'}</p>
              <strong className="text-sm">{formatCurrency(order.total)}</strong><OrderStatusBadge status={order.status} />
            </div>)}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Activity; tone: string }) {
  return <article className="rounded-2xl border border-[#eadfd2] bg-white p-5"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={20} /></div><p className="mb-1 mt-4 text-sm text-stone-500">{label}</p><strong className="text-2xl">{value}</strong></article>
}
