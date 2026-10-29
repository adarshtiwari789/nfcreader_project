import { products } from '../data'

export default function Products({ onAddToCart }) {
  return (
    <div id="products-section" className="animate-fade-in space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Product Store
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Official hardware and accessories compatible with Apex Bank NFC contactless payments.
          </p>
        </div>
        <span className="inline-flex self-start sm:self-auto items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          NFC Checkout Ready
        </span>
      </div>

      {/* ── Product Grid: 1 col mobile, 2 col tablet, 3 col desktop ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            id={`product-${p.id}`}
            className="group flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center p-6">
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
              {p.tag && (
                <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white rounded-lg shadow-xs">
                  {p.tag}
                </span>
              )}
            </div>

            {/* Info & Action */}
            <div className="flex flex-col flex-1 p-5 justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                  {p.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-slate-900 tabular-nums">
                    ${p.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400">
                    ≈ ₹{(p.price * 83).toFixed(0)} INR
                  </span>
                </div>
              </div>

              <button
                id={`add-to-cart-${p.id}`}
                onClick={() => onAddToCart(p)}
                className="w-full py-3 px-4 text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs min-h-[44px]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
