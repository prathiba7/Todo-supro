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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center sm:mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Supro</h1>
          <p className="mt-2 text-sm text-slate-500">Your discipline. Your legacy.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">Welcome back</h2>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-slate-500">
                Email
              </label>
              <input
                name="email" type="email"
                value={form.email} onChange={handleChange}
                required placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-slate-500">
                Password
              </label>
              <div className="relative">
                <input
                  name="password" type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  required placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
                <button
                  type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 transition-colors hover:text-slate-700"
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-600 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm leading-relaxed text-slate-500">
            New here?{' '}
            <Link to="/register" className="text-amber-700 transition-colors hover:text-amber-800">
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-6 px-2 text-center text-xs italic leading-relaxed text-slate-500 sm:px-4">
          "{quote}"
        </p>
      </div>
    </div>
  )
}