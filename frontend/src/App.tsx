import { useEffect, useState } from 'react'
import { Footer, Navbar } from './components/layout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { RestaurantListPage } from './pages/RestaurantListPage'
import { RestaurantDetailPage } from './pages/RestaurantDetailPage'
import { MenuItemDetailPage } from './pages/MenuItemDetailPage'
import { ExplorePage } from './pages/ExplorePage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { RestaurantAuthPage, RestaurantDashboardPage } from './pages/restaurant'
import { AuthProvider, CartProvider, LocationProvider, ThemeProvider } from './contexts'
import { useAuth } from './hooks/useAuth'
import './App.css'

export type Route = '/' | '/explore' | '/login' | '/register' | '/profile' | '/admin' | '/restaurant' | `/restaurant/${number}` | `/restaurant/${number}/menu/${number}` | '/vendor/login' | '/vendor/register' | '/vendor/dashboard' | '/vendor/orders' | '/vendor/menu' | '/vendor/reviews' | '/vendor/settings'
const routeFor = (path: string): Route =>
  path === '/login' || path === '/register' || path === '/profile' ||
  path === '/explore' || path === '/restaurant' || path === '/admin' || path === '/vendor/login' || path === '/vendor/register' ||
  path === '/vendor/dashboard' || path === '/vendor/orders' || path === '/vendor/menu' || path === '/vendor/reviews' || path === '/vendor/settings'
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
  const { isAuthenticated, isLoading, user } = useAuth()

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
  const menuMatch = route.match(/^\/restaurant\/(\d+)\/menu\/(\d+)$/)
  const restaurantMatch = route.match(/^\/restaurant\/(\d+)$/)

  useEffect(() => {
    if (authPage && !isLoading && isAuthenticated) {
      navigate(user?.roles.includes('admin') ? '/admin' : '/', true)
    }
  }, [authPage, isAuthenticated, isLoading, user])

  if (authPage && (isLoading || isAuthenticated)) return null

  if (route === '/vendor/register') return <RestaurantAuthPage mode="register" navigate={navigate} />
  if (route === '/vendor/login') return <RestaurantAuthPage mode="login" navigate={navigate} />
  if (
    route === '/vendor/dashboard' || route === '/vendor/orders' || route === '/vendor/menu' ||
    route === '/vendor/reviews' || route === '/vendor/settings'
  ) return <RestaurantDashboardPage route={route} navigate={navigate} />
  if (route === '/admin') return <AdminDashboardPage navigate={navigate} />

  return (
    <div className="app-shell">
      <Navbar navigate={navigate} compact={authPage} />
      {route === '/' && <HomePage navigate={navigate} />}
      {route === '/explore' && <ExplorePage />}
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
