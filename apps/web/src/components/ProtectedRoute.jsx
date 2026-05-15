// apps/web/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()

  // Wait for localStorage to be read before deciding
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#020617',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ color: '#475569', fontSize: 13 }}>Loading Supro...</span>
      </div>
    )
  }

  // No token → go to login (replace so back button doesn't loop)
  if (!token) return <Navigate to="/login" replace />

  // Token exists → render the actual page
  return children
}