import { useState, useEffect } from 'react'
import { api } from '../api'

export default function DashboardOverview({ user, wallet, onNavigate }) {
  const balance = wallet?.balance ?? 1000.0
  const activeCard = wallet?.card || null

  const fallbackTransactions = [
    { id: 'TX-8921', type: 'debit', desc: 'Hardware Store: Wireless Earbuds', amount: 139.32, date: 'Today, 2:45 PM', status: 'Completed', card: activeCard?.maskedToken || 'NFC-4A2B...6CD1' },
    { id: 'TX-8920', type: 'credit', desc: 'Demo Welcome Bonus Deposit', amount: 1000.00, date: 'Today, 1:12 PM', status: 'Completed', card: 'Apex Vault' },
    { id: 'TX-8919', type: 'debit', desc: 'NFC Reader Terminal Tap #1', amount: 52.92, date: 'Yesterday, 6:30 PM', status: 'Completed', card: activeCard?.maskedToken || 'NFC-4A2B...6CD1' },
  ]

  const [transactions, setTransactions] = useState(fallbackTransactions)

  useEffect(() => {
    api.getMyTransactions()
      .then((res) => {
        if (res?.data?.transactions && res.data.transactions.length > 0) {
          setTransactions(res.data.transactions)
        }
      })
      .catch(() => {
        // keep fallback
      })
  }, [wallet])

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
            Account Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor your digital wallet balance, contactless cards, and recent activity.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => onNavigate('wallet')}
            className="px-4 py-2.5 min-h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8.32a7.43 7.43 0 010 7.36" />
              <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
              <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
            </svg>
            Manage NFC Card
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="px-4 py-2.5 min-h-[42px] bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            Browse Products
          </button>
        </div>
      </div>

      {/* ── KPI Cards: 1 col on mobile, 2 on sm, 4 on lg ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">

        {/* 1. Wallet Balance */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 rounded-2xl border border-slate-700 text-white shadow-xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
              <span>Digital Wallet Balance</span>
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

        {/* 2. Linked NFC Card (Friendly Card Reference & Masked ID) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
              <span>Primary NFC Card</span>
              <span className={`w-2.5 h-2.5 rounded-full ${activeCard ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            </div>
            <div className="mt-3">
              <p className="text-base font-bold text-slate-900 font-mono tracking-wide leading-snug truncate">
                {activeCard ? activeCard.maskedToken || 'Contactless Tag' : 'No card enrolled'}
              </p>
              <p className="text-xs text-slate-500 mt-1.5 truncate">
                {activeCard ? `UID: ${activeCard.uid} • ${activeCard.holderName}` : 'Click to enroll physical card'}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Card Status</span>
            <span className={`font-semibold ${activeCard ? 'text-emerald-700' : 'text-amber-700'}`}>
              {activeCard ? activeCard.status : 'Enrollment Required'}
            </span>
          </div>
        </div>

        {/* 3. Daily Contactless Limit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
              <span>Daily Contactless Limit</span>
              <span className="text-xs text-slate-400 font-medium">Velocity</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums leading-none">
                ₹50,000
              </span>
              <p className="text-xs text-emerald-600 font-medium mt-1.5">
                Velocity limit active
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Protocol</span>
            <span className="font-semibold text-slate-700">ISO/IEC 14443 Type A</span>
          </div>
        </div>

        {/* 4. Payment Security & Two-Factor PIN */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
              <span>Payment Security</span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                PIN PROTECTED
              </span>
            </div>
            <div className="mt-3">
              <span className="text-base font-bold text-slate-900 leading-snug block">
                4-Digit Security PIN
              </span>
              <p className="text-xs text-slate-500 mt-1.5">
                Two-factor contactless checkout authorization
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Card Reader</span>
            <span className="font-semibold text-emerald-700">Ready to Scan</span>
          </div>
        </div>
      </div>

      {/* ── Transactions + Quick Actions: stack on mobile, 8/4 cols on xl ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

        {/* Recent Transactions */}
        <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-500 mt-0.5">Latest debits, credits, and contactless NFC charges.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {transactions.length} Activity Log{transactions.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold">
                  <th className="pb-3.5 pr-4">Description</th>
                  <th className="pb-3.5 px-3 hidden sm:table-cell">Card Reference</th>
                  <th className="pb-3.5 px-3 hidden md:table-cell">Date &amp; Time</th>
                  <th className="pb-3.5 px-3 text-right">Amount</th>
                  <th className="pb-3.5 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id || Math.random()} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 pr-4 font-medium text-slate-900 text-sm leading-snug">
                      <span className="line-clamp-2">{tx.desc}</span>
                    </td>
                    <td className="py-4 px-3 font-mono text-xs text-slate-500 whitespace-nowrap hidden sm:table-cell">
                      {tx.card}
                    </td>
                    <td className="py-4 px-3 text-xs text-slate-500 whitespace-nowrap hidden md:table-cell">
                      {tx.date}
                    </td>
                    <td className={`py-4 px-3 text-right font-semibold tabular-nums whitespace-nowrap text-sm ${
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      {tx.amountInr && (
                        <span className="block text-[11px] text-slate-400 font-normal">
                          ₹{Number(tx.amountInr).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 pl-3 text-right whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${
                        tx.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : tx.status === 'Failed'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
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
        <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Common card and wallet tasks.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('wallet')}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 flex items-center justify-between text-left transition-all cursor-pointer group min-h-[64px]"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">Manage NFC Cards</p>
                <p className="text-xs text-slate-500 mt-0.5">Enroll, scan, or verify tag</p>
              </div>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <button
              onClick={() => onNavigate('products')}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 flex items-center justify-between text-left transition-all cursor-pointer group min-h-[64px]"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">Buy Hardware</p>
                <p className="text-xs text-slate-500 mt-0.5">Shop verified NFC equipment</p>
              </div>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <button
              onClick={() => onNavigate('cart')}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 flex items-center justify-between text-left transition-all cursor-pointer group min-h-[64px]"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">Checkout Cart</p>
                <p className="text-xs text-slate-500 mt-0.5">Pay with contactless wallet</p>
              </div>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
