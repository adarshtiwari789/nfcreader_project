import { useState } from 'react'

/* ── Mock wallet database keyed by NFC UID ── */
const MOCK_WALLETS = {
  '04:A2:3B:6C:D1:00:80': { balance: 2450.00, status: 'Active' },
  '04:B1:4C:7D:E2:00:81': { balance: 890.50,  status: 'Active' },
  '04:C0:5D:8E:F3:00:82': { balance: 125.00,  status: 'Suspended' },
}
const DEFAULT_WALLET = { balance: 1500.00, status: 'Active' }

/* ── Inline icons ── */
const NfcIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 8.32a7.43 7.43 0 010 7.36" /><path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
    <path d="M12.91 4.1a16.07 16.07 0 010 15.8" /><path d="M16.37 2a20.4 20.4 0 010 20" />
  </svg>
)
const CheckIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
)
const WalletIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
)
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
)
const IdIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="6" y1="10" x2="18" y2="10" /><line x1="6" y1="14" x2="14" y2="14" /></svg>
)
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
)

/* ── Status dot ── */
function StatusDot({ status }) {
  const isIdle = status === 'idle'
  const isScanning = status === 'scanning'
  const isSuccess = status === 'success'
  return (
    <span className="relative flex h-2.5 w-2.5">
      {(isScanning || isSuccess) && (
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${isSuccess ? 'bg-[var(--color-success)]' : 'bg-amber-400'}`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSuccess ? 'bg-[var(--color-success)]' : isScanning ? 'bg-amber-400' : 'bg-[var(--color-text-tertiary)]'}`} />
    </span>
  )
}

export default function NFCWallet() {
  const [scanState, setScanState] = useState('idle')   // idle | scanning | success
  const [cardData, setCardData]   = useState(null)
  const [error, setError]         = useState(null)

  const statusLabel = scanState === 'idle' ? 'Ready' : scanState === 'scanning' ? 'Waiting for card…' : 'Card detected'

  async function handleScan() {
    setError(null)
    setCardData(null)
    setScanState('scanning')

    /* Check Web NFC support */
    if (!('NDEFReader' in window)) {
      setError('Web NFC is not supported on this browser. Try Chrome on Android.')
      setScanState('idle')
      return
    }

    try {
      const ndef = new NDEFReader()
      await ndef.scan()

      ndef.onreading = (event) => {
        const uid = event.serialNumber || 'Unknown'
        let username = 'Unknown User'

        /* Attempt to read username from NDEF records */
        if (event.message && event.message.records) {
          for (const record of event.message.records) {
            if (record.recordType === 'text') {
              const decoder = new TextDecoder(record.encoding || 'utf-8')
              username = decoder.decode(record.data)
              break
            }
          }
        }

        const wallet = MOCK_WALLETS[uid] || DEFAULT_WALLET

        setCardData({
          username,
          uid,
          balance: wallet.balance,
          status: wallet.status,
          timestamp: new Date().toLocaleString(),
        })
        setScanState('success')
      }

      ndef.onreadingerror = () => {
        setError('Could not read NFC tag. Try again.')
        setScanState('idle')
      }
    } catch (err) {
      setError(err.message || 'NFC scan failed.')
      setScanState('idle')
    }
  }

  return (
    <section id="nfc-section" className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
          NFC Wallet
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Tap your NFC card to view your wallet.
        </p>
      </div>

      <div className="max-w-md mx-auto flex flex-col gap-5">
        {/* ── Reader status ── */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border)]">
          <StatusDot status={scanState} />
          <span className="text-xs font-medium text-[var(--color-text-secondary)] tracking-wide uppercase">
            {statusLabel}
          </span>
        </div>

        {/* ── NFC card preview ── */}
        <div className={`relative rounded-[var(--radius)] p-6 border transition-all duration-500 overflow-hidden ${
          scanState === 'success'
            ? 'bg-[var(--color-success-bg)] border-[var(--color-success)]/30'
            : 'bg-[var(--color-surface)] border-[var(--color-border)]'
        } shadow-[var(--shadow-md)]`}>
          {/* Decorative rings */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border border-[var(--color-border)] opacity-30" />
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border border-[var(--color-border)] opacity-20" />

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <WalletIcon />
              <span className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-secondary)]">
                NFC Card
              </span>
            </div>
            <NfcIcon size={20} className="text-[var(--color-text-tertiary)]" />
          </div>

          {scanState === 'idle' && !cardData && (
            <div className="text-center py-8">
              <NfcIcon size={48} className="mx-auto text-[var(--color-text-tertiary)] mb-3" />
              <p className="text-sm text-[var(--color-text-tertiary)]">
                No card scanned yet
              </p>
            </div>
          )}

          {scanState === 'scanning' && (
            <div className="text-center py-8">
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-amber-300 opacity-40" style={{ animation: 'pulse-ring 1.5s ease-out infinite' }} />
                <div className="absolute inset-2 rounded-full border-2 border-amber-300 opacity-30" style={{ animation: 'pulse-ring 1.5s ease-out 0.3s infinite' }} />
                <NfcIcon size={28} className="text-amber-500 animate-spin-slow" />
              </div>
              <p className="mt-4 text-sm font-medium text-[var(--color-text-secondary)]">
                Waiting for NFC card…
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                Hold your card near the device
              </p>
            </div>
          )}

          {scanState === 'success' && cardData && (
            <div className="animate-fade-in-up">
              {/* Success badge */}
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-full bg-[var(--color-success)] text-white flex items-center justify-center animate-scale-in shadow-lg shadow-green-200">
                  <CheckIcon />
                </div>
              </div>

              {/* Card info grid */}
              <div className="space-y-3">
                <InfoRow icon={<UserIcon />} label="Username" value={cardData.username} />
                <InfoRow icon={<IdIcon />} label="NFC UID" value={cardData.uid} mono />
                <InfoRow icon={<WalletIcon />} label="Balance" value={`$${cardData.balance.toFixed(2)}`} highlight />
                <InfoRow
                  icon={<StatusDotSmall active={cardData.status === 'Active'} />}
                  label="Card Status"
                  value={cardData.status}
                  statusColor={cardData.status === 'Active' ? 'text-[var(--color-success)]' : 'text-amber-500'}
                />
              </div>

              {/* Timestamp */}
              <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center gap-1.5">
                <ClockIcon />
                <span className="text-[11px] text-[var(--color-text-tertiary)]">
                  Scanned {cardData.timestamp}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-[var(--radius-sm)] text-xs text-red-600 animate-fade-in">
            {error}
          </div>
        )}

        {/* ── Scan button ── */}
        <button
          id="scan-nfc-btn"
          onClick={handleScan}
          disabled={scanState === 'scanning'}
          className={`relative w-full py-4 text-sm font-medium tracking-wide rounded-[var(--radius)] transition-all duration-300 cursor-pointer ${
            scanState === 'scanning'
              ? 'bg-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed'
              : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] active:scale-[0.98] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <NfcIcon size={18} className="inline-block" />
            {scanState === 'scanning' ? 'Scanning…' : 'Scan NFC Card'}
          </span>
        </button>
      </div>
    </section>
  )
}

/* ── Helpers ── */
function InfoRow({ icon, label, value, mono, highlight, statusColor }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-[var(--radius-sm)]">
      <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className={`text-sm font-medium ${mono ? 'font-mono text-xs' : ''} ${highlight ? 'text-[var(--color-text)] font-semibold' : ''} ${statusColor || 'text-[var(--color-text)]'}`}>
        {value}
      </span>
    </div>
  )
}

function StatusDotSmall({ active }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-[var(--color-success)]' : 'bg-amber-400'}`} />
  )
}
