import { useState } from 'react'
import {
  Check,
  MapPin,
  Save,
  Sliders,
} from 'lucide-react'

export function AdminSettingsTab() {
  const [baseFee, setBaseFee] = useState('50')
  const [perKmFee, setPerKmFee] = useState('20')
  const [dispatchRadius, setDispatchRadius] = useState('5.0')
  const [commissionRate, setCommissionRate] = useState('12.5')
  const [autoCancelMins, setAutoCancelMins] = useState('15')
  const [isLive, setIsLive] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="m-0 text-lg font-bold text-[var(--ink)]">Platform System Settings</h2>
        <p className="m-0 text-xs text-stone-500">
          Configure algorithms, fee computation parameters, and global operational rules
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Haversine & Delivery Fee Computation */}
        <div className="rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-[var(--red)]">
              <MapPin size={20} />
            </span>
            <div>
              <h3 className="m-0 text-base font-bold text-[var(--ink)]">
                Delivery Pricing & Haversine Formula
              </h3>
              <p className="m-0 text-xs text-stone-500">
                Formula: Total Fee = Base Fee + (Distance in KM × Per KM Rate)
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-stone-700">
                Base Delivery Fee (Rs)
              </label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  Rs
                </span>
                <input
                  type="number"
                  value={baseFee}
                  onChange={(e) => setBaseFee(e.target.value)}
                  className="h-10 w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-xs font-bold text-[var(--ink)] focus:border-[var(--red)] focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-stone-400">Fixed starting fare for every delivery</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700">
                Per-Kilometer Distance Rate (Rs/km)
              </label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  Rs
                </span>
                <input
                  type="number"
                  value={perKmFee}
                  onChange={(e) => setPerKmFee(e.target.value)}
                  className="h-10 w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-xs font-bold text-[var(--ink)] focus:border-[var(--red)] focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-stone-400">Added per kilometer computed via Haversine</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700">
                Nearest Rider Search Radius (KM)
              </label>
              <input
                type="number"
                step="0.5"
                value={dispatchRadius}
                onChange={(e) => setDispatchRadius(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-[var(--ink)] focus:border-[var(--red)] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-stone-400">Maximum range when order reaches READY state</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700">
                Auto-Cancel Timeout (Minutes)
              </label>
              <input
                type="number"
                value={autoCancelMins}
                onChange={(e) => setAutoCancelMins(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-[var(--ink)] focus:border-[var(--red)] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-stone-400">
                Auto-cancel if restaurant does not accept within X mins
              </p>
            </div>
          </div>
        </div>

        {/* Business & Operations */}
        <div className="rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-700">
              <Sliders size={20} />
            </span>
            <div>
              <h3 className="m-0 text-base font-bold text-[var(--ink)]">Platform Operations & Revenue</h3>
              <p className="m-0 text-xs text-stone-500">Take-rate commission and platform uptime controls</p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-stone-700">
                Restaurant Commission Rate (%)
              </label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-stone-200 bg-white pr-9 pl-3 text-xs font-bold text-[var(--ink)] focus:border-[var(--red)] focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  %
                </span>
              </div>
              <p className="mt-1 text-[11px] text-stone-400">Standard platform commission on restaurant subtotal</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700">Platform Operational Status</label>
              <div className="mt-1.5 flex items-center justify-between rounded-xl border border-stone-200 p-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}
                  />
                  <span className="text-xs font-bold text-[var(--ink)]">
                    {isLive ? 'Live & Accepting Orders' : 'Maintenance Mode'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLive(!isLive)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                    isLive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  {isLive ? 'Pause Platform' : 'Resume Live'}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-stone-400">Toggling maintenance pauses customer checkout</p>
            </div>
          </div>
        </div>

        {/* Action feedback & Save button */}
        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <Check size={14} /> Configuration saved successfully
            </span>
          ) : (
            <span className="text-xs text-stone-400">Changes take effect immediately on next order</span>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-[var(--red)] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#b83b20] transition-colors cursor-pointer"
          >
            <Save size={16} /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  )
}
