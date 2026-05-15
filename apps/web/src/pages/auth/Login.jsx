import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { login } from '../../api/auth'

const QUOTES = [
  "Discipline is doing what needs to be done, even when you don't want to.",
  "You don't rise to your goals. You fall to your systems.",
  "The secret of getting ahead is getting started.",
]

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const { setToken, setUser } = useAuth()
  const navigate = useNavigate()

  const quote = QUOTES[new Date().getDate() % QUOTES.length]

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { token, user } = await login(form.email, form.password)
      setToken(token)
      setUser(user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white tracking-tight">Supro</h1>
          <p className="text-slate-500 mt-2 text-sm">Your discipline. Your legacy.</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7">
          <h2 className="text-lg font-semibold text-white mb-5">Welcome back</h2>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium tracking-widest text-slate-400 uppercase mb-1.5">
                Email
              </label>
              <input
                name="email" type="email"
                value={form.email} onChange={handleChange}
                required placeholder="you@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-widest text-slate-400 uppercase mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  name="password" type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  required placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-14 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
                <button
                  type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[.98] text-slate-950 font-semibold rounded-xl py-3 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-5">
            New here?{' '}
            <Link to="/register" className="text-amber-400 hover:text-amber-300 transition-colors">
              Create an account
            </Link>
          </p>
        </div>

        {/* Daily quote */}
        <p className="text-center text-xs text-slate-700 mt-6 italic px-4 leading-relaxed">
          "{quote}"
        </p>
      </div>
    </div>
  )
}