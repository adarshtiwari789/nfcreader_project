import { products } from '../data'

export default function Products({ onAddToCart }) {
  return (
    <section id="products-section" className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
          Products
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Curated essentials, designed to last.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
        {products.map((p) => (
          <article
            key={p.id}
            id={`product-${p.id}`}
            className="group relative flex flex-col bg-[var(--color-surface)] rounded-[var(--radius)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-hover)] transition-all duration-300 animate-fade-in-up overflow-hidden"
          >
            {/* Image */}
            <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden">
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {p.tag && (
                <span className="absolute top-3 left-3 px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase bg-[var(--color-text)] text-white rounded-full">
                  {p.tag}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-3 p-4">
              <div>
                <h2 className="text-sm font-medium text-[var(--color-text)] leading-snug">
                  {p.name}
                </h2>
                <p className="mt-0.5 text-sm font-semibold text-[var(--color-text)]">
                  ${p.price.toFixed(2)}
                </p>
              </div>

              <button
                id={`add-to-cart-${p.id}`}
                onClick={() => onAddToCart(p)}
                className="w-full py-2.5 text-xs font-medium tracking-wide uppercase rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                Add to Cart
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
