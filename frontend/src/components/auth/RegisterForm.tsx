import type { Route } from '../../App'
import { AuthCard } from './AuthCard'

export function RegisterForm({
  onSuccess,
  navigate,
}: {
  onSuccess?: (registeredEmail?: string) => void
  navigate?: (to: Route) => void
}) {
  return <AuthCard mode="register" onSuccess={onSuccess} navigate={navigate} />
}
