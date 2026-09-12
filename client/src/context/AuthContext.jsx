import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('fileforge_user') || 'null'))
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('fileforge_token')))

  useEffect(() => {
    if (!loading) return
    api.get('/auth/profile')
      .then(({ data }) => {
        setUser(data.user)
        localStorage.setItem('fileforge_user', JSON.stringify(data.user))
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [loading])

  const saveSession = useCallback(data => {
    localStorage.setItem('fileforge_token', data.token)
    localStorage.setItem('fileforge_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const login = useCallback(async payload => {
    const { data } = await api.post('/auth/login', payload)
    return saveSession(data)
  }, [saveSession])

  const register = useCallback(async payload => {
    const { data } = await api.post('/auth/register', payload)
    return saveSession(data)
  }, [saveSession])

  const googleLogin = useCallback(async credential => {
    const { data } = await api.post('/auth/google', { credential })
    return saveSession(data)
  }, [saveSession])

  const logout = useCallback(() => {
    localStorage.removeItem('fileforge_token')
    localStorage.removeItem('fileforge_user')
    window.google?.accounts?.id?.disableAutoSelect()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, googleLogin, logout }), [user, loading, login, register, googleLogin, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
