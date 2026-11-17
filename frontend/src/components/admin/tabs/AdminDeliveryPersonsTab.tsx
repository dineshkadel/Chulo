import { useState } from 'react'
import {
  Bike,
  MapPin,
  Power,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react'

interface DeliveryPersonRecord {
  id: number
  name: string
  phone: string
  vehicle: string
  lat: number
  lng: number
  is_available: boolean
  is_verified: boolean
  current_order_id?: string
  completed_deliveries: number
  rating: number
  status: 'available' | 'delivering' | 'offline'
}

const INITIAL_RIDERS: DeliveryPersonRecord[] = [
  { id: 101, name: 'Dipesh Shrestha', phone: '+977 9841998877', vehicle: 'Honda Shine (BA 45 PA 1234)', lat: 27.7172, lng: 85.324, is_available: true, is_verified: true, completed_deliveries: 142, rating: 4.8, status: 'available' },
  { id: 102, name: 'Kiran Gurung', phone: '+977 9812443322', vehicle: 'Yamaha FZ (BA 52 PA 5678)', lat: 27.7008, lng: 85.315, is_available: false, is_verified: true, current_order_id: '#ORD-1093', completed_deliveries: 98, rating: 4.9, status: 'delivering' },
  { id: 103, name: 'Anil Tamang', phone: '+977 9803112244', vehicle: 'TVS NTORQ (BA 67 PA 9900)', lat: 27.6915, lng: 85.321, is_available: true, is_verified: true, completed_deliveries: 215, rating: 4.7, status: 'available' },
  { id: 104, name: 'Suman Basnet', phone: '+977 9866001122', vehicle: 'Hero Splendor (BA 22 PA 4455)', lat: 27.721, lng: 85.309, is_available: false, is_verified: true, current_order_id: '#ORD-1092', completed_deliveries: 64, rating: 4.6, status: 'delivering' },
  { id: 105, name: 'Ramesh Chaudhary', phone: '+977 9841009988', vehicle: 'Bajaj Pulsar (BA 34 PA 7788)', lat: 27.6744, lng: 85.312, is_available: false, is_verified: false, completed_deliveries: 12, rating: 4.5, status: 'offline' },
]

export function AdminDeliveryPersonsTab() {
  const [riders, setRiders] = useState<DeliveryPersonRecord[]>(INITIAL_RIDERS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'delivering' | 'offline'>('all')

  const availableCount = riders.filter((r) => r.status === 'available').length
  const deliveringCount = riders.filter((r) => r.status === 'delivering').length
  const offlineCount = riders.filter((r) => r.status === 'offline').length

  const filtered = riders.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search) ||
      r.vehicle.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (statusFilter === 'all') return true
    return r.status === statusFilter
  })

  const toggleAvailability = (id: number) => {
    setRiders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextAvail = !r.is_available
          return {
            ...r,
            is_available: nextAvail,
            status: nextAvail ? 'available' : 'offline',
          }
        }
        return r
      })
    )
  }

  return (
    <div className="space-y-6">
      {/* Fleet quick summary stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold text-stone-500">Total Registered Fleet</span>
          <p className="mt-1 text-2xl font-black text-[var(--ink)]">{riders.length}</p>
          <span className="text-[11px] text-stone-400">All registered riders</span>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold text-emerald-800">Available for Dispatch</span>
          <p className="mt-1 text-2xl font-black text-emerald-700">{availableCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Auto-assign eligible</span>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold text-purple-800">In Transit Delivering</span>
          <p className="mt-1 text-2xl font-black text-purple-700">{deliveringCount}</p>
          <span className="text-[11px] text-purple-600 font-medium">Fulfilling active trips</span>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 shadow-xs">
          <span className="text-xs font-bold text-stone-600">Offline / Off Duty</span>
          <p className="mt-1 text-2xl font-black text-stone-700">{offlineCount}</p>
          <span className="text-[11px] text-stone-500 font-medium">Not currently dispatchable</span>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="m-0 text-lg font-bold text-[var(--ink)]">Delivery Partner Roster</h2>
          <p className="m-0 text-xs text-stone-500">Live GPS tracking and status management for delivery personnel</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              placeholder="Search rider name, phone, plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-60 sm:w-64 rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-xs focus:border-[var(--red)] focus:outline-none shadow-xs"
            />
          </div>

          <div className="flex items-center rounded-xl border border-stone-200 bg-white p-1 text-xs font-semibold shadow-xs">
            {(['all', 'available', 'delivering', 'offline'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-lg px-3 py-1.5 capitalize transition-colors cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-[var(--red)] text-white'
                    : 'text-stone-600 hover:text-[var(--ink)]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Riders Table */}
      <div className="rounded-2xl border border-[#eadfd2] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fffaf4] border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="py-3.5 px-4">Rider</th>
                <th className="py-3.5 px-4">Vehicle</th>
                <th className="py-3.5 px-4">Live Location</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Completed Trips</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Dispatch Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-100 font-bold text-blue-800 text-xs">
                        <Bike size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="m-0 font-bold text-[var(--ink)]">{r.name}</p>
                          {r.is_verified && (
                            <span title="Verified Rider" className="inline-flex">
                              <ShieldCheck size={13} className="text-emerald-500" />
                            </span>
                          )}
                        </div>
                        <p className="m-0 text-[11px] text-stone-400">{r.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-stone-700">{r.vehicle}</td>
                  <td className="py-3.5 px-4">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-stone-600">
                      <MapPin size={12} className="text-stone-400" />
                      {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="flex items-center gap-1 font-bold text-[var(--ink)]">
                      <Star size={13} fill="currentColor" className="text-amber-500" />
                      {r.rating.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-stone-700">{r.completed_deliveries} trips</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                        r.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'delivering'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          r.status === 'available'
                            ? 'bg-emerald-500'
                            : r.status === 'delivering'
                            ? 'bg-purple-500 animate-ping'
                            : 'bg-stone-400'
                        }`}
                      />
                      {r.status === 'delivering' ? `On ${r.current_order_id}` : r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toggleAvailability(r.id)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                        r.is_available
                          ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                      title="Toggle availability for automated dispatch"
                    >
                      <Power size={11} />
                      {r.is_available ? 'Set Offline' : 'Set Available'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <Bike size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="font-bold">No riders found</p>
                    <p className="text-xs">Adjust your search or filter settings.</p>
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
