import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)

    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password })
      } else {
        await register(form)
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.')
      if (err.errors && Array.isArray(err.errors)) {
        const errorMap = {}
        err.errors.forEach((e) => {
          if (e.path) errorMap[e.path] = e.msg
        })
        setFieldErrors(errorMap)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bank-sidebar-bg)] p-6">
      <div className="w-full max-w-md bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] p-8 animate-fade-in">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text)] tracking-tight">Apex Bank & NFC</h1>
            <p className="text-xs text-[var(--color-text-tertiary)] font-medium">Digital Banking & Contactless Pay</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-[var(--color-surface-subtle)] rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); setFieldErrors({}); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isLogin
                ? 'bg-white text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); setFieldErrors({}); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isLogin
                ? 'bg-white text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            Open Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs text-red-600 bg-[var(--color-danger-bg)] border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Account Holder Name
              </label>
              <input
                id="auth-name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Alex Morgan"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
              {fieldErrors.name && (
                <span className="text-[11px] text-red-500 mt-1 block">{fieldErrors.name}</span>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Work / Personal Email
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="alex@example.com"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
            {fieldErrors.email && (
              <span className="text-[11px] text-red-500 mt-1 block">{fieldErrors.email}</span>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Phone Number (Optional)
              </label>
              <input
                id="auth-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
              {fieldErrors.phone && (
                <span className="text-[11px] text-red-500 mt-1 block">{fieldErrors.phone}</span>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Account Password
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
            {fieldErrors.password && (
              <span className="text-[11px] text-red-500 mt-1 block">{fieldErrors.password}</span>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Confirm Password
              </label>
              <input
                id="auth-confirm-password"
                name="confirmPassword"
                type="password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
              {fieldErrors.confirmPassword && (
                <span className="text-[11px] text-red-500 mt-1 block">{fieldErrors.confirmPassword}</span>
              )}
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              'Authenticate Securely'
            ) : (
              'Open Account & Claim ₹1,000'
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-center">
          <p className="text-[11px] text-[var(--color-text-tertiary)] flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            256-bit encrypted banking session
          </p>
        </div>
      </div>
    </div>
  )
}
