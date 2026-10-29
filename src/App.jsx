import { useState } from 'react'
import Products from './components/Products'
import Cart from './components/Cart'
import NFCWallet from './components/NFCWallet'
import DashboardOverview from './components/DashboardOverview'
import Enrollment from './components/Enrollment'
import Auth from './components/Auth'
import CheckoutPaymentModal from './components/CheckoutPaymentModal'
import { useAuth } from './context/AuthContext'

/* ── Banking Icons ── */
const OverviewIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
)
const StoreIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
)
const CartIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </svg>
)
const NfcIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
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
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [dismissedEnrollmentPrompt, setDismissedEnrollmentPrompt] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const hasCard = Boolean(wallet?.hasEnrolledCard || wallet?.card)

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  function updateQty(id, delta) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    )
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((i) => i.id !== id))
  }

  function handleTriggerCheckout() {
    setCheckoutModal(true)
  }

  function navigate(tab) {
    setActiveTab(tab)
    setSidebarOpen(false)
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

  // Requirement 2: After registration, redirect the user to NFC enrollment before opening the dashboard
  if (!hasCard && !dismissedEnrollmentPrompt) {
    return (
      <Enrollment
        onComplete={async () => {
          setDismissedEnrollmentPrompt(true)
          await refreshSession()
          setActiveTab('overview')
        }}
        onSkip={() => setDismissedEnrollmentPrompt(true)}
      />
    )
  }

  /* ── Shared sidebar content ── */
  const SidebarContent = ({ onNav }) => (
    <>
      <div>
        {/* Bank Brand */}
        <div className="h-18 px-5 flex items-center gap-3.5 border-b border-[var(--bank-sidebar-border)]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="text-base font-bold text-white block tracking-tight truncate">Apex Bank</span>
            <span className="text-xs text-emerald-400 font-medium block">Digital Wallet &amp; NFC</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="p-3 pt-5 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Main Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
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

      {/* User Profile + Logout */}
      <div className="p-4 border-t border-[var(--bank-sidebar-border)] bg-slate-950/40">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
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
    </>
  )

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg)]">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-60 h-full bg-[var(--bank-sidebar-bg)] border-r border-[var(--bank-sidebar-border)] flex-col justify-between shrink-0 select-none z-20">
        <SidebarContent onNav={navigate} />
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      {sidebarOpen && (
        <>
          <div
            className="sidebar-backdrop md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-full w-64 bg-[var(--bank-sidebar-bg)] border-r border-[var(--bank-sidebar-border)] flex flex-col justify-between z-40 animate-slide-in md:hidden">
            <SidebarContent onNav={navigate} />
          </aside>
        </>
      )}

      {/* ── Main Workspace ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--color-bg)] min-w-0">

        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-[var(--color-border)] px-4 md:px-8 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>

            <span className="hidden sm:inline text-sm font-medium text-slate-600">
              Welcome, <strong className="text-slate-900 font-semibold">{user.name}</strong>
            </span>
            <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="hidden xs:inline">Account Active</span>
              <span className="xs:hidden">Active</span>
            </span>
            {!hasCard && (
              <button
                onClick={() => setShowEnrollmentModal(true)}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span>⚠️ No Card Enrolled</span>
                <span className="underline ml-1">Enroll</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-right">
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Digital Wallet Balance</p>
              <p className="text-sm md:text-base font-bold text-slate-900 font-mono">
                ₹{((wallet?.balance ?? 1000.0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
          <div className="w-full max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <DashboardOverview
                user={user}
                wallet={wallet}
                onNavigate={navigate}
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

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-200 mobile-bottom-nav">
          <div className="flex items-stretch h-16">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors cursor-pointer relative ${
                    active ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-emerald-500" />
                  )}
                  <Icon size={20} />
                  <span>{item.label.split(' ')[0]}</span>
                  {item.id === 'cart' && cartCount > 0 && (
                    <span className="absolute top-2 right-1/4 w-4 h-4 text-[9px] font-bold rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* ── Enrollment Modal ── */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg my-auto">
            <button
              onClick={() => setShowEnrollmentModal(false)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors shadow-xs"
              title="Close modal"
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

      {/* ── Complete Contactless NFC Checkout Payment Modal ── */}
      <CheckoutPaymentModal
        isOpen={checkoutModal}
        onClose={() => setCheckoutModal(false)}
        cart={cart}
        wallet={wallet}
        user={user}
        onPaymentSuccess={async () => {
          setCart([])
          await refreshSession()
          setActiveTab('overview')
        }}
      />
    </div>
  )
}
