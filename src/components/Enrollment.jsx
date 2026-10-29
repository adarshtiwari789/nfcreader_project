import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Enrollment({ onComplete, onSkip }) {
  const { user, refreshSession } = useAuth()
  const [tokenData, setTokenData] = useState(null)
  const [fetchingToken, setFetchingToken] = useState(true)
  const [stage, setStage] = useState('idle') // 'idle' | 'writing' | 'verifying' | 'enrolling' | 'success'
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [pin, setPin] = useState('1234')
  const [hardwareUid, setHardwareUid] = useState('')

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

  // 1. Web NFC Write & Verification
  const handleWriteNfcCard = async () => {
    if (!tokenData?.token) return
    setError(null)
    setSuccessMsg(null)

    if (!/^\d{4}$/.test(pin)) {
      setError('Please provide a valid 4-digit payment PIN.')
      return
    }

    if (!hasWebNFC) {
      setError(
        'Web NFC is not supported in this browser. Use "Simulate Tag Write & Verification" below to test enrollment, or open Chrome on an NFC-enabled Android phone.'
      )
      return
    }

    setStage('writing')

    try {
      const ndef = new NDEFReader()

      // Step A: Write cryptographic token to NFC tag
      await ndef.write({
        records: [{ recordType: 'text', data: tokenData.token }],
      })

      setSuccessMsg('Token successfully written to the tag! Now verifying tag contents…')
      setStage('verifying')

      // Step B: Read back and verify
      await ndef.scan()

      ndef.onreading = async (event) => {
        let readToken = null
        const hwUid = event.serialNumber || ''
        setHardwareUid(hwUid)

        if (event.message?.records) {
          for (const record of event.message.records) {
            if (record.recordType === 'text') {
              const decoder = new TextDecoder(record.encoding || 'utf-8')
              readToken = decoder.decode(record.data)
              break
            }
          }
        }

        // Verify that tag content matches the generated token
        if (readToken === tokenData.token) {
          setSuccessMsg('Card verified! Registering card in your digital banking vault…')
          await submitEnrollment(tokenData.token, hwUid)
        } else {
          // Verification failed: do NOT enroll in database
          setError('Verification mismatch: Tag content did not match the generated token. Please try again.')
          setStage('idle')
        }
      }

      ndef.onreadingerror = () => {
        setError('Could not read NFC tag during verification. Please hold the tag steady and try again.')
        setStage('idle')
      }
    } catch (err) {
      setError(err.message || 'Failed to write NFC tag. Ensure the tag is writable and held near the NFC antenna.')
      setStage('idle')
    }
  }

  // 2. Simulated Tag Write & Verification (for desktop testing / unsupported devices)
  const handleSimulateWriteAndVerify = async () => {
    if (!tokenData?.token) return
    setError(null)

    if (!/^\d{4}$/.test(pin)) {
      setError('Please provide a valid 4-digit payment PIN.')
      return
    }

    setStage('writing')
    setSuccessMsg('Simulating contactless NDEF write to tag…')

    setTimeout(() => {
      setStage('verifying')
      setSuccessMsg('Simulating read-back verification from tag…')

      setTimeout(async () => {
        // Verification succeeded
        const mockUid = 'TAG-' + tokenData.token.slice(0, 14)
        setHardwareUid(mockUid)
        await submitEnrollment(tokenData.token, mockUid)
      }, 700)
    }, 700)
  }

  // 3. Authenticated Backend Registration (only called after verified write)
  const submitEnrollment = async (verifiedToken, hwUid) => {
    setStage('enrolling')
    try {
      const res = await api.enrollCard({
        token: verifiedToken,
        hardwareUid: hwUid || undefined,
        holderName: user?.name || 'Authorized Member',
        pin,
      })

      if (res?.data?.card) {
        setStage('success')
        setSuccessMsg('Card successfully enrolled and linked to your digital wallet!')
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

  const isBusy = stage === 'writing' || stage === 'verifying' || stage === 'enrolling'

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
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />

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
                  <p className="text-xs text-slate-500 mt-0.5">Link your physical tag to your ₹1,000 digital wallet</p>
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

            {/* Welcome banner */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-800">Welcome, {user?.name || 'Member'}!</p>
              <p className="text-xs leading-relaxed">
                Your account is credited with <strong>₹1,000 demo funds</strong>. To authorize contactless payments at checkout, write this secure token to an NFC tag (NTAG213, NTAG215, NTAG216, or Mifare Ultralight).
              </p>
            </div>

            {/* Generated Token Box */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Cryptographic Enrollment Token</span>
                <span className="text-[10px] font-medium bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Vault Protected
                </span>
              </div>
              {fetchingToken ? (
                <div className="py-3 text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  Generating unique cryptographic token…
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-mono text-xs font-bold text-slate-900 bg-white p-3 rounded-xl border border-emerald-300 break-all select-all leading-relaxed shadow-xs">
                    {tokenData?.token || 'TOKEN-UNAVAILABLE'}
                  </p>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                    <span>Reference Mask: <strong className="font-mono text-slate-800">{tokenData?.masked}</strong></span>
                    <button
                      type="button"
                      onClick={loadToken}
                      className="text-emerald-700 hover:underline font-semibold cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment PIN Configuration */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-800">
                  Set 4-Digit Payment PIN
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
                  id="enroll-write-btn"
                  onClick={handleWriteNfcCard}
                  disabled={fetchingToken || isBusy}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer min-h-[48px]"
                >
                  {isBusy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {stage === 'idle' ? 'Write NFC Card & Verify'
                    : stage === 'writing' ? 'Hold Card Near NFC Antenna…'
                    : stage === 'verifying' ? 'Verifying Card Token…'
                    : stage === 'enrolling' ? 'Linking to Digital Wallet…'
                    : 'Card Enrolled!'}
                </button>
              ) : (
                <div className="space-y-2.5">
                  <button
                    id="enroll-simulate-btn"
                    onClick={handleSimulateWriteAndVerify}
                    disabled={fetchingToken || isBusy || stage === 'success'}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer min-h-[48px]"
                  >
                    {isBusy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {stage === 'idle'
                      ? 'Simulate Tag Write & Verification'
                      : stage === 'writing'
                      ? 'Simulating Tag Write…'
                      : stage === 'verifying'
                      ? 'Verifying Token Match…'
                      : stage === 'enrolling'
                      ? 'Registering Card in Banking Vault…'
                      : 'Enrollment Complete!'}
                  </button>
                  <p className="text-[11px] text-center text-slate-400 leading-relaxed">
                    Web NFC requires Chrome for Android. On desktop, click the button above to simulate writing and verify before registering.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
              Apex Digital Banking • Multi-factor contactless authentication
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
