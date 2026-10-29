import { useState } from 'react'
import Products from './components/Products'
import Cart from './components/Cart'
import NFCWallet from './components/NFCWallet'
import DashboardOverview from './components/DashboardOverview'
import Enrollment from './components/Enrollment'
import Auth from './components/Auth'
import { useAuth } from './context/AuthContext'

/* ── Clear Banking Icons ── */
const OverviewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
)
const StoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
)
const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </svg>
)
const NfcIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8.32a7.43 7.43 0 010 7.36" />
    <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
    <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
    <path d="M16.37 2a20.4 20.4 0 010 20" />
  </svg>
)
const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const navItems = [
  { id: 'overview', label: 'Dashboard',         icon: OverviewIcon },
  { id: 'wallet',   label: 'NFC Cards & Wallet', icon: NfcIcon },
  { id: 'products', label: 'Product Store',      icon: StoreIcon },
  { id: 'cart',     label: 'Shopping Cart',      icon: CartIcon },
]

export default function App() {
  const { user, wallet, loading, logout, setWallet, refreshSession } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [cart, setCart] = useState([])
  const [checkoutModal, setCheckoutModal] = useState(false)
  const [checkoutAmount, setCheckoutAmount] = useState(0)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [dismissedEnrollmentPrompt, setDismissedEnrollmentPrompt] = useState(false)

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  // Check whether user has an enrolled card in their wallet
  const hasCard = Boolean(wallet?.hasEnrolledCard || wallet?.card)

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  function updateQty(id, delta) {
    setCart((prev) =>
      prev
        .map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    )
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((i) => i.id !== id))
  }

  function handleTriggerCheckout(amount) {
    setCheckoutAmount(amount)
    setCheckoutModal(true)
  }

  function handleCompleteCheckout() {
    setCart([])
    setCheckoutModal(false)
    if (wallet) {
      setWallet((prev) => prev ? { ...prev, balance: Math.max(0, prev.balance - checkoutAmount * 83) } : prev)
    }
    setActiveTab('overview')
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--bank-sidebar-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-300 font-medium">Connecting to Apex Digital Banking…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  // Requirement 1: After registration/login, check whether the authenticated user has an NFC card.
  // If not, show the enrollment page.
  if (!hasCard && !dismissedEnrollmentPrompt) {
    return (
      <Enrollment
        onComplete={() => {
          setDismissedEnrollmentPrompt(true)
          setActiveTab('wallet')
        }}
        onSkip={() => setDismissedEnrollmentPrompt(true)}
      />
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg)]">
      {/* ── Fixed Clean Navy Sidebar (240px) ── */}
      <aside className="w-60 h-full bg-[var(--bank-sidebar-bg)] border-r border-[var(--bank-sidebar-border)] flex flex-col justify-between shrink-0 select-none z-20">
        <div>
          {/* Bank Brand Header */}
          <div className="h-20 px-6 flex items-center gap-3.5 border-b border-[var(--bank-sidebar-border)]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="text-base font-bold text-white block tracking-tight truncate">
                Apex Bank
              </span>
              <span className="text-xs text-emerald-400 font-medium block">
                Digital Wallet & NFC
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 pt-5 space-y-1.5">
            <p className="px-3 pb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Main Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-slate-800 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-emerald-400' : 'text-slate-400'}>
                      <Icon />
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'cart' && cartCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-600 text-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* User profile & logout */}
        <div className="p-4 border-t border-[var(--bank-sidebar-border)] bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              id="logout-btn"
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--color-bg)]">
        {/* Top Header Bar */}
        <header className="h-18 bg-white border-b border-[var(--color-border)] px-8 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">
              Welcome, <strong className="text-slate-900 font-semibold">{user.name}</strong>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Account Active
            </span>
            {!hasCard && (
              <button
                onClick={() => setShowEnrollmentModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span>⚠️ No Card Enrolled</span>
                <span className="underline ml-1">Enroll Tag</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">Digital Wallet Balance</p>
              <p className="text-base font-bold text-slate-900 font-mono">
                ₹{((wallet?.balance ?? 1000.0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </header>

        {/* Dynamic Workspace Container */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="w-full">
            {activeTab === 'overview' && (
              <DashboardOverview
                user={user}
                wallet={wallet}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'products' && <Products onAddToCart={addToCart} />}
            {activeTab === 'cart' && (
              <Cart
                items={cart}
                onUpdateQty={updateQty}
                onRemove={removeItem}
                onTriggerCheckout={handleTriggerCheckout}
              />
            )}
            {activeTab === 'wallet' && (
              <NFCWallet
                onOpenEnrollment={() => setShowEnrollmentModal(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* ── Enrollment Modal when triggered from header or wallet ── */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg">
            <button
              onClick={() => setShowEnrollmentModal(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white text-slate-600 hover:text-slate-900 shadow-md flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
            <Enrollment
              onComplete={async () => {
                setShowEnrollmentModal(false)
                await refreshSession()
              }}
              onSkip={() => setShowEnrollmentModal(false)}
            />
          </div>
        </div>
      )}

      {/* ── Checkout Modal ── */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[var(--color-border)] shadow-2xl p-6 animate-fade-in space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8.32a7.43 7.43 0 010 7.36" />
                  <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
                  <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
                </svg>
                <h3 className="text-base font-bold text-slate-900">Confirm Payment</h3>
              </div>
              <button
                onClick={() => setCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <p className="text-xs text-slate-500 font-medium">Total Amount Due</p>
              <p className="text-2xl font-bold font-mono text-slate-900">
                ${checkoutAmount.toFixed(2)}
              </p>
              <p className="text-xs text-slate-400">≈ ₹{(checkoutAmount * 83).toFixed(2)} INR</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="text-xs">
                <p className="font-semibold text-emerald-950">Ready to Debit</p>
                <p className="text-emerald-700">Amount will be deducted from your digital wallet balance.</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleCompleteCheckout}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm min-h-[42px]"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => setCheckoutModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer min-h-[40px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
