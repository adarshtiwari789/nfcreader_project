import { useState, useEffect, useRef } from 'react'
import { api } from '../api'

export default function CheckoutPaymentModal({
  isOpen,
  onClose,
  cart,
  wallet,
  user,
  onPaymentSuccess,
}) {
  const [stage, setStage] = useState('scan') // 'scan' | 'pin' | 'processing' | 'success' | 'failed'
  const [detectedToken, setDetectedToken] = useState(null)
  const [detectedCardMask, setDetectedCardMask] = useState('NFC-****')
  const [pin, setPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [isScanningHardware, setIsScanningHardware] = useState(false)
  const [idempotencyKey] = useState(() => `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`)

  const pinInputRef = useRef(null)
  const ndefAbortControllerRef = useRef(null)

  const hasWebNFC = typeof window !== 'undefined' && 'NDEFReader' in window

  // Calculate order pricing
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = Number((subtotal * 0.08).toFixed(2))
  const grandTotalUsd = Number((subtotal + (subtotal > 0 ? tax : 0)).toFixed(2))
  const grandTotalInr = Number((grandTotalUsd * 83).toFixed(2))
  const walletBalance = wallet?.balance ?? 0
  const isBalanceSufficient = walletBalance >= grandTotalInr

  // Reset or initialize on modal open
  useEffect(() => {
    if (isOpen) {
      setStage('scan')
      setDetectedToken(null)
      setPin('')
      setErrorMsg('')
      setReceipt(null)

      if (hasWebNFC && isBalanceSufficient) {
        startNfcListening()
      }
    }
    return () => {
      stopNfcListening()
    }
  }, [isOpen])

  // Focus PIN input when moving to PIN stage
  useEffect(() => {
    if (stage === 'pin') {
      setTimeout(() => {
        pinInputRef.current?.focus()
      }, 100)
    }
  }, [stage])

  const startNfcListening = async () => {
    if (!hasWebNFC) return
    try {
      setIsScanningHardware(true)
      const ndef = new NDEFReader()
      const controller = new AbortController()
      ndefAbortControllerRef.current = controller

      await ndef.scan({ signal: controller.signal })

      ndef.onreading = (event) => {
        let readToken = null
        if (event.message?.records) {
          for (const record of event.message.records) {
            if (record.recordType === 'text') {
              const decoder = new TextDecoder(record.encoding || 'utf-8')
              readToken = decoder.decode(record.data)
              break
            }
          }
        }

        if (readToken) {
          handleCardDetected(readToken)
        }
      }

      ndef.onreadingerror = () => {
        setErrorMsg('Error reading NFC tag. Please position card flat against the NFC antenna.')
      }
    } catch {
      setIsScanningHardware(false)
    }
  }

  const stopNfcListening = () => {
    if (ndefAbortControllerRef.current) {
      ndefAbortControllerRef.current.abort()
      ndefAbortControllerRef.current = null
    }
    setIsScanningHardware(false)
  }

  const handleCardDetected = (token) => {
    stopNfcListening()
    setDetectedToken(token)
    const clean = token.replace(/[^A-Za-z0-9]/g, '')
    const masked = clean.length > 8 ? `NFC-${clean.slice(0, 4)}...${clean.slice(-4)}` : 'NFC-TAG'
    setDetectedCardMask(masked)
    setErrorMsg('')
    setStage('pin')
  }

  // Simulation fallback for desktop or development
  const handleSimulateCardTap = async () => {
    setErrorMsg('')
    try {
      // Fetch user's registered card token or generate mock verified token
      const res = await api.getMyCard()
      if (res?.data?.hasCard && res.data.card) {
        // Use user's enrolled card UID or tag token
        const token = res.data.card.token || res.data.card.uid || 'NFC-SIMULATED-TAG-TOKEN'
        handleCardDetected(token)
      } else {
        // User has not enrolled card yet
        handleCardDetected('NFC-MOCK-CARD-TOKEN-04A23B6C')
      }
    } catch {
      handleCardDetected('NFC-MOCK-CARD-TOKEN-04A23B6C')
    }
  }

  // Submit payment to backend
  const handleAuthorizePayment = async (e) => {
    e.preventDefault()
    if (!pin || pin.length !== 4) {
      setErrorMsg('Please enter your 4-digit security PIN.')
      return
    }

    setStage('processing')
    setErrorMsg('')

    try {
      const orderItems = cart.map((item) => ({
        id: item.id,
        qty: item.qty,
      }))

      const payload = {
        token: detectedToken,
        pin,
        items: orderItems,
        idempotencyKey,
      }

      const res = await api.payWithCard(payload)

      if (res?.data && (res.status === 'success' || res.data.status === 'completed')) {
        setReceipt(res.data)
        setStage('success')
      } else {
        throw new Error(res?.message || 'Payment could not be approved.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Payment authorization failed. Please verify credentials.')
      setStage('failed')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">

        {/* Top Accent Strip */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8.32a7.43 7.43 0 010 7.36" />
                <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
                <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Apex Contactless Checkout
              </h3>
              <p className="text-xs text-slate-500">Secure Direct Wallet Debit</p>
            </div>
          </div>

          {stage !== 'processing' && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Order Summary Pill */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Payable Total ({cart.reduce((s, i) => s + i.qty, 0)} items)</p>
            <p className="text-xl font-bold font-mono text-slate-900">
              ₹{grandTotalInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              <span className="text-xs font-normal text-slate-500 ml-2">(${grandTotalUsd.toFixed(2)} USD)</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500">Digital Wallet Balance</p>
            <p className={`text-sm font-bold font-mono ${isBalanceSufficient ? 'text-emerald-700' : 'text-red-600'}`}>
              ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Modal Body: State Machine */}
        <div className="p-6">

          {/* ── STAGE 1: SCAN NFC CARD ── */}
          {stage === 'scan' && (
            <div className="space-y-6 text-center">
              {!isBalanceSufficient && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-left flex items-start gap-2.5">
                  <span className="shrink-0 text-sm">⚠️</span>
                  <div>
                    <p className="font-semibold">Insufficient Wallet Balance</p>
                    <p className="mt-0.5">
                      Required: ₹{grandTotalInr.toFixed(2)}, Available: ₹{walletBalance.toFixed(2)}.
                      Please top up your wallet in the NFC Cards & Wallet section.
                    </p>
                  </div>
                </div>
              )}

              {/* Realistic Pulsing Contactless Reader Graphic */}
              <div className="py-6 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center">
                  {/* Radar Wave 1 */}
                  <div className="absolute w-36 h-36 rounded-full bg-emerald-100/60 animate-ping pointer-events-none" style={{ animationDuration: '2.5s' }} />
                  {/* Radar Wave 2 */}
                  <div className="absolute w-28 h-28 rounded-full bg-emerald-200/50 animate-pulse pointer-events-none" />
                  
                  {/* Reader Icon Disc */}
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950 text-emerald-400 flex items-center justify-center shadow-lg border border-slate-700">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8.32a7.43 7.43 0 010 7.36" />
                      <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
                      <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
                      <path d="M16.37 2a20.4 20.4 0 010 20" />
                    </svg>
                  </div>
                </div>

                <div className="mt-5 space-y-1">
                  <h4 className="text-base font-bold text-slate-900">
                    {isScanningHardware ? 'Listening for NFC Card…' : 'Ready to Tap'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Hold your enrolled physical NFC card flat against your device&apos;s contactless antenna.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleSimulateCardTap}
                  disabled={!isBalanceSufficient}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs min-h-[46px]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  Simulate Card Tap (Demo Mode)
                </button>
                <p className="text-[11px] text-slate-400">
                  On desktop without NFC antenna, click above to simulate contactless detection.
                </p>
              </div>
            </div>
          )}

          {/* ── STAGE 2: ENTER PAYMENT PIN ── */}
          {stage === 'pin' && (
            <div className="space-y-6">
              {/* Card Detected Badge */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-950">Card Detected &amp; Verified</p>
                    <p className="text-[11px] font-mono text-emerald-800">{detectedCardMask}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setStage('scan'); setPin(''); }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* PIN Form */}
              <form onSubmit={handleAuthorizePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">
                    Enter 4-Digit Payment PIN
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Authorization key configured during card enrollment (demo default: <strong>1234</strong>).
                  </p>
                  <input
                    ref={pinInputRef}
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full py-3.5 px-4 text-center text-2xl font-mono font-bold tracking-[0.5em] bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <span className="shrink-0">⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={pin.length !== 4}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer min-h-[46px]"
                  >
                    Confirm &amp; Debit ₹{grandTotalInr.toFixed(2)}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStage('scan'); setPin(''); }}
                    className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── STAGE 3: PROCESSING WITH APEX CORE ── */}
          {stage === 'processing' && (
            <div className="py-10 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="w-16 h-16 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <div className="absolute w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">Authorizing Payment…</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Verifying cryptographic card ownership, checking PIN, and executing atomic ledger debit.
                </p>
              </div>
            </div>
          )}

          {/* ── STAGE 4A: SUCCESSFUL RECEIPT ── */}
          {stage === 'success' && receipt && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1 pb-1">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900">Payment Approved!</h4>
                <p className="text-xs text-slate-500">Contactless transaction completed successfully.</p>
              </div>

              {/* Digital Banking Receipt Card */}
              <div className="p-4.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Transaction Reference</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {String(receipt.transactionId).slice(-10).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Debited</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    ₹{Number(receipt.amountPaid).toFixed(2)} INR
                    <span className="text-[11px] font-normal text-slate-500 ml-1">
                      (${Number(receipt.usdAmount || grandTotalUsd).toFixed(2)})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Wallet Balance</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ₹{Number(receipt.remainingBalance).toFixed(2)} INR
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Card Reference</span>
                  <span className="font-mono text-slate-700">
                    {receipt.card?.maskedToken || detectedCardMask}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp</span>
                  <span className="text-slate-700 font-medium">
                    {new Date(receipt.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Done button */}
              <button
                type="button"
                onClick={() => {
                  onPaymentSuccess(receipt)
                  onClose()
                }}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer min-h-[46px]"
              >
                Complete Order &amp; View Dashboard
              </button>
            </div>
          )}

          {/* ── STAGE 4B: PAYMENT FAILED ── */}
          {stage === 'failed' && (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900">Payment Declined</h4>
                <p className="text-xs text-red-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  {errorMsg || 'Your transaction could not be authorized.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Your cart items have been preserved. No funds were debited.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setStage('pin'); setErrorMsg(''); }}
                  className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer min-h-[44px]"
                >
                  Try PIN Again
                </button>
                <button
                  type="button"
                  onClick={() => { setStage('scan'); setPin(''); setErrorMsg(''); }}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer min-h-[44px]"
                >
                  Scan Again
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}

