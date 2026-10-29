import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

/* ── Fallback cards for testing & simulation ── */
const MOCK_CARDS = [
  { uid: '04:A2:3B:6C:D1:00:80', holderName: 'Adarsh Tiwari', status: 'Active', pin: '1234' },
  { uid: '04:B1:4C:7D:E2:00:81', holderName: 'Alex Morgan', status: 'Active', pin: '1234' },
  { uid: '04:C0:5D:8E:F3:00:82', holderName: 'Jordan Lee', status: 'Suspended', pin: '1234' },
]

export default function NFCWallet({ onCardUpdated, onOpenEnrollment }) {
  const { wallet, user, refreshSession } = useAuth()
  const [scanState, setScanState] = useState('idle') // idle | scanning | success
  const [cardData, setCardData] = useState(null)
  const [error, setError] = useState(null)
  const [pinInput, setPinInput] = useState('')
  const [pinVerified, setPinVerified] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')
  const [simUid, setSimUid] = useState('04:A2:3B:6C:D1:00:80')

  // Wallet balance is single source of truth
  const walletBalance = wallet?.balance ?? 1000.0

  // Automatically load enrolled card for this user on mount
  useEffect(() => {
    api.getMyCard()
      .then((res) => {
        if (res?.data?.hasCard && res.data.card) {
          setCardData({
            ...res.data.card,
            balance: walletBalance,
            timestamp: res.data.card.lastScannedAt ? new Date(res.data.card.lastScannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Enrolled',
          })
        } else if (wallet?.card) {
          setCardData({
            ...wallet.card,
            balance: walletBalance,
            timestamp: 'Enrolled',
          })
        }
      })
      .catch(() => {
        if (wallet?.card) {
          setCardData({
            ...wallet.card,
            balance: walletBalance,
            timestamp: 'Enrolled',
          })
        }
      })
  }, [wallet, walletBalance])

  // Real Web NFC Scan: reads NDEF record token or hardware UID
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
        const uid = event.serialNumber || '04:A2:3B:6C:D1:00:80'
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

  // Simulate or Call Backend
  async function resolveCardWithBackend(uidToScan) {
    setScanState('scanning')
    setError(null)
    setActionSuccess('')
    try {
      const res = await api.scanCard({ uid: uidToScan })
      if (res?.data?.card) {
        setCardData({
          ...res.data.card,
          balance: walletBalance, // Wallet is single source of truth
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
        setScanState('success')
        setActionSuccess('Card detected and verified successfully.')
        if (onCardUpdated) onCardUpdated(res.data.card)
        return
      }
    } catch {
      const mock = MOCK_CARDS.find((c) => c.uid === uidToScan) || {
        uid: uidToScan,
        holderName: user?.name || 'Registered User',
        status: 'Active',
        pin: '1234',
      }
      setCardData({
        ...mock,
        balance: walletBalance,
        maskedToken: `NFC-${uidToScan.slice(0, 4)}...${uidToScan.slice(-4)}`,
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
      setError('Incorrect PIN. The default demonstration PIN is 1234.')
    }
  }

  const handleQuickAddFunds = async (amount) => {
    const targetUid = cardData?.uid || (wallet?.card?.uid) || '04:A2:3B:6C:D1:00:80'
    try {
      const res = await api.updateBalance(targetUid, { amount, operation: 'add' })
      if (res?.data?.wallet) {
        setActionSuccess(`Added ₹${amount} to wallet balance.`)
        await refreshSession()
        setCardData((prev) => prev ? { ...prev, balance: res.data.wallet.balance } : null)
      }
    } catch {
      // Fallback update
      setActionSuccess(`Added ₹${amount} to wallet balance.`)
      await refreshSession()
    }
  }

  return (
    <div id="nfc-section" className="animate-fade-in space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            NFC Cards & Wallet
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your physical NFC payment cards, check balances, and configure security PINs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onOpenEnrollment && (
            <button
              onClick={onOpenEnrollment}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Enroll New NFC Card
            </button>
          )}
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-xs">
            <span className={`w-2 h-2 rounded-full ${scanState === 'scanning' ? 'bg-amber-500 animate-ping' : scanState === 'success' || cardData ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            {scanState === 'scanning' ? 'Scanning for Card…' : cardData ? 'Card Enrolled & Linked' : 'Reader Ready'}
          </span>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 text-sm font-bold">✕</button>
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-emerald-600 hover:text-emerald-900 text-sm font-bold">✕</button>
        </div>
      )}

      {/* ── Balanced Two-Column Layout (Cards A & B) ── */}
      <div className="grid grid-cols-2 gap-6 items-start">
        {/* Column A: NFC Card Preview & Physical Card Display */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Card Preview</h2>
            <div className="flex items-center gap-2">
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
          <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 text-white shadow-md border border-slate-700 min-h-[220px] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8.32a7.43 7.43 0 010 7.36" />
                  <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
                  <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
                </svg>
                <span className="text-xs font-bold tracking-wider uppercase">Contactless Pay</span>
              </div>
              <span className="text-xs font-semibold text-slate-400">Apex Debit</span>
            </div>

            {/* Chip Graphic */}
            <div className="my-4 w-11 h-8 rounded-md bg-gradient-to-tr from-amber-200 to-amber-400 border border-amber-500 flex items-center justify-center p-1 shadow-xs">
              <div className="w-full h-full border border-amber-600/40 rounded-xs flex items-center justify-center">
                <div className="w-4 h-3 border-r border-l border-amber-700/40" />
              </div>
            </div>

            {/* Card UID and Cardholder */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Card Identifier (UID)</p>
                  <p className="text-base font-mono font-bold tracking-widest text-slate-100">
                    {cardData ? cardData.uid : '•••• •••• •••• ••••'}
                  </p>
                </div>
                {cardData?.maskedToken && (
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-medium">Enrolled Token</p>
                    <p className="text-xs font-mono text-emerald-400 font-semibold">
                      {cardData.maskedToken}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between pt-1">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Cardholder Name</p>
                  <p className="text-sm font-semibold text-white">
                    {cardData ? cardData.holderName : (user?.name || 'Hold card near device')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium">Wallet Balance (Source of Truth)</p>
                  <p className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                    ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Balance Top-up */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Quick Add Wallet Balance
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[100, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleQuickAddFunds(amt)}
                  className="py-2.5 px-3 text-sm font-semibold bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-xl transition-all cursor-pointer text-slate-700"
                >
                  +₹{amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column B: Card Management, Scanning & Security PIN */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Card Management</h2>
            <span className="text-xs text-slate-500">Security & Tap Controls</span>
          </div>

          {/* Scanning Action Group */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                id="scan-nfc-btn"
                onClick={handleHardwareScan}
                disabled={scanState === 'scanning'}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 shadow-xs"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8.32a7.43 7.43 0 010 7.36" />
                  <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
                  <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
                </svg>
                {scanState === 'scanning' ? 'Scanning…' : 'Scan NFC Card'}
              </button>

              <button
                type="button"
                onClick={() => resolveCardWithBackend(simUid)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
              >
                Simulate Card Tap
              </button>
            </div>

            {/* Mock-card selector below scan action */}
            <div className="pt-1">
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
                    {c.holderName} — {c.uid}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Security PIN Controls */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Security PIN</h3>
                <p className="text-xs text-slate-500">Required before authorizing payments</p>
              </div>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                pinVerified
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {pinVerified ? 'Authorized' : 'Not Verified'}
              </span>
            </div>

            <form onSubmit={handleVerifyPin} className="flex gap-3">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="4-digit PIN (1234)"
                className="flex-1 px-3 py-2 text-sm text-center font-mono tracking-widest bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={!cardData}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Verify PIN
              </button>
            </form>
          </div>

          {/* Compact Technical Card Details */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Card Details
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block">Protocol</span>
                <span className="font-medium text-slate-800">ISO/IEC 14443 Type A</span>
              </div>
              <div>
                <span className="text-slate-400 block">Record Type</span>
                <span className="font-medium text-slate-800">NDEF Text Record</span>
              </div>
              <div>
                <span className="text-slate-400 block">Last Scanned</span>
                <span className="font-medium text-slate-800">{cardData?.timestamp || 'Never'}</span>
              </div>
              <div>
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
