export default function DashboardOverview({ user, wallet, onNavigate }) {
  const balance = wallet?.balance ?? 1000.0
  const activeCard = wallet?.card || null

  const mockTransactions = [
    { id: 'TX-8921', type: 'debit', desc: 'Hardware Store: Wireless Earbuds', amount: 89.99, date: 'Today, 2:45 PM', status: 'Completed', card: activeCard?.uid?.slice(0, 8) || '04:A2:3B:6C' },
    { id: 'TX-8920', type: 'credit', desc: 'Demo Welcome Bonus Deposit', amount: 1000.00, date: 'Today, 1:12 PM', status: 'Completed', card: 'System' },
    { id: 'TX-8919', type: 'debit', desc: 'NFC Reader Terminal Tap #1', amount: 45.00, date: 'Yesterday, 6:30 PM', status: 'Completed', card: activeCard?.uid?.slice(0, 8) || '04:B1:4C:7D' },
    { id: 'TX-8918', type: 'credit', desc: 'Direct Top-Up to NFC Wallet', amount: 250.00, date: '28 Oct 2026', status: 'Completed', card: 'Manual' },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug">
            Account Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor your digital wallet balance, contactless cards, and recent activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('wallet')}
            className="px-5 py-2.5 min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8.32a7.43 7.43 0 010 7.36" />
              <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
              <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
            </svg>
            Manage NFC Card
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="px-5 py-2.5 min-h-[40px] bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            Browse Products
          </button>
        </div>
      </div>

      {/* ── Key Financial Metric Cards (4 Columns with 150px min height & 20px padding) ── */}
      <div className="grid grid-cols-4 gap-5">
        {/* Main Wallet Balance */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 rounded-2xl border border-slate-700 text-white shadow-xs flex flex-col justify-between min-h-[155px]">
          <div>
            <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
              <span>Wallet Ledger Balance</span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                Primary
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-white tabular-nums leading-none">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-xs text-slate-400 mt-1.5">
                ≈ ${(balance / 83).toFixed(2)} USD (Single Source of Truth)
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Direct Debit</span>
            <span className="text-emerald-400 font-medium">Active</span>
          </div>
        </div>

        {/* Linked NFC Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[155px]">
          <div>
            <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
              <span>Primary NFC Card</span>
              <span className={`w-2.5 h-2.5 rounded-full ${activeCard ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            </div>
            <div className="mt-3">
              <p className="text-base font-bold text-slate-900 font-mono tracking-wide leading-none truncate">
                {activeCard ? activeCard.uid : 'No card enrolled'}
              </p>
              <p className="text-xs text-slate-500 mt-1.5 truncate">
                {activeCard ? `${activeCard.holderName} • ${activeCard.maskedToken || 'NDEF Tag'}` : 'Click to enroll physical tag'}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Enrollment Status</span>
            <span className={`font-semibold ${activeCard ? 'text-emerald-700' : 'text-amber-700'}`}>
              {activeCard ? 'Enrolled & Verified' : 'Action Required'}
            </span>
          </div>
        </div>

        {/* Daily Spending Headroom */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[155px]">
          <div>
            <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
              <span>Daily Contactless Velocity</span>
              <span className="text-xs text-slate-400 font-medium">Limit</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums leading-none">
                ₹10,000
              </span>
              <p className="text-xs text-emerald-600 font-medium mt-1.5">
                ₹9,865 remaining today
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Transponder Standard</span>
            <span className="font-semibold text-slate-700">NFC Forum Type 2</span>
          </div>
        </div>

        {/* Account Security */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[155px]">
          <div>
            <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
              <span>Cryptographic Security</span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
            </div>
            <div className="mt-3">
              <span className="text-base font-bold text-slate-900 leading-none">
                SHA-256 Token Hash
              </span>
              <p className="text-xs text-slate-500 mt-1.5">
                Raw tokens never logged or persisted
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Card Reader</span>
            <span className="font-semibold text-slate-700">Ready</span>
          </div>
        </div>
      </div>

      {/* ── Transaction Table & Quick Actions ── */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Recent Transactions Table */}
        <div className="col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recent Transactions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest debits, credits, and contactless NFC charges.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold">
                  <th className="pb-3.5 pr-4">Description</th>
                  <th className="pb-3.5 px-4">Card / Token</th>
                  <th className="pb-3.5 px-4">Date</th>
                  <th className="pb-3.5 px-4 text-right">Amount</th>
                  <th className="pb-3.5 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors h-11">
                    <td className="py-3.5 pr-4 font-medium text-slate-900 whitespace-nowrap">{tx.desc}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">{tx.card}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">{tx.date}</td>
                    <td className={`py-3.5 px-4 text-right font-semibold tabular-nums whitespace-nowrap ${
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Common card and wallet tasks.
            </p>
          </div>

          <div className="space-y-3.5">
            <button
              onClick={() => onNavigate('wallet')}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                  Manage NFC Cards
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Enroll, scan, or verify tag</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <button
              onClick={() => onNavigate('products')}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                  Buy Hardware
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Shop verified NFC equipment</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <button
              onClick={() => onNavigate('cart')}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                  Checkout Cart
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Pay with contactless wallet</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
