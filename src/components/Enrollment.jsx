import { useState, useEffect } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Enrollment({ onComplete, onSkip }) {
  const { user, refreshSession } = useAuth()
  const [tokenData, setTokenData] = useState(null)
  const [fetchingToken, setFetchingToken] = useState(true)
  const [stage, setStage] = useState('idle') // 'idle' | 'writing' | 'written' | 'verifying' | 'enrolling' | 'success'
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [hardwareUid, setHardwareUid] = useState('')
  const [manualToken, setManualToken] = useState('')

  // Check Web NFC support
  const hasWebNFC = typeof window !== 'undefined' && 'NDEFReader' in window

  // Fetch unique cryptographic token from backend
  const loadToken = async () => {
    setFetchingToken(true)
    setError(null)
    try {
      const res = await api.getEnrollmentToken()
      if (res?.data?.token) {
        setTokenData(res.data)
        setManualToken(res.data.token)
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

  // Write token to physical NFC card using Web NFC NDEFReader
  const handleWriteToTag = async () => {
    if (!tokenData?.token) return
    setError(null)
    setSuccessMsg(null)
    setStage('writing')

    if (!hasWebNFC) {
      setError('Web NFC is not supported in this desktop browser. You can use the "Simulate Tag Write & Verification" button below to test enrollment, or open Chrome on an NFC-enabled Android phone.')
      setStage('idle')
      return
    }

    try {
      const ndef = new NDEFReader()
      // Write NDEF text record containing the secure token
      await ndef.write({
        records: [
          {
            recordType: 'text',
            data: tokenData.token,
          },
        ],
      })

      setSuccessMsg('Token successfully written to the NFC tag! Now verifying…')
      setStage('verifying')

      // Prompt to scan/verify what was written
      await handleVerifyTag()
    } catch (err) {
      setError(err.message || 'Failed to write NFC tag. Ensure the tag is writable and held near the NFC antenna.')
      setStage('idle')
    }
  }

  // Read back the token from the tag to verify the write before submitting
  const handleVerifyTag = async () => {
    if (!hasWebNFC) return
    setError(null)
    setStage('verifying')

    try {
      const ndef = new NDEFReader()
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

        if (readToken === tokenData.token) {
          setSuccessMsg('Read verified! Associating card with your digital wallet…')
          await submitEnrollment(tokenData.token, hwUid)
        } else {
          setError('Verification mismatch: Tag content did not match the generated token.')
          setStage('idle')
        }
      }

      ndef.onreadingerror = () => {
        setError('Error reading NFC tag during verification. Please tap again.')
        setStage('idle')
      }
    } catch (err) {
      setError(err.message || 'Error initializing verification reader.')
      setStage('idle')
    }
  }

  // Simulation verification (for desktop / development / testing without Android)
  const handleSimulateWriteAndVerify = async () => {
    if (!tokenData?.token) return
    setError(null)
    setSuccessMsg('Simulating NDEF write to transponder…')
    setStage('writing')

    setTimeout(async () => {
      setSuccessMsg('Simulating NDEF read-back verification…')
      setStage('verifying')

      setTimeout(async () => {
        const mockUid = '04:A2:3B:6C:D1:00:80'
        setHardwareUid(mockUid)
        await submitEnrollment(tokenData.token, mockUid)
      }, 700)
    }, 700)
  }

  // Submit verified token to backend
  const submitEnrollment = async (tokenToSubmit, hwUid) => {
    setStage('enrolling')
    try {
      const res = await api.enrollCard({
        token: tokenToSubmit,
        hardwareUid: hwUid || undefined,
        holderName: user?.name || 'Authorized Member',
      })

      if (res?.data?.card) {
        setStage('success')
        setSuccessMsg('Card successfully enrolled and linked to your wallet balance!')
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bank-sidebar-bg)] p-6">
      <div className="w-full max-w-lg bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] p-8 animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8.32a7.43 7.43 0 010 7.36" />
                <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
                <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
                <path d="M16.37 2a20.4 20.4 0 010 20" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">NFC Card Enrollment</h1>
              <p className="text-xs text-slate-500">Link your physical contactless tag to your ₹1,000 wallet</p>
            </div>
          </div>
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              Skip for now
            </button>
          )}
        </div>

        {/* Informational Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800">Welcome, {user?.name || 'Member'}!</p>
          <p>
            Your account is provisioned with <strong>₹1,000 demo credits</strong> in your digital wallet. To use contactless tap-to-pay, enroll a compatible NFC tag (NTAG213, NTAG215, NTAG216, or Mifare Ultralight).
          </p>
        </div>

        {/* Token Box */}
        <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Generated Cryptographic Token</span>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              SHA-256 Protected
            </span>
          </div>
          {fetchingToken ? (
            <div className="py-2 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              Generating token from backend crypto…
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-mono text-xs font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-emerald-300 break-all select-all">
                {tokenData?.token || 'TOKEN-UNAVAILABLE'}
              </p>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Display Mask: <strong className="font-mono text-slate-800">{tokenData?.masked}</strong></span>
                <button
                  type="button"
                  onClick={loadToken}
                  className="text-emerald-700 hover:underline font-medium cursor-pointer"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status / Feedback */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <span className="shrink-0 font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <span className="shrink-0 font-bold">✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          {hasWebNFC ? (
            <button
              id="enroll-write-btn"
              onClick={handleWriteToTag}
              disabled={fetchingToken || stage === 'writing' || stage === 'verifying' || stage === 'enrolling'}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer min-h-[44px]"
            >
              {stage === 'writing' && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {stage === 'verifying' && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {stage === 'enrolling' && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {stage === 'idle' ? 'Write & Verify NFC Tag' : stage === 'writing' ? 'Hold Tag to NFC Antenna…' : stage === 'verifying' ? 'Verifying Tag Data…' : stage === 'enrolling' ? 'Linking to Wallet…' : 'Card Enrolled!'}
            </button>
          ) : (
            <div className="space-y-2">
              <button
                id="enroll-simulate-btn"
                onClick={handleSimulateWriteAndVerify}
                disabled={fetchingToken || stage !== 'idle'}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer min-h-[44px]"
              >
                {stage !== 'idle' && stage !== 'success' && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {stage === 'idle'
                  ? 'Simulate Tag Write & Verification'
                  : stage === 'writing'
                  ? 'Simulating Write…'
                  : stage === 'verifying'
                  ? 'Simulating Verification…'
                  : stage === 'enrolling'
                  ? 'Linking to Wallet…'
                  : 'Enrollment Complete!'}
              </button>
              <p className="text-[11px] text-center text-slate-400">
                Web NFC is active on Chrome for Android. On desktop, simulation writes and links the token securely.
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
          Apex Bank Contactless Core • Tokens are hashed with SHA-256 before storage
        </div>
      </div>
    </div>
  )
}

