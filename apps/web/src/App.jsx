import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import ProtectedRoute    from './components/ProtectedRoute'
import Login             from './pages/auth/Login'
import Register          from './pages/auth/Register'
import Dashboard         from './pages/Dashboard'
import Tasks             from './pages/Tasks'
import Goals             from './pages/Goals'
import Habits            from './pages/Habits'
import DailyPlanning     from './pages/DailyPlanning'

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

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          }/>
          <Route path="/tasks" element={
            <ProtectedRoute><Tasks /></ProtectedRoute>
          }/>
          <Route path="/goals" element={
            <ProtectedRoute><Goals /></ProtectedRoute>
          }/>
          <Route path="/habits" element={
            <ProtectedRoute><Habits /></ProtectedRoute>
          }/>
          <Route path="/daily-planning" element={
            <ProtectedRoute><DailyPlanning /></ProtectedRoute>
          }/>

          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
