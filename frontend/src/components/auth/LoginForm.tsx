import type { Route } from '../../App'
import { AuthCard } from './AuthCard'

export function LoginForm({
  onSuccess,
  navigate,
}: {
  onSuccess?: () => void
  navigate?: (to: Route) => void
}) {
  return <AuthCard mode="login" onSuccess={onSuccess} navigate={navigate} />
}
