import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import ProtectedRoute    from './components/ProtectedRoute'
import Login             from './pages/auth/Login'
import Register          from './pages/auth/Register'
import Dashboard         from './pages/Dashboard'  // ← the new real import
import Tasks             from './pages/Tasks'
import Goals             from './pages/Goals'
import Hard75 from './pages/Hard75'

const Placeholder = ({ name }) => (
  <div style={{ minHeight:'100vh', background:'#020617', display:'flex',
    alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
    <div style={{ fontSize:22, fontWeight:500, color:'#fff' }}>{name}</div>
    <div style={{ fontSize:13, color:'#475569' }}>Coming soon!</div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard is now the real component */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          }/>
          <Route path="/tasks" element={
            <ProtectedRoute><Tasks/><Placeholder name="Tasks" /></ProtectedRoute>
          }/>
          <Route path="/goals" element={
            <ProtectedRoute><Goals/><Placeholder name="Goals" /></ProtectedRoute>
          }/>
          <Route path="/75hard" element={
            <ProtectedRoute><Hard75/><Placeholder name="75 Hard Tracker" /></ProtectedRoute>
          }/>

          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
