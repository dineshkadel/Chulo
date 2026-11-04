import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, MapPin, Store } from 'lucide-react'
import type { Route } from '../../App'
import { loginRestaurant, registerRestaurant, saveRestaurantSession } from '../../api/restaurantAuth'
import { LocationPicker, type Coordinates } from '../../components/restaurant/LocationPicker'

// types and constraints
type AuthMode = 'login' | 'register'

type FormValues = {
  name: string
  email: string
  password: string
  phone: string
  address: string
  description: string
  cuisine: string
  priceTier: number
  coordinates: Coordinates
}

type FieldChange = <K extends keyof FormValues>(field: K, value: FormValues[K]) => void

type Props = { mode: AuthMode; navigate: (to: Route) => void }

const defaultLocation = { lat: 27.7172, lng: 85.324 }

const initialValues: FormValues = {
  name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  description: '',
  cuisine: '',
  priceTier: 2,
  coordinates: defaultLocation,
}

const inputClass = 'rounded-lg border border-stone-300 px-3 py-3 font-normal'

// form logic
function useRestaurantAuthForm(mode: AuthMode, navigate: (to: Route) => void) {
  const registering = mode === 'register'
  const [values, setValues] = useState<FormValues>(initialValues)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already signed in -> skip the auth page
  useEffect(() => {
    if (localStorage.getItem('restaurant_access_token')) navigate('/vendor/dashboard')
  }, [navigate])

  const onChange: FieldChange = (field, value) =>
    setValues((prev) => ({ ...prev, [field]: value }))

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const session = registering
        ? await registerRestaurant({
            name: values.name,
            email: values.email,
            password: values.password,
            phone: values.phone,
            address: values.address,
            description: values.description,
            cuisine_types: values.cuisine,
            price_tier: values.priceTier,
            lat: values.coordinates.lat,
            lng: values.coordinates.lng,
          })
        : await loginRestaurant(values.email, values.password)
      saveRestaurantSession(session)
      navigate('/vendor/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return { registering, values, onChange, error, submitting, submit }
}


function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-bold">
      {label}
      {children}
    </label>
  )
}

// components modules
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mx-auto flex max-w-6xl items-center gap-2 border-0 bg-transparent text-sm font-bold text-stone-600 hover:text-[var(--red)]"
    >
      <ArrowLeft size={16} /> Back to Chulo
    </button>
  )
}

function AuthHero() {
  return (
    <section className="bg-[var(--red)] p-8 text-white sm:p-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15"><Store /></div>
      <p className="mt-10 text-xs font-bold uppercase tracking-[.2em] text-orange-100">Chulo for restaurants</p>
      <h1 className="mt-3 font-[family-name:var(--display)] text-4xl leading-tight sm:text-5xl">Grow your local food business.</h1>
      <p className="mt-5 max-w-md leading-7 text-orange-50">
        Manage your menu, receive orders, and connect with hungry customers nearby from one simple portal.
      </p>
      <div className="mt-10 rounded-2xl border border-white/20 bg-white/10 p-5 text-sm leading-6">
        <MapPin className="mb-2" size={20} /> A precise map pin helps customers and delivery partners find your kitchen.
      </div>
    </section>
  )
}

function AuthHeader({ registering }: { registering: boolean }) {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--red)]">Restaurant portal</p>
      <h2 className="mt-2 font-[family-name:var(--display)] text-3xl">{registering ? 'List your restaurant' : 'Welcome back'}</h2>
      <p className="mt-2 text-sm text-stone-500">
        {registering ? 'Tell us about your restaurant to get started.' : 'Sign in to manage your restaurant.'}
      </p>
    </>
  )
}

