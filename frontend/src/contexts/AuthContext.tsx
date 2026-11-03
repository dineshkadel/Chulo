import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '../types/user'
import { getAccessToken, clearTokens, setTokens } from '../api/client'
import { getMe, logout as apiLogout } from '../api/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (accessToken: string, refreshToken?: string, userData?: User) => void
  logout: () => void
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAccessToken())
  const [user, setUser] = useState<User | null>(null)
  // Only loading if there is a saved token to check.
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getAccessToken()))

  useEffect(() => {
    const currentToken = getAccessToken()
    if (!currentToken) return

    let active = true
    getMe()
      .then((userData) => {
        if (active) {
          setUser(userData)
          setToken(currentToken)
        }
      })
      .catch(() => {
        if (active) {
          clearTokens()
          setUser(null)
          setToken(null)
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = (accessToken: string, refreshToken?: string, userData?: User) => {
    setTokens(accessToken, refreshToken)
    setToken(accessToken)
    if (userData) {
      setUser(userData)
    } else {
      getMe().then(setUser).catch(() => {})
    }
  }

  const logout = () => {
    apiLogout()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}