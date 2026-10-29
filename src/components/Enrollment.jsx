import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Enrollment({ onComplete, onSkip }) {
  const { user, refreshSession } = useAuth()
  const [tokenData, setTokenData] = useState(null)
  const [fetchingToken, setFetchingToken] = useState(true)
  const [stage, setStage] = useState('idle') // 'idle' | 'scanning' | 'writing' | 'enrolling' | 'success'
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [pin, setPin] = useState('1234')
  const [enrollmentMode, setEnrollmentMode] = useState('auto') // 'auto' | 'mifare'
  const [manualUid, setManualUid] = useState('04:A2:3B:6C')

  const hasWebNFC = typeof window !== 'undefined' && 'NDEFReader' in window

  const loadToken = async () => {
    setFetchingToken(true)
    setError(null)
    try {
      const res = await api.getEnrollmentToken()
      if (res?.data?.token) {
        setTokenData(res.data)
      }
    } catch (err) {
      setError(err.message || 'Could not fetch enrollment token from server.')
    } finally {
      setFetchingToken(false)
    }
  }

  useEffect(() => {
    loadToken()
  }, [])

  // 1. Universal Hardware Contactless Scan (Works with MIFARE Classic 1K & NTAG)
  const handleUniversalScan = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setError('Please provide a valid 4-digit payment PIN.')
      return
    }

    if (!hasWebNFC) {
      setError(
        'Web NFC is not supported in this browser. Use "Simulate MIFARE Classic 1K Tap" or "Enter UID Manually" below to test.'
      )
      return
    }

    setError(null)
    setSuccessMsg(null)
    setStage('scanning')

    try {
      const ndef = new NDEFReader()
      await ndef.scan()

      ndef.onreading = async (event) => {
        const hwUid = event.serialNumber || ''
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

        // Try writing NDEF token if supported; if it's a MIFARE Classic 1K, fall back to UID enrollment
        if (tokenData?.token) {
          try {
            await ndef.write({
              records: [{ recordType: 'text', data: tokenData.token }],
            })
            // If NDEF write succeeds (e.g. NTAG)
            setSuccessMsg('NDEF token verified! Linking card to digital wallet…')
            await submitEnrollment(tokenData.token, hwUid, 'NFC Forum Type 2')
            return
          } catch {
            // Write failed because tag is MIFARE Classic 1K (Crypto-1) or read-only!
            // Seamlessly fallback to hardware UID enrollment
            if (hwUid) {
              setSuccessMsg(`MIFARE Classic 1K detected (UID: ${hwUid}). Registering to wallet…`)
              await submitEnrollment(null, hwUid, 'MIFARE Classic 1K')
              return
            }
          }
        }

        // If tag has a hardware UID
        if (hwUid) {
          setSuccessMsg(`Card transponder detected (UID: ${hwUid}). Linking to digital wallet…`)
          await submitEnrollment(readToken, hwUid, 'MIFARE Classic 1K')
        } else {
          setError('Could not capture card serial number. Please tap again.')
          setStage('idle')
        }
      }

      ndef.onreadingerror = () => {
        setError('Card tap read error. Please hold the MIFARE Classic card steady against the NFC antenna.')
        setStage('idle')
      }
    } catch (err) {
      setError(err.message || 'NFC sensor could not be started.')
      setStage('idle')
    }
  }

  // 2. Simulated Tap (for desktop & testing MIFARE Classic 1K cards)
  const handleSimulateMifareTap = async (simulatedUid) => {
    if (!/^\d{4}$/.test(pin)) {
      setError('Please provide a valid 4-digit payment PIN.')
      return
    }

    const uidToUse = simulatedUid || manualUid || '04:A2:3B:6C'
    setError(null)
    setStage('scanning')
    setSuccessMsg(`Reading MIFARE Classic 1K transponder (UID: ${uidToUse})…`)

    setTimeout(async () => {
      setStage('enrolling')
      setSuccessMsg(`Pairing MIFARE Classic 1K UID ${uidToUse} with digital banking vault…`)
      await submitEnrollment(null, uidToUse, 'MIFARE Classic 1K')
    }, 700)
  }

  // 3. Authenticated Backend Registration
  const submitEnrollment = async (verifiedToken, hwUid, detectedCardType) => {
    setStage('enrolling')
    try {
      const res = await api.enrollCard({
        token: verifiedToken || undefined,
        hardwareUid: hwUid || undefined,
        cardType: detectedCardType || 'MIFARE Classic 1K',
        holderName: user?.name || 'Authorized Member',
        pin,
      })

      if (res?.data?.card) {
        setStage('success')
        setSuccessMsg(`Card (${res.data.card.cardType || 'MIFARE Classic 1K'}) enrolled & linked!`)
        await refreshSession()
        setTimeout(() => {
          if (onComplete) onComplete(res.data.card)
        }, 1200)
      }
    } catch (err) {
      setError(err.message || 'Server error while enrolling card.')
      setStage('idle')
    }
  }

  const isBusy = stage === 'scanning' || stage === 'writing' || stage === 'enrolling'

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[var(--bank-sidebar-bg)] flex items-start justify-center px-4 py-8 sm:py-12 sm:items-center">
      {/* Background glow decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-900/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-teal-900/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg animate-fade-in my-auto">
        <div className="bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden">
          {/* Top Emerald Accent Bar */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8.32a7.43 7.43 0 010 7.36" />
                    <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
                    <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
                    <path d="M16.37 2a20.4 20.4 0 010 20" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">NFC Card Enrollment</h1>
                  <p className="text-xs text-slate-500 mt-0.5">MIFARE Classic 1K &amp; NFC Forum Type 2 Compatible</p>
                </div>
              </div>
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer ml-3 shrink-0 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                >
                  Skip for now
                </button>
              )}
            </div>

            {/* Mode Selector */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setEnrollmentMode('auto')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  enrollmentMode === 'auto'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Contactless Card Tap
              </button>
              <button
                type="button"
                onClick={() => setEnrollmentMode('mifare')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  enrollmentMode === 'mifare'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                MIFARE Classic 1K Direct
              </button>
            </div>

            {/* Info Banner */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>MIFARE Classic 1K Support Active</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Compatible with <strong>MIFARE Classic 1K / 4K</strong> (ISO/IEC 14443-A standard) and <strong>NTAG213/215/216</strong> cards. Your physical card UID will be bound securely to your ₹1,000 digital wallet.
              </p>
            </div>

            {/* MIFARE Classic Manual Input Mode */}
            {enrollmentMode === 'mifare' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block text-xs font-semibold text-slate-800">
                  MIFARE Classic 1K Card UID (Hex Serial Number)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualUid}
                    onChange={(e) => setManualUid(e.target.value.toUpperCase())}
                    placeholder="e.g. 04:A2:3B:6C or 4A2B3C"
                    className="flex-1 px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setManualUid('04:A2:3B:6C')}
                    className="px-3 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl cursor-pointer"
                  >
                    Sample UID
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Found on the card surface or read by NFC scanning tools / USB readers.
                </p>
              </div>
            )}

            {/* Payment PIN Configuration */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-800">
                  Set 4-Digit Security PIN
                </label>
                <span className="text-[11px] text-slate-500">Required at checkout</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  className="w-32 px-3 py-2 text-center text-base font-mono font-bold tracking-widest bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <p className="text-xs text-slate-500 flex-1">
                  Default is <strong>1234</strong>. You will be prompted for this PIN whenever you tap to pay.
                </p>
              </div>
            </div>

            {/* Feedback Banners */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
                <span className="shrink-0 text-sm">⚠️</span>
                <span className="leading-relaxed flex-1">{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
                <span className="shrink-0 text-sm font-bold">✓</span>
                <span className="leading-relaxed flex-1">{successMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              {hasWebNFC ? (
                <button
                  id="enroll-scan-btn"
                  onClick={handleUniversalScan}
                  disabled={fetchingToken || isBusy}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer min-h-[48px]"
                >
                  {isBusy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {stage === 'idle'
                    ? 'Tap & Enroll MIFARE Classic Card'
                    : stage === 'scanning'
                    ? 'Hold MIFARE Classic Card to NFC Antenna…'
                    : stage === 'enrolling'
                    ? 'Linking Card to Digital Wallet…'
                    : 'Card Enrolled!'}
                </button>
              ) : null}

              {/* Simulation button (works anywhere) */}
              <button
                type="button"
                id="enroll-simulate-btn"
                onClick={() => handleSimulateMifareTap(enrollmentMode === 'mifare' ? manualUid : '04:A2:3B:6C')}
                disabled={fetchingToken || isBusy || stage === 'success'}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer min-h-[48px]"
              >
                {isBusy && !hasWebNFC && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {stage === 'idle'
                  ? `Simulate MIFARE Classic 1K Tap (${enrollmentMode === 'mifare' ? manualUid : '04:A2:3B:6C'})`
                  : stage === 'enrolling'
                  ? 'Registering MIFARE Classic in Vault…'
                  : 'Enrollment Complete!'}
              </button>

              <p className="text-[11px] text-center text-slate-400 leading-relaxed">
                Supports MIFARE Classic 1K physical cards via NFC UID detection or direct registration.
              </p>
            </div>

            {/* Footer */}
            <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
              Apex Digital Banking • ISO/IEC 14443-A &amp; MIFARE Classic Transponder Compatible
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Apex Bank Contactless Simulator • Demonstration Environment
        </p>
      </div>
    </div>
  )
}
