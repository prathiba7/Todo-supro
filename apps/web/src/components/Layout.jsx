import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

const navItems = [
  { path: '/dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { path: '/tasks', icon: 'ti-checkbox', label: 'Tasks' },
  { path: '/goals', icon: 'ti-target', label: 'Goals' },
  { path: '/habits', icon: 'ti-flame', label: 'Habits' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 glass-effect border-b border-white/20 shadow-soft"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <i className="ti ti-rocket text-xl text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Supro
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white rounded-lg shadow-md"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className={`relative z-10 flex items-center gap-2 ${
                      isActive ? 'text-violet-600' : 'text-gray-600 hover:text-gray-900'
                    }`}>
                      <i className={`${item.icon} text-lg`} />
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Logout"
              >
                <i className="ti ti-logout text-lg" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Navigation */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-white/20 shadow-xl"
      >
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-violet-600 shadow-md'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <i className={`${item.icon} text-xl`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </motion.nav>

      {/* Mobile Bottom Padding */}
      <div className="md:hidden h-20" />
    </div>
  )
}

// Made with Bob
