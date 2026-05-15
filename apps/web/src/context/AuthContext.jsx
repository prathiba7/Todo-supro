import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null)
  const [token, setTokenState] = useState(null)
  const [loading, setLoading] = useState(true) // true while reading localStorage

  // On first render — restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('supro_token')
    const savedUser  = localStorage.getItem('supro_user')
    if (savedToken && savedUser) {
      try {
        setTokenState(savedToken)
        setUserState(JSON.parse(savedUser))
      } catch {
        // Corrupted data — clear it
        localStorage.removeItem('supro_token')
        localStorage.removeItem('supro_user')
      }
    }
    setLoading(false) // Done — ProtectedRoute can now make its decision
  }, [])

  // Always sync to localStorage when state changes
  const setToken = (t) => {
    setTokenState(t)
    t ? localStorage.setItem('supro_token', t)
      : localStorage.removeItem('supro_token')
  }

  const setUser = (u) => {
    setUserState(u)
    u ? localStorage.setItem('supro_user', JSON.stringify(u))
      : localStorage.removeItem('supro_user')
  }

   const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, setToken, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — import and call this in any component
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>')
  return ctx
}