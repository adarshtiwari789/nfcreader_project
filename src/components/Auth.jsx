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

  const switchTab = (toLogin) => {
    setIsLogin(toLogin)
    setError('')
    setFieldErrors({})
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[var(--bank-sidebar-bg)] flex items-start justify-center px-4 py-10 sm:py-16 sm:items-center">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-900/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-teal-900/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Card */}
        <div className="bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />

          <div className="p-7 sm:p-9">
            {/* Brand Header */}
            <div className="flex items-center gap-3.5 mb-8">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">Apex Bank & NFC</h1>
                <p className="text-xs text-[var(--color-text-tertiary)] font-medium mt-0.5">Digital Banking & Contactless Pay</p>
              </div>
            </div>

            {/* Tab Switch */}
            <div className="flex p-1 bg-[var(--color-surface-subtle)] rounded-xl mb-7">
              <button
                type="button"
                onClick={() => switchTab(true)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${isLogin
                    ? 'bg-white text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchTab(false)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${!isLogin
                    ? 'bg-white text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  }`}
              >
                Open Account
              </button>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                {isLogin
                  ? 'Sign in to your Apex Bank digital wallet.'
                  : 'Open your account and claim ₹1,000 demo balance.'}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3.5 text-sm text-red-700 bg-[var(--color-danger-bg)] border border-red-200 rounded-xl flex items-start gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
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
                    className={`w-full px-3.5 py-3 text-sm rounded-xl border bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors ${fieldErrors.name ? 'border-red-400' : 'border-[var(--color-border)]'
                      }`}
                  />
                  {fieldErrors.name && (
                    <span className="text-xs text-red-500 mt-1.5 block">{fieldErrors.name}</span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                  Email Address
                </label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="alex@example.com"
                  className={`w-full px-3.5 py-3 text-sm rounded-xl border bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors ${fieldErrors.email ? 'border-red-400' : 'border-[var(--color-border)]'
                    }`}
                />
                {fieldErrors.email && (
                  <span className="text-xs text-red-500 mt-1.5 block">{fieldErrors.email}</span>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                    Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="auth-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className={`w-full px-3.5 py-3 text-sm rounded-xl border bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors ${fieldErrors.phone ? 'border-red-400' : 'border-[var(--color-border)]'
                      }`}
                  />
                  {fieldErrors.phone && (
                    <span className="text-xs text-red-500 mt-1.5 block">{fieldErrors.phone}</span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                  Password
                </label>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-3 text-sm rounded-xl border bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors ${fieldErrors.password ? 'border-red-400' : 'border-[var(--color-border)]'
                    }`}
                />
                {fieldErrors.password && (
                  <span className="text-xs text-red-500 mt-1.5 block">{fieldErrors.password}</span>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
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
                    className={`w-full px-3.5 py-3 text-sm rounded-xl border bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors ${fieldErrors.confirmPassword ? 'border-red-400' : 'border-[var(--color-border)]'
                      }`}
                  />
                  {fieldErrors.confirmPassword && (
                    <span className="text-xs text-red-500 mt-1.5 block">{fieldErrors.confirmPassword}</span>
                  )}
                </div>
              )}

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center cursor-pointer disabled:opacity-60 min-h-[46px]"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : isLogin ? (
                  'Sign In Securely'
                ) : (
                  'Open Account & Claim ₹1,000'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-7 pt-5 border-t border-[var(--color-border)] text-center">
              <p className="text-xs text-[var(--color-text-tertiary)] flex items-center justify-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                256-bit encrypted banking session
              </p>
            </div>
          </div>
        </div>

        {/* Below card note */}
        <p className="text-center text-xs text-slate-500 mt-4">
          Apex Bank Demo • No real money involved
        </p>
      </div>
    </div>
  )
}
