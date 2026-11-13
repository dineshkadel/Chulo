import { useEffect, useState } from 'react'
import { Footer, Navbar } from './components/layout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { RestaurantListPage } from './pages/RestaurantListPage'
import { RestaurantDetailPage } from './pages/RestaurantDetailPage'
import { MenuItemDetailPage } from './pages/MenuItemDetailPage'
import { RestaurantAuthPage, RestaurantDashboardPage } from './pages/restaurant'
import { AuthProvider, CartProvider, LocationProvider, ThemeProvider } from './contexts'
import { useAuth } from './hooks/useAuth'
import './App.css'

export type Route = '/' | '/login' | '/register' | '/profile' | '/restaurant' | `/restaurant/${number}` | `/restaurant/${number}/menu/${number}` | '/vendor/login' | '/vendor/register' | '/vendor/dashboard'
const routeFor = (path: string): Route =>
  path === '/login' || path === '/register' || path === '/profile' ||
  path === '/restaurant' || path === '/vendor/login' || path === '/vendor/register' || path === '/vendor/dashboard'
    ? path
    : /^\/restaurant\/\d+(?:\/menu\/\d+)?$/.test(path) ? path as Route : '/'

export default function App() {
  return (
    <ThemeProvider>
      <LocationProvider>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </LocationProvider>
    </ThemeProvider>
  )
}

function AppRoutes() {
  const [route, setRoute] = useState<Route>(() => routeFor(window.location.pathname))
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    const pop = () => setRoute(routeFor(window.location.pathname))
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])

  const navigate = (to: Route, replace = false) => {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', to)
    setRoute(to)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const authPage = route === '/login' || route === '/register'
  const vendorPortalPage = route.startsWith('/vendor/')
  const menuMatch = route.match(/^\/restaurant\/(\d+)\/menu\/(\d+)$/)
  const restaurantMatch = route.match(/^\/restaurant\/(\d+)$/)

  useEffect(() => {
    if (authPage && !isLoading && isAuthenticated) {
      navigate('/', true)
    }
  }, [authPage, isAuthenticated, isLoading])

  if (authPage && (isLoading || isAuthenticated)) return null

  if (vendorPortalPage) {
    if (route === '/vendor/register') return <RestaurantAuthPage mode="register" navigate={navigate} />
    if (route === '/vendor/login') return <RestaurantAuthPage mode="login" navigate={navigate} />
    return <RestaurantDashboardPage navigate={navigate} />
  }

  return (
    <div className="app-shell">
      <Navbar navigate={navigate} compact={authPage} />
      {route === '/' && <HomePage navigate={navigate} />}
      {route === '/restaurant' && <RestaurantListPage navigate={navigate} />}
      {restaurantMatch && <RestaurantDetailPage restaurantId={Number(restaurantMatch[1])} />}
      {menuMatch && <MenuItemDetailPage restaurantId={Number(menuMatch[1])} menuItemId={Number(menuMatch[2])} />}
      {route === '/login' && <LoginPage navigate={navigate} />}
      {route === '/register' && <RegisterPage navigate={navigate} />}
      {route === '/profile' && <ProfilePage navigate={navigate} />}
      {!authPage && <Footer navigate={navigate} />}
    </div>
  )
}
