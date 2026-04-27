import { useState, useEffect } from 'react'
import { useWriteContract } from 'wagmi'
import { CONTRACT_ADDRESS, PREDICTOR_ABI } from '@/config/wagmi'
import { useLanguage, usePriceData } from '@/hooks/useGameData'
import { STEP_DURATIONS } from '@/config/wagmi'
import { formatDuration } from '@/i18n'

interface Props {
  waitingUntil: number
  currentStep: number
}

export default function WaitingCard({ waitingUntil, currentStep }: Props) {
  const { tr, lang } = useLanguage()
  const prices = usePriceData()
  const [remaining, setRemaining] = useState(0)
  const { writeContract, isPending } = useWriteContract()

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      setRemaining(Math.max(0, Number(waitingUntil) - now))
    }, 1000)
    return () => clearInterval(interval)
  }, [waitingUntil])

  const waitDuration = STEP_DURATIONS[currentStep] // durasi sesuai step

  function handleResolve() {
    if (!prices.btcPrice) return
    const currentPrice = Math.round(prices.btcPrice * 1e8)
    writeContract({
      address: CONTRACT_ADDRESS.BTCOraclePredictorV2,
      abi: PREDICTOR_ABI,
      functionName: 'resolveBet',
      args: [BigInt(currentPrice)],
      gas: 500000n,
    })
  }

  return (
    <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-6 text-center space-y-3 backdrop-blur-md">
      <div className="text-4xl">⏳</div>
      <div className="font-mono text-base font-bold text-red-400">{tr.masaTunggu}</div>
      <div className="text-xs text-slate-300 font-mono">
        {lang === 'id'
          ? `Salah — akan di-reset ke Step 1 setelah durasi selesai`
          : `Wrong — will reset to Step 1 after duration ends`}
      </div>
      <div className="font-mono text-2xl font-bold text-white">
        {remaining > 0 ? formatDuration(remaining, tr) : lang === 'id' ? 'Selesai!' : 'Done!'}
      </div>
      <div className="text-xs text-slate-400 font-mono">
        {lang === 'id' ? 'Durasi tunggu:' : 'Wait duration:'} {formatDuration(waitDuration, tr)}
      </div>

      {/* Tombol mulai tebak baru — aktif hanya saat waktu tunggu habis */}
      {remaining <= 0 && (
        <div className="text-center">
          <div className="font-mono text-sm font-bold text-green-400 mb-1">
            ✅ {lang === 'id' ? 'Selesai! Silakan pasang tebakan baru.' : 'Done! Place a new prediction.'}
          </div>
          <div className="font-mono text-xs text-slate-300">
            {lang === 'id'
              ? 'Step di-reset ke 1. Pasang tebakan baru di panel bawah.'
              : 'Step reset to 1. Place your new bet in the panel below.'}
          </div>
        </div>
      )}

      {(isPending) && (
        <div className="text-center font-mono text-xs text-slate-300 animate-pulse">
          {lang === 'id' ? 'Menunggu transaksi di blockchain...' : 'Waiting for blockchain transaction...'}
        </div>
      )}
    </div>
  )
}