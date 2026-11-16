import { useEffect, useState, type FormEvent } from 'react'
import { Camera, Check, ExternalLink, Link2, MapPin, Phone, Store, Trash2 } from 'lucide-react'
import {
  getRestaurantMe,
  updateRestaurantMe,
  uploadRestaurantProfileImage,
  type RestaurantProfile,
  type RestaurantProfileUpdatePayload,
} from '../../api/restaurantApi'

type Status = { kind: 'success' | 'error'; text: string } | null

const inputClass =
  'w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm font-normal text-[var(--ink)] outline-none transition-colors placeholder:text-stone-400 focus:border-[var(--red)] focus:ring-2 focus:ring-[var(--red)]/15'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-[var(--ink)]">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-stone-500">{hint}</span>}
    </label>
  )
}

function LocationMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const valid =
    Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  if (!valid) {
    return (
      <p className="m-0 rounded-lg bg-stone-50 p-4 text-sm text-stone-500">
        No location is set for this restaurant yet.
      </p>
    )
  }

  const d = 0.004
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`
  const fullUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-stone-200">
        <iframe
          title={`Map showing the location of ${name || 'your restaurant'}`}
          src={embedUrl}
          loading="lazy"
          className="block h-64 w-full border-0"
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
        <span>
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
        <a
          href={fullUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-[var(--red)] no-underline hover:underline"
        >
          Open in OpenStreetMap <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}

export function RestaurantSettings({
  onProfileUpdate,
}: {
  onProfileUpdate: (profile: RestaurantProfile) => void
}) {
  const [profile, setProfile] = useState<RestaurantProfile | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus] = useState<Status>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    getRestaurantMe()
      .then((data) => {
        setProfile(data)
        setName(data.name)
        setAddress(data.address ?? '')
        setPhone(data.phone ?? '')
        setDescription(data.description ?? '')
        setImageUrl(data.hero_image_url ?? '')
      })
      .catch((error: unknown) => {
        setLoadFailed(true)
        setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Could not load profile' })
      })
  }, [])

  const dirty =
    !!profile &&
    (name !== profile.name ||
      address !== (profile.address ?? '') ||
      phone !== (profile.phone ?? '') ||
      description !== (profile.description ?? '') ||
      imageUrl !== (profile.hero_image_url ?? ''))

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!profile) return
    setSaving(true)
    setStatus(null)
    try {
      const payload: RestaurantProfileUpdatePayload = {
        name,
        address,
        phone,
        description,
        hero_image_url: imageUrl || undefined,
        cuisine_types: profile.cuisine_types,
        price_tier: profile.price_tier,
        lat: profile.lat,
        lng: profile.lng,
      }
      const updated = await updateRestaurantMe(payload)
      setProfile(updated)
      onProfileUpdate(updated)
      setStatus({ kind: 'success', text: 'Changes saved.' })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Could not save profile' })
    } finally {
      setSaving(false)
    }
  }

  async function upload(file: File | null) {
    if (!file) return
    setUploading(true)
    setStatus(null)
    try {
      const updated = await uploadRestaurantProfileImage(file)
      setProfile(updated)
      setImageUrl(updated.hero_image_url ?? '')
      onProfileUpdate(updated)
      setStatus({ kind: 'success', text: 'Photo updated.' })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Could not upload image' })
    } finally {
      setUploading(false)
    }
  }

  if (!profile && !loadFailed) {
    return <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">Loading profile…</div>
  }

  return (
    <div>
      <h1 className="m-0 font-[family-name:var(--display)] text-3xl leading-tight text-[var(--ink)]">Settings</h1>
      <p className="m-0 mt-1 text-sm text-stone-500">Manage how your restaurant appears to customers.</p>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={save} className="rounded-2xl border border-stone-200 bg-white">
          {/* Photo */}
          <section className="flex flex-wrap items-center gap-4 border-b border-stone-200 p-6">
            {imageUrl ? (
              <img src={imageUrl} alt="Restaurant" className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-xl bg-[var(--sand)] text-[var(--red)]">
                <Store size={28} aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="m-0 text-base font-bold text-[var(--ink)]">Profile photo</h2>
              <p className="m-0 mt-0.5 text-xs text-stone-500">JPG, PNG or WebP.</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold transition-colors hover:bg-stone-50 focus-within:ring-2 focus-within:ring-[var(--red)]/30">
                  <Camera size={15} aria-hidden="true" />
                  {uploading ? 'Uploading…' : imageUrl ? 'Change photo' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    onChange={(event) => {
                      void upload(event.target.files?.[0] ?? null)
                      event.target.value = ''
                    }}
                    className="sr"
                  />
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-3 text-sm font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-[var(--red)]"
                  >
                    <Trash2 size={15} aria-hidden="true" /> Remove
                  </button>
                )}
              </div>
            </div>
            <details className="w-full text-sm">
              <summary className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-stone-600 hover:text-[var(--ink)]">
                <Link2 size={14} aria-hidden="true" /> Use an image link instead
              </summary>
              <div className="mt-3">
                <input
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://"
                  inputMode="url"
                  aria-label="Image URL"
                  className={inputClass}
                />
              </div>
            </details>
          </section>

          {/* Details */}
          <section className="grid gap-5 p-6">
            <div>
              <h2 className="m-0 text-base font-bold text-[var(--ink)]">Business details</h2>
              <p className="m-0 mt-0.5 text-xs text-stone-500">Shown on your public restaurant page.</p>
            </div>

            <Field label="Restaurant name">
              <input required value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Phone">
                <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" className={inputClass} />
              </Field>
              <Field label="Address">
                <input value={address} onChange={(event) => setAddress(event.target.value)} className={inputClass} />
              </Field>
            </div>

            <Field label="Description" hint="A short introduction to your food and atmosphere.">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className={`${inputClass} resize-y`}
              />
            </Field>
          </section>

          {/* Location */}
          {profile && (
            <section className="grid gap-3 border-t border-stone-200 p-6">
              <div>
                <h2 className="m-0 text-base font-bold text-[var(--ink)]">Location</h2>
                <p className="m-0 mt-0.5 text-xs text-stone-500">Where customers and riders find you on the map.</p>
              </div>
              <LocationMap lat={profile.lat} lng={profile.lng} name={profile.name} />
            </section>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-stone-200 bg-stone-50/70 px-6 py-4">
            <p
              role="status"
              className={`m-0 text-sm ${status?.kind === 'error' ? 'font-semibold text-red-700' : 'text-emerald-700'}`}
            >
              {status?.text ?? (dirty ? 'You have unsaved changes.' : '')}
            </p>
            <button
              disabled={saving || !dirty}
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border-0 bg-[var(--red)] px-5 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={16} aria-hidden="true" />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        {/* Live preview */}
        <aside aria-label="Profile preview" className="overflow-hidden rounded-2xl border border-stone-200 bg-white lg:sticky lg:top-24">
          <div className="grid h-40 place-items-center bg-[var(--sand)] text-[var(--red)]">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Store size={36} aria-hidden="true" />
            )}
          </div>
          <div className="p-5">
            <p className="m-0 text-xs font-semibold text-stone-500">Preview</p>
            <h3 className="m-0 mt-1 font-[family-name:var(--display)] text-xl leading-tight text-[var(--ink)]">
              {name || 'Restaurant name'}
            </h3>
            {description && <p className="m-0 mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">{description}</p>}
            <ul className="m-0 mt-4 grid list-none gap-2 p-0 text-sm text-stone-600">
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[var(--red)]" aria-hidden="true" />
                  <span className="min-w-0 break-words">{address}</span>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2">
                  <Phone size={15} className="shrink-0 text-[var(--red)]" aria-hidden="true" />
                  <span>{phone}</span>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}