import { useState } from 'react'
import Products from './components/Products'
import Cart from './components/Cart'
import NFCWallet from './components/NFCWallet'

/* ── Navigation icons ── */
const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
)
const CartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
)
const NfcIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8.32a7.43 7.43 0 010 7.36" /><path d="M9.46 6.21a11.76 11.76 0 010 11.58" /><path d="M12.91 4.1a16.07 16.07 0 010 15.8" /><path d="M16.37 2a20.4 20.4 0 010 20" /></svg>
)

const tabs = [
  { id: 'products', label: 'Products', icon: GridIcon },
  { id: 'cart',     label: 'Cart',     icon: CartIcon },
  { id: 'wallet',   label: 'Wallet',   icon: NfcIcon },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('products')
  const [cart, setCart] = useState([])

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

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

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-[var(--color-text)]">
            Store
          </span>

          {/* Desktop nav */}
          <nav id="desktop-nav" className="hidden sm:flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full p-1 shadow-[var(--shadow-sm)]">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  id={`nav-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-[var(--color-accent)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <Icon />
                  {tab.label}
                  {tab.id === 'cart' && cartCount > 0 && (
                    <span className={`ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-semibold rounded-full ${
                      active ? 'bg-white/20 text-white' : 'bg-[var(--color-accent)] text-white'
                    }`}>
                      {cartCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Mobile — cart badge */}
          <div className="sm:hidden text-xs text-[var(--color-text-secondary)]">
            {tabs.find((t) => t.id === activeTab)?.label}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-8">
        {activeTab === 'products' && <Products onAddToCart={addToCart} />}
        {activeTab === 'cart' && <Cart items={cart} onUpdateQty={updateQty} onRemove={removeItem} />}
        {activeTab === 'wallet' && <NFCWallet />}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav id="mobile-nav" className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[var(--color-bg)]/80 backdrop-blur-xl border-t border-[var(--color-border)]">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                id={`mobile-nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center gap-0.5 px-4 py-2 transition-colors duration-200 cursor-pointer ${
                  active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-tertiary)]'
                }`}
              >
                <Icon />
                <span className="text-[10px] font-medium">{tab.label}</span>
                {tab.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-0.5 right-2 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold rounded-full bg-[var(--color-accent)] text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom nav spacer on mobile */}
      <div className="sm:hidden h-16" />
    </div>
  )
}
