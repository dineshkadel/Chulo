import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { Eye, EyeOff, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react'
import type { Route } from '../../App'
import { useAuth } from '../../hooks/useAuth'
import type { User } from '../../types/user'

const AUTH_IMAGE = '/images/auth.jpg'
const AUTH_SLOGAN = 'Good food, your way.'

type AuthPayload = {
  user: User
  active_role: string
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

type ApiEnvelope = {
  data?: AuthPayload
  error?: { message?: string; detail?: string; code?: string }
}

const inputClass =
  'w-full py-3 bg-white border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20 transition-all'

const serif = { fontFamily: "'Playfair Display', Georgia, serif" }

export function AuthCard({
  mode,
  navigate,
  onSuccess,
}: {
  mode: 'login' | 'register'
  navigate?: (to: Route) => void
  onSuccess?: (registeredEmail?: string) => void
}) {
  const registering = mode === 'register'
  const { login } = useAuth()

  const [form, setForm] = useState(() => ({
    name: '',
    email: !registering ? sessionStorage.getItem('chulo_registered_email') ?? '' : '',
    phone: '',
    password: '',
  }))
  const [successNotice, setSuccessNotice] = useState(() =>
    !registering ? sessionStorage.getItem('chulo_auth_notice') ?? '' : '',
  )
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [lastMode, setLastMode] = useState(mode)
  if (mode !== lastMode) {
    setLastMode(mode)
    setErrorMessage('')
    setShowPassword(false)
    setForm((prev) => ({ ...prev, password: '' }))
    if (mode === 'register') setSuccessNotice('')
  }

  useEffect(() => {
    sessionStorage.removeItem('chulo_auth_notice')
    sessionStorage.removeItem('chulo_registered_email')
  }, [registering])

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [key]: e.target.value })
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessNotice('')

    if (registering) {
      if (form.password.length < 8 || form.password.length > 16) {
        setErrorMessage('Your password needs to be 8 to 16 characters long.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            password: form.password,
          }),
        })

        const result: ApiEnvelope = await response.json().catch(() => ({}))

        if (!response.ok || !result.data) {
          throw new Error(
            result.error?.detail ||
              result.error?.message ||
              "We couldn't create your account. Please check your details and try again.",
          )
        }

        if (onSuccess) {
          onSuccess(form.email.trim())
        } else if (navigate) {
          const email = form.email.trim()
          const notice = 'Your account is ready. Sign in to get started.'
          sessionStorage.setItem('chulo_registered_email', email)
          sessionStorage.setItem('chulo_auth_notice', notice)
          setForm((prev) => ({ ...prev, email }))
          setSuccessNotice(notice)
          navigate('/login')
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    } else {
      try {
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email.trim(), password: form.password }),
        })

        const result: ApiEnvelope = await response.json().catch(() => ({}))

        if (!response.ok || !result.data) {
          throw new Error(
            result.error?.detail ||
              result.error?.message ||
              'That email or password is not right. Please try again.',
          )
        }

        localStorage.setItem('access_token', result.data.access_token)
        localStorage.setItem('refresh_token', result.data.refresh_token)
        localStorage.setItem('token', result.data.access_token)

        login(result.data.access_token, result.data.refresh_token, result.data.user)

        if (onSuccess) {
          onSuccess()
        } else if (navigate) {
          navigate('/')
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const goToRoute = (route: Route) => {
    if (navigate) {
      navigate(route)
    } else {
      window.location.pathname = route
    }
  }

  return (
  <div className="min-h-screen flex flex-row-reverse items-stretch">
      {/* Form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 bg-[var(--cream)]">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[var(--ink)] tracking-tight" style={serif}>
              {registering ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1.5">
              {registering
                ? 'It only takes a minute. You will sign in right after.'
                : 'Enter your email and password to continue.'}
            </p>
          </div>

          {successNotice && !registering && (
            <div
              role="status"
              className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-start gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600 shrink-0 mt-0.5" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <div>
                <p className="font-bold mb-0.5">You're all set</p>
                <p className="text-xs text-emerald-700 m-0 leading-relaxed">{successNotice}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {registering && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                    <UserRound size={16} aria-hidden="true" />
                  </span>
                  <input
                    id="auth-name"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={update('name')}
                    className={`${inputClass} pl-10 pr-4`}
                  />
                </div>
              </div>
            )}

            <div className={registering ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
              <div>
                <label htmlFor="auth-email" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                    <Mail size={15} aria-hidden="true" />
                  </span>
                  <input
                    id="auth-email"
                    required
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update('email')}
                    className={`${inputClass} pl-10 pr-3`}
                  />
                </div>
              </div>

              {registering && (
                <div>
                  <label htmlFor="auth-phone" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                    Phone <span className="font-normal text-[var(--muted)]">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                      <Phone size={15} aria-hidden="true" />
                    </span>
                    <input
                      id="auth-phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      className={`${inputClass} pl-10 pr-3`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="block text-xs font-bold text-[var(--ink)]">
                  Password
                </label>
                {registering ? (
                  <span className="text-[11px] text-[var(--muted)]">Use 8 to 16 characters</span>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-[var(--red)] hover:underline bg-transparent border-0 p-0 cursor-pointer"
                  >
                    Forgot password
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                  <ShieldCheck size={15} aria-hidden="true" />
                </span>
                <input
                  id="auth-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={registering ? 'new-password' : 'current-password'}
                  minLength={registering ? 8 : undefined}
                  maxLength={registering ? 16 : undefined}
                  value={form.password}
                  onChange={update('password')}
                  className={`${inputClass} pl-10 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] bg-transparent border-0 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} aria-label="Hide password" /> : <Eye size={16} aria-label="Show password" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 mt-2 rounded-xl bg-[var(--red)] hover:bg-[#b83b20] active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all duration-200 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{registering ? 'Creating your account…' : 'Signing you in…'}</span>
                </>
              ) : (
                <span>{registering ? 'Create account' : 'Sign in'}</span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[var(--muted)]">
            {registering ? 'Already have an account?' : 'New to Chulo?'}{' '}
            <button
              type="button"
              onClick={() => goToRoute(registering ? '/login' : '/register')}
              className="font-bold text-[var(--red)] hover:underline bg-transparent border-0 p-0 cursor-pointer"
            >
              {registering ? 'Sign in' : 'Create an account'}
            </button>
          </p>

          {registering && (
            <div className="mt-8 p-4 rounded-xl border border-[var(--line)] bg-[var(--sand)]/40 flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-[var(--ink)] m-0">Run a restaurant?</p>
                <p className="text-[var(--muted)] m-0">Sell to hungry customers near you.</p>
              </div>
              <a href="#partner" className="shrink-0 font-bold text-[var(--red)] hover:underline">
                Partner with us
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Image panel (hidden on small screens) */}
      <div className="hidden lg:block lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[var(--red)] to-[hsl(14_75%_30%)]">
        <img
          src={AUTH_IMAGE}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <p
          className="absolute bottom-12 left-12 right-12 text-4xl font-black leading-tight text-white"
          style={serif}
        >
          {AUTH_SLOGAN}
        </p>
      </div>
    </div>
  )
}