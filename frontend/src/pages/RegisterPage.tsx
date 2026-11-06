import type { Route } from '../App'
import { AuthCard } from '../components/auth/AuthCard'

export function RegisterPage({ navigate }: { navigate: (to: Route) => void }) {
  return (
    <AuthCard
      mode="register"
      navigate={navigate}
      onSuccess={(registeredEmail) => {
        if (registeredEmail) {
          sessionStorage.setItem('chulo_registered_email', registeredEmail)
        }
        sessionStorage.setItem(
          'chulo_auth_notice',
          'Account created successfully! Please login.'
        )
        navigate('/login')
      }}
    />
  )
}
