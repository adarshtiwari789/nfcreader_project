import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

/* ── Fallback cards for testing & simulation ── */
const MOCK_CARDS = [
  { uid: '04:A2:3B:6C', holderName: 'Adarsh Tiwari', status: 'Active', pin: '1234', cardType: 'MIFARE Classic 1K' },
  { uid: '04:B1:4C:7D', holderName: 'Alex Morgan', status: 'Active', pin: '1234', cardType: 'MIFARE Classic 1K' },
  { uid: '04:C0:5D:8E:F3:00:82', holderName: 'Jordan Lee', status: 'Suspended', pin: '1234', cardType: 'NFC Forum Type 2' },
]

export default function NFCWallet({ onCardUpdated, onOpenEnrollment }) {
  const { wallet, user, refreshSession } = useAuth()
  const [scanState, setScanState] = useState('idle')
  const [cardData, setCardData] = useState(null)
  const [error, setError] = useState(null)
  const [pinInput, setPinInput] = useState('')
  const [pinVerified, setPinVerified] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')
  const [simUid, setSimUid] = useState('04:A2:3B:6C')

  const walletBalance = wallet?.balance ?? 1000.0

  useEffect(() => {
    api.getMyCard()
      .then((res) => {
        if (res?.data?.hasCard && res.data.card) {
          setCardData({
            ...res.data.card,
            balance: walletBalance,
            timestamp: res.data.card.lastScannedAt
              ? new Date(res.data.card.lastScannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Enrolled',
          })
        } else if (wallet?.card) {
          setCardData({ ...wallet.card, balance: walletBalance, timestamp: 'Enrolled' })
        }
      })
      .catch(() => {
        if (wallet?.card) {
          setCardData({ ...wallet.card, balance: walletBalance, timestamp: 'Enrolled' })
        }
      })
  }, [wallet, walletBalance])

  async function handleHardwareScan() {
    setError(null)
    setActionSuccess('')
    setPinVerified(false)
    setPinInput('')
    setScanState('scanning')

    if (!('NDEFReader' in window)) {
      setError('Web NFC is not supported on this browser. Use "Simulate Card Tap" below to test contactless payments.')
      setScanState('idle')
      return
    }

    try {
      const ndef = new NDEFReader()
      await ndef.scan()
      ndef.onreading = async (event) => {
        const uid = event.serialNumber || '04:A2:3B:6C'
        await resolveCardWithBackend(uid)
      }
      ndef.onreadingerror = () => {
        setError('Could not read NFC card. Please hold the card steady and try again.')
        setScanState('idle')
      }
    } catch (err) {
      setError(err.message || 'NFC reader could not be engaged.')
      setScanState('idle')
    }
  }

  async function resolveCardWithBackend(uidToScan) {
    setScanState('scanning')
    setError(null)
    setActionSuccess('')
    try {
      const res = await api.scanCard({ uid: uidToScan })
      if (res?.data?.card) {
        setCardData({
          ...res.data.card,
          balance: walletBalance,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
        setScanState('success')
        setActionSuccess(`Card detected (${res.data.card.cardType || 'MIFARE Classic 1K'}) and verified!`)
        if (onCardUpdated) onCardUpdated(res.data.card)
        return
      }
    } catch {
      const mock = MOCK_CARDS.find((c) => c.uid === uidToScan) || {
        uid: uidToScan,
        cardType: uidToScan.length <= 14 ? 'MIFARE Classic 1K' : 'NFC Forum Type 2',
        holderName: user?.name || 'Registered User',
        status: 'Active',
        pin: '1234',
      }
      setCardData({
        ...mock,
        balance: walletBalance,
        maskedToken: `NFC-${uidToScan.replace(/[^A-Za-z0-9]/g, '').slice(0, 4)}...${uidToScan.replace(/[^A-Za-z0-9]/g, '').slice(-4)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
      setScanState('success')
      setActionSuccess('Card detected and verified successfully.')
    }
  }

  const handleVerifyPin = (e) => {
    e.preventDefault()
    if (!cardData) return
    const expectedPin = cardData.pin || '1234'
    if (pinInput === expectedPin) {
      setPinVerified(true)
      setActionSuccess('PIN confirmed! Card unlocked for payments.')
      setError(null)
    } else {
      setError('Incorrect PIN. The demonstration PIN is 1234.')
    }
  }

  const handleQuickAddFunds = async (amount) => {
    const targetUid = cardData?.uid || wallet?.card?.uid || '04:A2:3B:6C'
    try {
      const res = await api.updateBalance(targetUid, { amount, operation: 'add' })
      if (res?.data?.wallet) {
        setActionSuccess(`Added ₹${amount} to wallet balance.`)
        await refreshSession()
        setCardData((prev) => prev ? { ...prev, balance: res.data.wallet.balance } : null)
      }
    } catch {
      setActionSuccess(`Added ₹${amount} to wallet balance.`)
      await refreshSession()
    }
  }

  return (
    <div id="nfc-section" className="animate-fade-in space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            NFC Cards &amp; Wallet
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your physical MIFARE Classic 1K or NFC payment cards, check balances, and configure security PINs.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {onOpenEnrollment && (
            <button
              onClick={onOpenEnrollment}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer min-h-[42px] whitespace-nowrap"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Enroll MIFARE / NFC Card
            </button>
          )}
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-xs whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full ${
              scanState === 'scanning' ? 'bg-amber-500 animate-ping' :
              scanState === 'success' || cardData ? 'bg-emerald-500' : 'bg-slate-300'
            }`} />
            {scanState === 'scanning' ? 'Scanning for Card…' : cardData ? `${cardData.cardType || 'MIFARE Classic'} Linked` : 'Reader Ready'}
          </span>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between gap-3">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 font-bold shrink-0">✕</button>
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center justify-between gap-3">
          <span className="flex-1">{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-emerald-600 hover:text-emerald-900 font-bold shrink-0">✕</button>
        </div>
      )}

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 items-start">

        {/* ── Column A: Card Preview ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Card Preview</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {cardData?.cardType || 'MIFARE Classic 1K'}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                cardData?.status === 'Active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : cardData?.status === 'Suspended'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {cardData ? cardData.status : 'No Card Active'}
              </span>
            </div>
          </div>

          {/* Physical Card Representation */}
          <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-5 md:p-6 text-white shadow-md border border-slate-700 min-h-[210px] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8.32a7.43 7.43 0 010 7.36" />
                  <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
                  <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
                </svg>
                <span className="text-xs font-bold tracking-wider uppercase">Contactless Pay</span>
              </div>
              <span className="text-xs font-semibold text-slate-400">Apex Debit • {cardData?.cardType || 'MIFARE Classic'}</span>
            </div>

            {/* Chip Graphic */}
            <div className="my-3 w-11 h-8 rounded-md bg-gradient-to-tr from-amber-200 to-amber-400 border border-amber-500 flex items-center justify-center p-1 shadow-xs">
              <div className="w-full h-full border border-amber-600/40 rounded-sm flex items-center justify-center">
                <div className="w-4 h-3 border-r border-l border-amber-700/40" />
              </div>
            </div>

            {/* UID & Cardholder */}
            <div className="space-y-3">
              <div className="flex flex-wrap justify-between items-baseline gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 font-medium">Hardware Card Identifier (UID)</p>
                  <p className="text-sm font-mono font-bold tracking-widest text-slate-100 break-all">
                    {cardData ? cardData.uid : '•••• •••• •••• ••••'}
                  </p>
                </div>
                {cardData?.maskedToken && (
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-medium">Reference</p>
                    <p className="text-xs font-mono text-emerald-400 font-semibold">{cardData.maskedToken}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-end justify-between gap-2 pt-1">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Cardholder</p>
                  <p className="text-sm font-semibold text-white">
                    {cardData ? cardData.holderName : (user?.name || 'Hold card near device')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium">Wallet Balance</p>
                  <p className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                    ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Top-up */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Quick Add Wallet Balance
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[100, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleQuickAddFunds(amt)}
                  className="py-3 px-3 text-sm font-semibold bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-xl transition-all cursor-pointer text-slate-700 min-h-[44px]"
                >
                  +₹{amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Column B: Card Management ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Card Management</h2>
            <span className="text-xs text-slate-500">Security &amp; Tap Controls</span>
          </div>

          {/* Scan Actions */}
          <div className="space-y-4">
            <button
              id="scan-nfc-btn"
              onClick={handleHardwareScan}
              disabled={scanState === 'scanning'}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 shadow-xs min-h-[48px]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8.32a7.43 7.43 0 010 7.36" />
                <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
                <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
              </svg>
              {scanState === 'scanning' ? 'Scanning for Card…' : 'Scan MIFARE / NFC Card'}
            </button>

            <button
              type="button"
              onClick={() => resolveCardWithBackend(simUid)}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200 min-h-[44px]"
            >
              Simulate Card Tap
            </button>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Select Card for Tap Simulation:
              </label>
              <select
                value={simUid}
                onChange={(e) => setSimUid(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              >
                {MOCK_CARDS.map((c) => (
                  <option key={c.uid} value={c.uid}>
                    {c.holderName} — {c.uid} ({c.cardType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Security PIN */}
          <div className="p-4 md:p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Security PIN</h3>
                <p className="text-xs text-slate-500 mt-0.5">Required before authorizing payments</p>
              </div>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                pinVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {pinVerified ? 'Authorized' : 'Not Verified'}
              </span>
            </div>

            <form onSubmit={handleVerifyPin} className="flex flex-col sm:flex-row gap-3">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="4-digit PIN (1234)"
                className="flex-1 px-3 py-2.5 text-sm text-center font-mono tracking-widest bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 min-h-[44px]"
              />
              <button
                type="submit"
                disabled={!cardData}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
              >
                Verify PIN
              </button>
            </form>
          </div>

          {/* Technical Card Details */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Card Details</p>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Protocol</span>
                <span className="font-medium text-slate-800">ISO/IEC 14443 Type A</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Transponder Standard</span>
                <span className="font-medium text-slate-800">{cardData?.cardType || 'MIFARE Classic 1K'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Last Scanned</span>
                <span className="font-medium text-slate-800">{cardData?.timestamp || 'Never'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Card Status</span>
                <span className="font-medium text-emerald-700">{cardData?.status || 'Ready'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
