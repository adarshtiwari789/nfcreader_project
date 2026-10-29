import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api'

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
    } catch {
      setUser(null)
      setWallet(null)
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
      setUser(res.data.user)
      setWallet(res.data.wallet)
    }
    return res
  }

  const register = async (userData) => {
    const res = await api.register(userData)
    if (res?.data) {
      setUser(res.data.user)
      setWallet(res.data.wallet)
    }
    return res
  }

  const logout = async () => {
    try {
      await api.logout()
    } finally {
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
