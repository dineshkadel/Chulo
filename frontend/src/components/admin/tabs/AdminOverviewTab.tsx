import {
  Activity,
  ArrowUpRight,
  Bike,
  CheckCircle2,
  DollarSign,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { AdminTab } from '../AdminSidebar'

interface AdminOverviewTabProps {
  onNavigateTab: (tab: AdminTab) => void
}

export function AdminOverviewTab({ onNavigateTab }: AdminOverviewTabProps) {
  // Metric cards data
  const metrics = [
    {
      label: 'Gross Platform Sales',
      value: 'Rs 1,248,500',
      change: '+14.2% vs last week',
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'Active Orders',
      value: '38',
      change: '12 preparing, 9 in transit',
      icon: ShoppingBag,
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      tab: 'order' as AdminTab,
    },
    {
      label: 'Partner Restaurants',
      value: '42',
      change: '38 open, 4 offline',
      icon: Store,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      tab: 'restaurant' as AdminTab,
    },
    {
      label: 'Delivery Fleet',
      value: '26',
      change: '18 active riders now',
      icon: Bike,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      tab: 'delivery person' as AdminTab,
    },
    {
      label: 'Registered Customers',
      value: '1,420',
      change: '+86 new this month',
      icon: Users,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      tab: 'customer' as AdminTab,
    },
  ]

  // Recent orders preview
  const recentOrders = [
    { id: '#ORD-1094', customer: 'Sujit Maharjan', restaurant: 'Himalayan Momo Ghar', amount: 980, status: 'PREPARING', time: '4 mins ago' },
    { id: '#ORD-1093', customer: 'Aastha Shrestha', restaurant: 'Thakali Kitchen Hub', amount: 1450, status: 'ASSIGNED', time: '11 mins ago' },
    { id: '#ORD-1092', customer: 'Bikash Karki', restaurant: 'Bawarchi Biryani', amount: 820, status: 'PICKED_UP', time: '18 mins ago' },
    { id: '#ORD-1091', customer: 'Pooja Thapa', restaurant: 'Newari Khaja Ghar', amount: 640, status: 'DELIVERED', time: '32 mins ago' },
    { id: '#ORD-1090', customer: 'Rohan Dangol', restaurant: 'Kathmandu Pizza Co.', amount: 1200, status: 'PLACED', time: '41 mins ago' },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLACED':
        return 'bg-amber-100 text-amber-800'
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800'
      case 'ASSIGNED':
      case 'PICKED_UP':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800'
      default:
        return 'bg-stone-100 text-stone-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1e1209] via-[#2c180d] to-[#140c06] p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-200">
              <Activity size={16} className="text-emerald-400" />
              <span>Chulo Operations Hub</span>
            </div>
            <h2 className="mt-2 font-[family-name:var(--display)] text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome back to Admin Command
            </h2>
            <p className="mt-1 max-w-xl text-xs text-orange-100/70 sm:text-sm">
              Live oversight across customers, restaurants, delivery fleet, and orders. All services operating normally with automated Haversine assignment enabled.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <button
              onClick={() => onNavigateTab('order')}
              className="flex items-center gap-2 rounded-xl bg-[var(--red)] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-transform hover:scale-105 cursor-pointer"
            >
              <ShoppingBag size={15} /> View Live Orders
            </button>
            <button
              onClick={() => onNavigateTab('delivery person')}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/20 cursor-pointer"
            >
              <Bike size={15} /> Monitor Fleet
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m, i) => {
          const Icon = m.icon
          return (
            <div
              key={i}
              onClick={() => m.tab && onNavigateTab(m.tab)}
              className={`rounded-2xl border bg-white p-5 shadow-xs transition-all ${
                m.tab ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500">{m.label}</span>
                <span className={`grid h-8 w-8 place-items-center rounded-xl border ${m.color}`}>
                  <Icon size={16} />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-[var(--ink)] tracking-tight">{m.value}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
                <span>{m.change}</span>
                {m.tab && <ArrowUpRight size={13} className="text-stone-400" />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid: Live Orders + Quick Fleet Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders - 2 cols */}
        <div className="lg:col-span-2 rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="m-0 text-base font-bold text-[var(--ink)]">Recent Platform Orders</h3>
              <p className="m-0 text-xs text-stone-500">Live feed across all partner restaurants</p>
            </div>
            <button
              onClick={() => onNavigateTab('order')}
              className="text-xs font-bold text-[var(--red)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View all orders <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Restaurant</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 font-mono font-bold text-[var(--ink)]">{o.id}</td>
                    <td className="py-3 text-stone-700">{o.customer}</td>
                    <td className="py-3 text-stone-600">{o.restaurant}</td>
                    <td className="py-3 font-bold text-[var(--ink)]">Rs {o.amount}</td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-stone-400 text-[11px]">{o.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick System & Fleet Status - 1 col */}
        <div className="space-y-6">
          {/* Dispatch health card */}
          <div className="rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-xs">
            <h3 className="m-0 text-base font-bold text-[var(--ink)]">Assignment Engine</h3>
            <p className="m-0 mt-0.5 text-xs text-stone-500">Haversine dispatch algorithm</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                <span className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={16} className="text-emerald-600" /> Auto-Assign Status
                </span>
                <span className="font-semibold uppercase tracking-wider text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-stone-100">
                <span className="text-stone-500">Search Radius</span>
                <span className="font-bold text-[var(--ink)]">5.0 km</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-stone-100">
                <span className="text-stone-500">Available Riders</span>
                <span className="font-bold text-emerald-600">18 Online</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-stone-500">Avg. Acceptance Time</span>
                <span className="font-bold text-[var(--ink)]">2.4 mins</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('setting')}
              className="mt-4 w-full rounded-xl border border-stone-200 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Configure Dispatch Engine
            </button>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-xs">
            <h3 className="m-0 text-base font-bold text-[var(--ink)]">Admin Quick Links</h3>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigateTab('restaurant')}
                className="flex flex-col items-center justify-center rounded-xl border border-stone-100 bg-[#fffaf4] p-3 text-center font-bold text-stone-700 hover:border-[var(--red)]/40 hover:text-[var(--red)] transition-all cursor-pointer"
              >
                <Store size={18} className="mb-1 text-[var(--red)]" />
                <span>Add Restaurant</span>
              </button>
              <button
                onClick={() => onNavigateTab('delivery person')}
                className="flex flex-col items-center justify-center rounded-xl border border-stone-100 bg-[#fffaf4] p-3 text-center font-bold text-stone-700 hover:border-[var(--red)]/40 hover:text-[var(--red)] transition-all cursor-pointer"
              >
                <Bike size={18} className="mb-1 text-blue-600" />
                <span>Verify Rider</span>
              </button>
              <button
                onClick={() => onNavigateTab('menu')}
                className="flex flex-col items-center justify-center rounded-xl border border-stone-100 bg-[#fffaf4] p-3 text-center font-bold text-stone-700 hover:border-[var(--red)]/40 hover:text-[var(--red)] transition-all cursor-pointer"
              >
                <TrendingUp size={18} className="mb-1 text-amber-600" />
                <span>Food Categories</span>
              </button>
              <button
                onClick={() => onNavigateTab('customer')}
                className="flex flex-col items-center justify-center rounded-xl border border-stone-100 bg-[#fffaf4] p-3 text-center font-bold text-stone-700 hover:border-[var(--red)]/40 hover:text-[var(--red)] transition-all cursor-pointer"
              >
                <Users size={18} className="mb-1 text-purple-600" />
                <span>Customer Log</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
