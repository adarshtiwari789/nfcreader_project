const MinusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
)
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
)
const BagIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-tertiary)]"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
)

export default function Cart({ items, onUpdateQty, onRemove }) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)

  if (items.length === 0) {
    return (
      <section id="cart-section" className="animate-fade-in">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)] mb-8">
          Cart
        </h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BagIcon />
          <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
            Your cart is empty
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            Add products to get started.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="cart-section" className="animate-fade-in">
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
          Cart
        </h1>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {items.length} item{items.length !== 1 && 's'}
        </span>
      </div>

      <div className="flex flex-col gap-3 stagger">
        {items.map((item) => (
          <div
            key={item.id}
            id={`cart-item-${item.id}`}
            className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-[var(--radius)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] animate-fade-in-up transition-all duration-200"
          >
            {/* Thumbnail */}
            <div className="w-16 h-16 shrink-0 rounded-[var(--radius-sm)] bg-[#f5f5f5] overflow-hidden">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">{item.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                ${item.price.toFixed(2)} each
              </p>
            </div>

            {/* Qty controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                id={`qty-minus-${item.id}`}
                onClick={() => onUpdateQty(item.id, -1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[#f5f5f5] active:scale-95 transition-all cursor-pointer"
              >
                <MinusIcon />
              </button>
              <span className="w-8 text-center text-sm font-medium tabular-nums">
                {item.qty}
              </span>
              <button
                id={`qty-plus-${item.id}`}
                onClick={() => onUpdateQty(item.id, 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[#f5f5f5] active:scale-95 transition-all cursor-pointer"
              >
                <PlusIcon />
              </button>
            </div>

            {/* Line total + remove */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-semibold tabular-nums w-20 text-right">
                ${(item.price * item.qty).toFixed(2)}
              </span>
              <button
                id={`remove-${item.id}`}
                onClick={() => onRemove(item.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all cursor-pointer"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-5 bg-[var(--color-surface)] rounded-[var(--radius)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">Total</span>
          <span className="text-xl font-semibold tracking-tight tabular-nums">
            ${total.toFixed(2)}
          </span>
        </div>
        <button
          id="checkout-btn"
          className="mt-4 w-full py-3 text-sm font-medium rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          Checkout
        </button>
      </div>
    </section>
  )
}
