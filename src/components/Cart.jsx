import { useState } from 'react'

const MinusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
)
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
)
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
)

export default function Cart({ items, onUpdateQty, onRemove, onTriggerCheckout }) {
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const estimatedTax = total * 0.08
  const grandTotal = total + (total > 0 ? estimatedTax : 0)

  if (items.length === 0) {
    return (
      <div id="cart-section" className="animate-fade-in bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Add hardware products to your cart and pay seamlessly with your NFC card.
        </p>
      </div>
    )
  }

  return (
    <div id="cart-section" className="animate-fade-in space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Shopping Cart
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your order before checking out with contactless payment.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
          {items.length} Product{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6 items-start">
        {/* Cart items list (2 columns) */}
        <div className="col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              id={`cart-item-${item.id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-2">
                <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 truncate">{item.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  ${item.price.toFixed(2)} each
                </p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-1 bg-slate-50">
                <button
                  id={`qty-minus-${item.id}`}
                  onClick={() => onUpdateQty(item.id, -1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer shadow-xs"
                >
                  <MinusIcon />
                </button>
                <span className="w-6 text-center text-sm font-semibold tabular-nums">
                  {item.qty}
                </span>
                <button
                  id={`qty-plus-${item.id}`}
                  onClick={() => onUpdateQty(item.id, 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer shadow-xs"
                >
                  <PlusIcon />
                </button>
              </div>

              {/* Total + Remove */}
              <div className="text-right pl-3">
                <p className="text-sm font-bold text-slate-900 tabular-nums">
                  ${(item.price * item.qty).toFixed(2)}
                </p>
              </div>

              <button
                id={`remove-${item.id}`}
                onClick={() => onRemove(item.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Remove item"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary (1 column) */}
        <div className="col-span-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Order Summary
          </h3>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900 tabular-nums">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Tax (8%)</span>
              <span className="font-semibold text-slate-900 tabular-nums">${estimatedTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>NFC Payment Fee</span>
              <span className="font-semibold text-emerald-600">Free</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
              <span className="font-bold text-slate-900">Total</span>
              <div className="text-right">
                <span className="text-xl font-bold text-slate-900 tabular-nums">
                  ${grandTotal.toFixed(2)}
                </span>
                <p className="text-xs text-slate-400">≈ ₹{(grandTotal * 83).toFixed(2)} INR</p>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              id="checkout-btn"
              onClick={() => {
                if (onTriggerCheckout) {
                  onTriggerCheckout(grandTotal)
                } else {
                  setIsCheckingOut(true)
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8.32a7.43 7.43 0 010 7.36" />
                <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
                <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
              </svg>
              Pay with NFC Card
            </button>
            <p className="text-xs text-center text-slate-400 mt-2.5">
              Contactless debit directly from your NFC card
            </p>
          </div>

          {isCheckingOut && !onTriggerCheckout && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 animate-fade-in">
              Please go to the <strong>NFC Cards & Wallet</strong> tab to tap your card.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
