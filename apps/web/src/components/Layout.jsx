import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { path: '/dashboard', icon: 'ti-home', label: 'Dashboard' },
  { path: '/tasks', icon: 'ti-checkbox', label: 'Tasks' },
  { path: '/goals', icon: 'ti-target', label: 'Goals' },
  { path: '/75hard', icon: 'ti-flame', label: '75 Hard' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNavigate = () => {
    setMobileNavOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-left lg:flex">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="text-lg font-bold text-white tracking-tight">Supro</p>
            <p className="truncate text-xs text-slate-500">{user?.name || user?.email || 'Welcome back'}</p>
          </div>
          <button
            onClick={() => setMobileNavOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 transition-all hover:border-slate-700 hover:text-white"
            aria-label="Toggle navigation"
            aria-expanded={mobileNavOpen}
          >
            <i className={`ti ${mobileNavOpen ? 'ti-x' : 'ti-menu-2'} text-lg`} aria-hidden="true" />
          </button>
        </div>

        {mobileNavOpen && (
          <div className="border-t border-slate-800 bg-slate-950 px-4 py-4">
            <nav className="space-y-2">
              {NAV.map(({ path, icon, label }) => {
                const active = pathname === path
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={handleNavigate}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all ${
                      active
                        ? 'border border-amber-500/20 bg-amber-500/10 font-medium text-amber-400'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <i className={`ti ${icon}`} aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="mt-4 space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 px-3 py-2.5 text-sm text-slate-300 transition-all hover:border-slate-700 hover:text-white"
              >
                <i className="ti ti-logout" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      <aside className="hidden w-56 shrink-0 border-r border-slate-800 bg-slate-900 lg:flex lg:flex-col">
        <div className="border-b border-slate-800 px-5 py-5">
          <p className="text-xl font-bold tracking-tight text-white">Supro</p>
          <p className="mt-0.5 text-xs text-slate-600">by {user?.name || 'you'}</p>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV.map(({ path, icon, label }) => {
            const active = pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  active
                    ? 'border border-amber-500/20 bg-amber-500/10 font-medium text-amber-400'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <i className={`ti ${icon}`} aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-0.5 border-t border-slate-800 px-3 py-4">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-slate-300">{user?.name}</p>
            <p className="truncate text-xs text-slate-600">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-all hover:bg-slate-800 hover:text-white"
          >
            <i className="ti ti-logout" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  )
}