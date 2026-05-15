import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { register } from '../../api/auth'

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { setToken, setUser } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    setLoading(true)
    setError('')
    try {
      const { token, user } = await register(form.name, form.email, form.password)
      setToken(token)
      setUser(user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'name',     type: 'text',     label: 'Your name',       placeholder: 'Rahul'           },
    { name: 'email',    type: 'email',    label: 'Email',           placeholder: 'you@example.com' },
    { name: 'password', type: 'password', label: 'Password',        placeholder: 'Min. 8 characters'},
    { name: 'confirm',  type: 'password', label: 'Confirm password', placeholder: '••••••••'        },
  ]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center sm:mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Supro</h1>
          <p className="mt-2 text-sm text-slate-500">Day 1 starts now.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Create your account</h2>
          <p className="mb-5 text-sm text-slate-500">Your transformation begins here.</p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ name, type, label, placeholder }) => (
              <div key={name}>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-slate-500">
                  {label}
                </label>
                <input
                  name={name} type={type}
                  value={form[name]} onChange={handleChange}
                  required placeholder={placeholder}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>
            ))}

            <button
              type="submit" disabled={loading}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-600 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Creating account...' : 'Start my journey →'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm leading-relaxed text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-700 transition-colors hover:text-amber-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}