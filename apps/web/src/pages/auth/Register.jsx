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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white tracking-tight">Supro</h1>
          <p className="text-slate-500 mt-2 text-sm">Day 1 starts now.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7">
          <h2 className="text-lg font-semibold text-white mb-1">Create your account</h2>
          <p className="text-slate-500 text-sm mb-5">Your transformation begins here.</p>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ name, type, label, placeholder }) => (
              <div key={name}>
                <label className="block text-xs font-medium tracking-widest text-slate-400 uppercase mb-1.5">
                  {label}
                </label>
                <input
                  name={name} type={type}
                  value={form[name]} onChange={handleChange}
                  required placeholder={placeholder}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            ))}

            <button
              type="submit" disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[.98] text-slate-950 font-semibold rounded-xl py-3 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Start my journey →'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}