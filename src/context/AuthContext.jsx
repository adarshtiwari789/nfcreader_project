import { createContext, useContext, useState, useEffect } from 'react'
import { api, setAuthToken } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = async () => {
    try {
      const res = await api.getMe()
      if (res?.data) {
        setUser(res.data.user)
        setWallet(res.data.wallet)
      }
      return res?.data
    } catch (err) {
      // ONLY clear session if server explicitly returns 401 Unauthorized
      if (err?.status === 401) {
        setUser(null)
        setWallet(null)
        setAuthToken(null)
      }
      return null
    }
  }

  useEffect(() => {
    refreshSession().finally(() => {
      setLoading(false)
    })
  }, [])

  const login = async (credentials) => {
    const res = await api.login(credentials)
    if (res?.data) {
      if (res.data.token) {
        setAuthToken(res.data.token)
      }
      setUser(res.data.user)
      setWallet(res.data.wallet)
    }
    return res
  }

  const register = async (userData) => {
    const res = await api.register(userData)
    if (res?.data) {
      if (res.data.token) {
        setAuthToken(res.data.token)
      }
      setUser(res.data.user)
      setWallet(res.data.wallet)
    }
    return res
  }

  const logout = async () => {
    try {
      await api.logout()
    } finally {
      setAuthToken(null)
      setUser(null)
      setWallet(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        loading,
        login,
        register,
        logout,
        setWallet,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
