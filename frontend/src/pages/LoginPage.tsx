import type { Route } from '../App'
import { AuthCard } from '../components/auth/AuthCard'

export function LoginPage({ navigate }: { navigate: (to: Route) => void }) {
  return (
    <AuthCard
      mode="login"
      navigate={navigate}
      onSuccess={() => navigate('/')}
    />
  )
}
