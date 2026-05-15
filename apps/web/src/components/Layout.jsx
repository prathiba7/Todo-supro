import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { path: '/dashboard', icon: 'ti-home',    label: 'Dashboard' },
  { path: '/tasks',     icon: 'ti-checkbox', label: 'Tasks'    },
  { path: '/goals',     icon: 'ti-target',   label: 'Goals'    },
  { path: '/75hard',    icon: 'ti-flame',    label: '75 Hard'  },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { pathname }     = useLocation()
  const navigate         = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800">
          <p className="text-xl font-bold text-white tracking-tight">Supro</p>
          <p className="text-xs text-slate-600 mt-0.5">by {user?.name || 'you'}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ path, icon, label }) => {
            const active = pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium'
                    : 'text-slate-500 hover:text-white hover:bg-slate-800'
                }`}
              >
                <i className={`ti ${icon}`} aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-0.5">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-slate-300 truncate">{user?.name}</p>
            <p className="text-xs text-slate-600 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:text-white hover:bg-slate-800 transition-all"
          >
            <i className="ti ti-logout" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}