import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import {
  deleteAdminCustomer,
  getAdminCustomer,
  getAdminCustomers,
  updateAdminCustomerStatus,
  type AdminCustomerDetailResponse,
  type AdminCustomerItem,
} from '../../../api/adminApi'

export function AdminCustomersTab() {
  const [customers, setCustomers] = useState<AdminCustomerItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'admin'>('all')

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionPendingId, setActionPendingId] = useState<number | null>(null)

  // Customer inspection modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [customerDetail, setCustomerDetail] = useState<AdminCustomerDetailResponse | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Fetch customers from backend
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAdminCustomers({
        search: search.trim() || undefined,
        status: statusFilter === 'admin' ? undefined : statusFilter,
        role: statusFilter === 'admin' ? 'admin' : undefined,
        page,
        limit: 15,
      })
      setCustomers(res.customers || [])
      setTotal(res.total || 0)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load customers'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchCustomers])

  // Handle status toggle (activate / suspend)
  const handleToggleStatus = async (customer: AdminCustomerItem) => {
    setActionPendingId(customer.id)
    const nextStatus = !customer.is_active
    try {
      await updateAdminCustomerStatus(customer.id, nextStatus)
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, is_active: nextStatus } : c))
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status'
      alert(msg)
    } finally {
      setActionPendingId(null)
    }
  }

  // Handle delete customer
  const handleDeleteCustomer = async (customer: AdminCustomerItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete customer "${customer.display_name}" (${customer.email})?`
    )
    if (!confirmed) return

    setActionPendingId(customer.id)
    try {
      await deleteAdminCustomer(customer.id)
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id))
      setTotal((prev) => Math.max(0, prev - 1))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete customer'
      alert(msg)
    } finally {
      setActionPendingId(null)
    }
  }

  // View customer details
  const handleViewDetail = async (id: number) => {
    setSelectedCustomerId(id)
    setIsLoadingDetail(true)
    setCustomerDetail(null)
    try {
      const detail = await getAdminCustomer(id)
      setCustomerDetail(detail)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch customer profile'
      alert(msg)
      setSelectedCustomerId(null)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const totalPages = Math.ceil(total / 15) || 1

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="m-0 text-lg font-bold text-[var(--ink)]">Registered Platform Customers</h2>
          <p className="m-0 text-xs text-stone-500">
            {total} total records in database · Real-time backend synchronised
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh button */}
          <button
            onClick={() => fetchCustomers()}
            disabled={isLoading}
            className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-[var(--red)]' : ''} />
          </button>

          {/* Search box */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              placeholder="Filter customer name, email, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="h-10 w-56 sm:w-64 rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-xs focus:border-[var(--red)] focus:outline-none shadow-xs"
            />
          </div>

          {/* Quick filter pills */}
          <div className="flex items-center rounded-xl border border-stone-200 bg-white p-1 text-xs font-semibold shadow-xs">
            {(['all', 'active', 'inactive', 'admin'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setStatusFilter(filter)
                  setPage(1)
                }}
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

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-medium text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchCustomers()}
            className="rounded-lg bg-red-100 px-3 py-1 font-bold text-red-800 hover:bg-red-200 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Customers Table */}
      <div className="rounded-2xl border border-[#eadfd2] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fffaf4] border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Orders Placed</th>
                <th className="py-3.5 px-4">Total Spent</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4" colSpan={8}>
                      <div className="h-6 rounded bg-stone-100" />
                    </td>
                  </tr>
                ))
              ) : customers.length > 0 ? (
                customers.map((c) => {
                  const roleStr = c.roles?.[0] || 'customer'
                  const isPending = actionPendingId === c.id
                  const formattedDate = c.created_at
                    ? new Date(c.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'

                  return (
                    <tr key={c.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {c.avatar_url ? (
                            <img
                              src={c.avatar_url}
                              alt=""
                              className="h-8 w-8 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="grid h-8 w-8 place-items-center rounded-xl bg-orange-100 font-bold text-[var(--red)] text-xs">
                              {c.display_name ? c.display_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div>
                            <p className="m-0 font-bold text-[var(--ink)]">{c.display_name}</p>
                            <p className="m-0 text-[11px] text-stone-400">ID #{c.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="m-0 text-stone-700">{c.email}</p>
                        <p className="m-0 text-[11px] text-stone-400">{c.phone || 'No phone'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            roleStr === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {roleStr === 'admin' && <Shield size={11} />}
                          {roleStr}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-700">
                        {c.orders_count} orders
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[var(--ink)]">
                        Rs.{c.total_spent.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 text-[11px]">{formattedDate}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                            c.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              c.is_active ? 'bg-emerald-500' : 'bg-stone-400'
                            }`}
                          />
                          {c.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetail(c.id)}
                            className="grid h-7 w-7 place-items-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                            title="View Customer Profile"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(c)}
                            disabled={isPending}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                              c.is_active
                                ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }`}
                            title={c.is_active ? 'Suspend account' : 'Reactivate account'}
                          >
                            {isPending ? '...' : c.is_active ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(c)}
                            disabled={isPending}
                            className="grid h-7 w-7 place-items-center rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete user"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <Users size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="font-bold">No customers found</p>
                    <p className="text-xs">Try adjusting your search query or filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-stone-100 bg-[#fffaf4] px-4 py-3 text-xs">
            <span className="text-stone-500">
              Showing page <strong className="text-[var(--ink)]">{page}</strong> of{' '}
              <strong className="text-[var(--ink)]">{totalPages}</strong> ({total} customers)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomerId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--red)]">
                <Users size={16} />
                <span>Customer Profile Details</span>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="grid h-8 w-8 place-items-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-[var(--ink)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="py-12 text-center text-stone-400">
                <RefreshCw size={24} className="mx-auto animate-spin mb-2 text-[var(--red)]" />
                <p className="text-xs font-semibold">Loading profile information...</p>
              </div>
            ) : customerDetail ? (
              <div className="mt-4 space-y-4">
                {/* Header card */}
                <div className="flex items-center gap-3 rounded-2xl bg-[#fffaf4] p-4 border border-[#eadfd2]">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--red)] font-bold text-white text-lg shadow-sm">
                    {customerDetail.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="m-0 text-base font-bold text-[var(--ink)]">
                      {customerDetail.display_name}
                    </h3>
                    <p className="m-0 text-xs text-stone-500">{customerDetail.email}</p>
                    <p className="m-0 text-[11px] text-stone-400">{customerDetail.phone || 'No phone recorded'}</p>
                  </div>
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-3">
                    <span className="text-stone-400">Total Orders Placed</span>
                    <p className="mt-1 text-base font-bold text-[var(--ink)]">
                      {customerDetail.orders_count}
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-3">
                    <span className="text-stone-400">Total Money Spent</span>
                    <p className="mt-1 text-base font-bold text-[var(--red)]">
                      Rs.{customerDetail.total_spent.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Saved addresses */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                    Saved Delivery Addresses ({customerDetail.addresses?.length || 0})
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {customerDetail.addresses && customerDetail.addresses.length > 0 ? (
                      customerDetail.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="flex items-start gap-2 rounded-xl border border-stone-100 p-2.5 text-xs text-stone-700 bg-stone-50/40"
                        >
                          <MapPin size={14} className="mt-0.5 shrink-0 text-stone-400" />
                          <div>
                            <span className="font-bold text-[var(--ink)]">{addr.label}: </span>
                            <span>{addr.street}, {addr.city}</span>
                            {addr.is_default && (
                              <span className="ml-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-stone-400 italic">No saved addresses found.</p>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setSelectedCustomerId(null)}
                    className="rounded-xl bg-stone-100 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-200 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
