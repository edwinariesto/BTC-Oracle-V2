import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, PREDICTOR_ABI } from '@/config/wagmi'
import { useLanguage, usePriceData } from '@/hooks/useGameData'

interface Props {
  direction: boolean
  startPrice: number
  endTime: number
  currentDuration: number
}

export default function BetCard({ direction, startPrice, endTime, currentDuration }: Props) {
  const { tr, lang } = useLanguage()
  const prices = usePriceData()
  const [remaining, setRemaining] = useState(0)
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: hash ?? undefined })

  const now = Math.floor(Date.now() / 1000)
  const timeLeft = Math.max(0, endTime - now)
  const canResolve = timeLeft === 0

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      setRemaining(Math.max(0, endTime - now))
    }, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  function formatTime(sec: number) {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    if (h > 0) return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
  }

  function handleResolve() {
    if (!prices.btcPrice) return
    // Harga BTC × 1e8 (format contract)
    const currentPrice = Math.round(prices.btcPrice * 1e8)
    writeContract({
      address: CONTRACT_ADDRESS.BTCOraclePredictorV2,
      abi: PREDICTOR_ABI,
      functionName: 'resolveBet',
      args: [BigInt(currentPrice)],
      gas: 200000n,
    })
  }

  // Listen for tx success to show result
  useEffect(() => {
    if (hash && !isPending && !isConfirming) {
      // Transaction confirmed — result will be reflected by blockchain state change
    }
  }, [hash, isPending, isConfirming])

  const startPriceDisplay = startPrice > 0
    ? '$' + (startPrice / 1e8).toLocaleString('en-US', { maximumFractionDigits: 0 })
    : '-'

  const currentPriceDisplay = prices.btcPrice > 0
    ? '$' + prices.btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : null

  return (
    <div className="bg-accent/10 border border-accent/40 rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
      <div className="text-center">
        <div className="text-xs uppercase tracking-widest text-accent font-mono mb-1">
          ⏳ {tr.betAktif}
        </div>
        <div className={`font-mono text-3xl font-bold ${direction ? 'text-up' : 'text-down'}`}>
          {direction ? '📈 ' + tr.naik : '📉 ' + tr.turun}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1 font-mono">{tr.hargaTersimpan}</div>
          <div className="font-mono text-sm font-bold text-gray-800">{startPriceDisplay}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1 font-mono">{tr.hargaSekarang}</div>
          <div className="font-mono text-sm font-bold text-[#f7931a]">
            {currentPriceDisplay ?? (prices.loading ? '...' : '-')}
          </div>
        </div>
      </div>

      {startPrice > 0 && currentPriceDisplay && (
        <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-500 font-mono">{tr.perubahan}</div>
          {(() => {
            const stored = startPrice / 1e8
            const curr = prices.btcPrice
            const diff = curr - stored
            const pct = ((diff / stored) * 100).toFixed(3)
            return (
              <div className={`font-mono text-sm font-bold ${diff >= 0 ? 'text-up' : 'text-down'}`}>
                {diff >= 0 ? '+' : ''}{diff.toFixed(0)} ({diff >= 0 ? '+' : ''}{pct}%)
              </div>
            )
          })()}
        </div>
      )}

      {/* Countdown / Ready */}
      <div className="text-center">
        {timeLeft > 0 ? (
          <>
            <div className="font-mono text-xs text-gray-500 mb-1">{tr.tungguDurasiHabis}</div>
            <div className="font-mono text-3xl font-bold text-gray-800">
              {formatTime(timeLeft)}
            </div>
          </>
        ) : (
          <>
            <div className="font-mono text-xs text-up mb-1">{tr.hargaDisimpan}</div>
            <div className="font-mono text-xl font-bold text-up">
              ✅ {tr.klikCekHasil}
            </div>
          </>
        )}
      </div>

      {/* Tombol CEK HASIL */}
      {canResolve && (
        <button
          onClick={handleResolve}
          disabled={isPending || isConfirming || prices.loading}
          className={`w-full py-4 font-bold font-mono rounded-xl text-xl transition-all ${
            direction
              ? 'bg-up hover:bg-up/90 text-black disabled:opacity-40'
              : 'bg-down hover:bg-down/90 text-gray-800 disabled:opacity-40'
          }`}
        >
          {isPending || isConfirming
            ? tr.menunguKonfirmasi
            : `✅ ${tr.cekHasil}`}
        </button>
      )}

      {isPending && (
        <div className="text-center font-mono text-xs text-gray-500 animate-pulse">
          {lang === 'id' ? 'Menunggu transaksi di blockchain...' : 'Waiting for blockchain transaction...'}
        </div>
      )}

      {error && (
        <div className="bg-down/10 border border-down/30 rounded-lg p-2 text-xs font-mono text-down">
          Error: {(error as any).message?.slice(0, 100)}
        </div>
      )}
    </div>
  )
}