function CredentialFields({ registering, values, onChange }: { registering: boolean; values: FormValues; onChange: FieldChange }) {
  return (
    <>
      {registering && (
        <FormField label="Restaurant name">
          <input required minLength={2} value={values.name} onChange={(e) => onChange('name', e.target.value)} className={inputClass} placeholder="e.g. Momo House" />
        </FormField>
      )}

      <div className={registering ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4'}>
        <FormField label="Email">
          <input required type="email" value={values.email} onChange={(e) => onChange('email', e.target.value)} className={inputClass} placeholder="owner@restaurant.com" />
        </FormField>
        {registering && (
          <FormField label="Phone">
            <input value={values.phone} onChange={(e) => onChange('phone', e.target.value)} className={inputClass} placeholder="98XXXXXXXX" />
          </FormField>
        )}
      </div>

      <FormField label="Password">
        <input required type="password" minLength={8} value={values.password} onChange={(e) => onChange('password', e.target.value)} className={inputClass} placeholder="At least 8 characters" />
      </FormField>
    </>
  )
}

function RestaurantDetailsFields({ values, onChange }: { values: FormValues; onChange: FieldChange }) {
  return (
    <>
      <FormField label="Street address">
        <input required value={values.address} onChange={(e) => onChange('address', e.target.value)} className={inputClass} placeholder="Street, neighbourhood, city" />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Cuisine types">
          <input value={values.cuisine} onChange={(e) => onChange('cuisine', e.target.value)} className={inputClass} placeholder="Nepali, Indian" />
        </FormField>
        <FormField label="Price tier">
          <select value={values.priceTier} onChange={(e) => onChange('priceTier', Number(e.target.value))} className={inputClass}>
            <option value={1}>$ Budget</option>
            <option value={2}>$$ Moderate</option>
            <option value={3}>$$$ Premium</option>
            <option value={4}>$$$$ Fine dining</option>
          </select>
        </FormField>
      </div>

      <FormField label="Short description">
        <textarea value={values.description} onChange={(e) => onChange('description', e.target.value)} className={`min-h-20 ${inputClass}`} placeholder="What makes your restaurant special?" />
      </FormField>
    </>
  )
}

function LocationField({ coordinates, onChange }: { coordinates: Coordinates; onChange: (c: Coordinates) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold">Pin your location</p>
      <LocationPicker coordinates={coordinates} onChange={onChange} />
    </div>
  )
}

function FormError({ message }: { message: string }) {
  if (!message) return null
  return (
    <p className="m-0 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
      {message}
    </p>
  )
}

function SubmitButton({ registering, submitting }: { registering: boolean; submitting: boolean }) {
  const label = submitting ? 'Please wait…' : registering ? 'Create restaurant account' : 'Sign in to portal'
  return (
    <button disabled={submitting} className="mt-2 rounded-lg bg-[var(--red)] px-5 py-3.5 font-bold text-white disabled:opacity-60">
      {label}
    </button>
  )
}

function AuthModeSwitch({ registering, onSwitch }: { registering: boolean; onSwitch: () => void }) {
  return (
    <p className="mt-6 text-center text-sm text-stone-600">
      {registering ? 'Already registered?' : 'New to Chulo for Restaurants?'}{' '}
      <button type="button" onClick={onSwitch} className="border-0 bg-transparent p-0 font-bold text-[var(--red)]">
        {registering ? 'Sign in' : 'Create an account'}
      </button>
    </p>
  )
}

// combine page
export function RestaurantAuthPage({ mode, navigate }: Props) {
  const { registering, values, onChange, error, submitting, submit } = useRestaurantAuthForm(mode, navigate)

  return (
    <main className="min-h-screen bg-[#fffaf4] px-4 py-8 sm:px-8">
      <BackButton onClick={() => navigate('/')} />

      <div className="mx-auto mt-6 grid max-w-6xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl shadow-orange-950/10 lg:grid-cols-[.85fr_1.15fr]">
        <AuthHero />

        <section className="p-6 sm:p-10">
          <AuthHeader registering={registering} />

          <form className="mt-7 grid gap-4" onSubmit={submit}>
            <CredentialFields registering={registering} values={values} onChange={onChange} />

            {registering && (
              <>
                <RestaurantDetailsFields values={values} onChange={onChange} />
                <LocationField coordinates={values.coordinates} onChange={(c) => onChange('coordinates', c)} />
              </>
            )}

            <FormError message={error} />
            <SubmitButton registering={registering} submitting={submitting} />
          </form>

          <AuthModeSwitch
            registering={registering}
            onSwitch={() => navigate(registering ? '/vendor/login' : '/vendor/register')}
          />
        </section>
      </div>
    </main>
  )
}