import { useState, useEffect, useRef } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, PREDICTOR_ABI, DIR } from '@/config/wagmi'
import { useLanguage, usePriceData } from '@/hooks/useGameData'
import { formatDuration } from '@/i18n'
import Swal from 'sweetalert2'

interface Props {
  currentStep: number
  nextDuration: number
  nextRewardWei: number
  hasActiveBet: boolean
  betDirection: number   // 0=TURUN, 1=SAMA, 2=NAIK
  betStartPrice: number
  betEndTime: number
  resetCounter?: number
  refetchFn?: () => void
  onNewBet?: () => void
  onResult?: (result: 'won' | 'lost' | 'draw' | null) => void
}

// Total 30 hari: Step1=30s, Step2=1m, Step3=5m, Step4=30m, Step5=2h, Step6=10h,
// Step7=2d, Step8=6d, Step9=10d, Step10=11.47d
const STEP_LABELS_ID = [
  'Step 1 · 30 detik', 'Step 2 · 1 menit', 'Step 3 · 5 menit',
  'Step 4 · 30 menit', 'Step 5 · 2 jam', 'Step 6 · 10 jam',
  'Step 7 · 2 hari', 'Step 8 · 6 hari', 'Step 9 · 10 hari', 'Step 10 · 11.5 hari',
]
const STEP_LABELS_EN = [
  'Step 1 · 30 sec', 'Step 2 · 1 min', 'Step 3 · 5 min',
  'Step 4 · 30 min', 'Step 5 · 2 hrs', 'Step 6 · 10 hrs',
  'Step 7 · 2 days', 'Step 8 · 6 days', 'Step 9 · 10 days', 'Step 10 · 11.5 days',
]
const STEP_REWARDS_MON = [0.0005, 0.0005, 0.0005, 0.0005, 0.0005, 0.0005, 0.0005, 0.0005, 0.0005, 0.0005]

type BetPhase = 'idle' | 'confirming' | 'pending' | 'betActive'

function DirectionLabel({ dir, lang }: { dir: number; lang: string }) {
  if (dir === DIR.NAIK) return <>{lang === 'id' ? 'NAIK' : 'UP'}</>
  if (dir === DIR.TURUN) return <>{lang === 'id' ? 'TURUN' : 'DOWN'}</>
  return <>{lang === 'id' ? 'SAMA' : 'SAME'}</>
}

function DirectionIcon({ dir, size = 'text-4xl' }: { dir: number; size?: string }) {
  if (dir === DIR.NAIK) return <span className={`${size}`}>▲</span>
  if (dir === DIR.TURUN) return <span className={`${size}`}>▼</span>
  return <span className={`${size}`}>=</span>
}

export default function DirectionPanel({
  currentStep,
  nextDuration,
  hasActiveBet,
  betDirection,
  betStartPrice,
  betEndTime,
  resetCounter = 0,
  refetchFn,
  onNewBet,
  onResult,
}: Props) {
  const { tr, lang } = useLanguage()
  const prices = usePriceData()
  const [direction, setDirection] = useState<number | null>(null)
  const [phase, setPhase] = useState<BetPhase>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { writeContract, data: writeHash, isPending: isWritePending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: writeHash })

  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (resetCounter > 0) {
      setPhase('idle')
      setDirection(null)
      setErrorMsg(null)
      onNewBet?.()
      onResult?.(null)
    }
  }, [resetCounter])

  const txInFlight = isWritePending || isConfirming

  useEffect(() => {
    if (phase !== 'pending') return
    if (isConfirmed) {
      if (refetchTimer.current) clearTimeout(refetchTimer.current)
      refetchFn?.()
      setTimeout(() => {
        setPhase('idle')
        setDirection(null)
      }, 800)
    }
    if (!isWritePending && !isConfirming && !isConfirmed) {
      setPhase('idle')
      setDirection(null)
      setErrorMsg(lang === 'id' ? 'Gagal di blockchain' : 'Failed on-chain')
      setTimeout(() => setErrorMsg(null), 5000)
    }
  }, [isWritePending, isConfirming, isConfirmed, phase, lang])

  useEffect(() => {
    if (writeError) {
      setPhase('idle')
      setDirection(null)
      const msg = (writeError as any)?.shortMessage || (writeError as any)?.message || ''
      if (msg.includes('gas') || msg.includes('intrinsic') || msg.includes('revert')) {
        setErrorMsg(lang === 'id' ? 'TX gagal' : 'TX failed')
      } else {
        setErrorMsg(lang === 'id' ? 'MetaMask ditolak' : 'MetaMask rejected')
      }
      setTimeout(() => setErrorMsg(null), 5000)
    }
  }, [writeError, lang])

  if (hasActiveBet) {
    return (
      <BetActiveView
        direction={betDirection}
        startPrice={betStartPrice}
        endTime={betEndTime > 0 ? betEndTime : (Math.floor(Date.now() / 1000) + nextDuration)}
        currentStep={currentStep}
        nextDuration={nextDuration}
        tr={tr}
        lang={lang}
        refetchFn={refetchFn}
        onResult={onResult}
        hasActiveBet={hasActiveBet}
      />
    )
  }

  if (phase === 'pending') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-green-400 font-mono font-bold mb-1">
            ⏳ {lang === 'id' ? 'Menyimpan...' : 'Storing...'}
          </div>
          <div className="font-mono text-2xl font-bold text-green-400">
            {STEP_REWARDS_MON[currentStep]?.toFixed(4) ?? '0.0005'} MON
          </div>
        </div>
        <div className="text-center bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="text-xl mb-1 animate-pulse">⏳</div>
          <div className="font-mono text-sm font-bold text-white/70">
            {lang === 'id' ? 'Konfirmasi di blockchain...' : 'Confirming on blockchain...'}
          </div>
          {isConfirmed && (
            <div className="font-mono text-xs text-green-400 font-bold mt-1 animate-pulse">
              ✅ {lang === 'id' ? 'Berhasil!' : 'Success!'}
            </div>
          )}
        </div>
        {errorMsg && (
          <div className="text-center bg-red-500/20 border border-red-400/40 rounded-lg p-2">
            <div className="font-mono text-xs font-bold text-red-300">{errorMsg}</div>
          </div>
        )}
      </div>
    )
  }

  if (phase === 'confirming') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-green-400 font-mono font-bold mb-1">
            ⏳ {lang === 'id' ? 'Menunggu MetaMask...' : 'Waiting for MetaMask...'}
          </div>
          <div className="font-mono text-2xl font-bold text-green-400">
            {STEP_REWARDS_MON[currentStep]?.toFixed(4) ?? '0.0005'} MON
          </div>
        </div>
        <div className="text-center bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="text-xl mb-1 animate-pulse">⏳</div>
          <div className="font-mono text-sm font-bold text-white/70">
            {lang === 'id' ? 'Buka MetaMask untuk konfirmasi...' : 'Open MetaMask to confirm...'}
          </div>
        </div>
        <button
          onClick={() => { setPhase('idle'); setDirection(null); setErrorMsg(null) }}
          className="w-full py-2 bg-slate-800 border border-slate-700 text-white/70 font-mono text-sm font-bold rounded-lg hover:bg-white/20 transition-all"
        >
          {lang === 'id' ? 'Batal' : 'Cancel'}
        </button>
      </div>
    )
  }

  // ── IDLE: prediction panel ─────────────────────────────────────────────────

  const stepLabels = lang === 'id' ? STEP_LABELS_ID : STEP_LABELS_EN
  const stepLabel = stepLabels[currentStep] ?? STEP_LABELS_ID[0]
  const rewardMON = STEP_REWARDS_MON[currentStep]?.toFixed(3) ?? '0.101'

  function handlePlaceBet() {
    if (txInFlight) return
    if (direction === null || !prices.btcPrice) return
    if (hasActiveBet) return

    const startPrice = Math.round(prices.btcPrice * 1e8)
    setErrorMsg(null)

    writeContract({
      address: CONTRACT_ADDRESS.BTCOraclePredictorV2,
      abi: PREDICTOR_ABI,
      functionName: 'placeBet',
      args: [direction, BigInt(startPrice)],
      gas: 500000n,
    })
    setPhase('pending')
  }

  const confirmDisabled = txInFlight || direction === null || !prices.btcPrice

  const confirmLabel = () => {
    if (isWritePending) return `⏳ ${lang === 'id' ? 'Menyimpan...' : 'Storing...'}`
    if (direction === null) return tr.pilihNaikTurun
    if (!prices.btcPrice) return lang === 'id' ? 'Memuat harga...' : 'Loading price...'
    if (direction === DIR.NAIK) return lang === 'id' ? 'Konfirmasi ▲ NAIK' : 'Confirm ▲ UP'
    if (direction === DIR.TURUN) return lang === 'id' ? 'Konfirmasi ▼ TURUN' : 'Confirm ▼ DOWN'
    return lang === 'id' ? 'Konfirmasi = SAMA' : 'Confirm = SAME'
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-xs uppercase tracking-widest text-slate-500 font-mono font-bold mb-1">
          ⚡ {stepLabel}
        </div>
        <div className="font-mono text-2xl font-bold text-green-600">{rewardMON} MON</div>
        <div className="font-mono text-xs text-slate-500">
          {tr.durasi}: {formatDuration(nextDuration, tr)}
        </div>
      </div>

      {/* 3 Direction buttons */}
      <div className="grid grid-cols-3 gap-2">
        {/* TURUN */}
        <button
          onClick={() => setDirection(DIR.TURUN)}
          className={`py-3 rounded-xl font-bold font-mono text-sm transition-all border-2 flex flex-col items-center gap-1 ${
            direction === DIR.TURUN
              ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20'
              : 'bg-white border-red-400/40 text-red-600 hover:bg-red-50 hover:border-red-400/60'
          }`}
        >
          <span className="text-2xl">▼</span>
          <span>{tr.turun}</span>
        </button>

        {/* SAMA */}
        <button
          onClick={() => setDirection(DIR.SAMA)}
          className={`py-3 rounded-xl font-bold font-mono text-sm transition-all border-2 flex flex-col items-center gap-1 ${
            direction === DIR.SAMA
              ? 'bg-yellow-500 border-yellow-500 text-white shadow-md shadow-yellow-500/20'
              : 'bg-white border-yellow-400/40 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-400/60'
          }`}
        >
          <span className="text-2xl">=</span>
          <span>{lang === 'id' ? 'SAMA' : 'SAME'}</span>
        </button>

        {/* NAIK */}
        <button
          onClick={() => setDirection(DIR.NAIK)}
          className={`py-3 rounded-xl font-bold font-mono text-sm transition-all border-2 flex flex-col items-center gap-1 ${
            direction === DIR.NAIK
              ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-500/20'
              : 'bg-white border-green-400/40 text-green-600 hover:bg-green-50 hover:border-green-400/60'
          }`}
        >
          <span className="text-2xl">▲</span>
          <span>{tr.naik}</span>
        </button>
      </div>

      {/* Price preview */}
      {direction !== null && !isWritePending && (
        <div className="text-center text-xs text-slate-600 font-mono bg-slate-100 border border-slate-200 rounded-lg p-2">
          {direction === DIR.NAIK
            ? (lang === 'id' ? 'Anda memilih: ▲ NAIK (harga naik)' : 'You chose: ▲ UP (price goes up)')
            : direction === DIR.TURUN
            ? (lang === 'id' ? 'Anda memilih: ▼ TURUN (harga turun)' : 'You chose: ▼ DOWN (price goes down)')
            : (lang === 'id' ? 'Anda memilih: = SAMA (harga diam)' : 'You chose: = SAME (price stays still)')}
          <br />
          {lang === 'id' ? 'Harga BTC tersimpan: $' : 'BTC price stored: $'}
          <span className="text-slate-800 font-bold">
            {prices.btcPrice > 0
              ? prices.btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
              : '...'}
          </span>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-2">
          <div className="font-mono text-xs font-bold text-red-600">{errorMsg}</div>
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handlePlaceBet}
        disabled={confirmDisabled}
        className={`w-full py-3 font-bold font-mono rounded-xl text-base transition-all ${
          direction === DIR.NAIK
            ? 'bg-green-500 hover:bg-green-400 text-white disabled:opacity-40'
            : direction === DIR.TURUN
            ? 'bg-red-500 hover:bg-red-400 text-white disabled:opacity-40'
            : direction === DIR.SAMA
            ? 'bg-yellow-500 hover:bg-yellow-400 text-white disabled:opacity-40'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
        }`}
      >
        {confirmLabel()}
      </button>
    </div>
  )
}

// ============================================================
// BetActiveView: countdown + auto resolve + result + price comparison
// ============================================================
function BetActiveView({
  direction,
  startPrice,
  endTime,
  currentStep,
  nextDuration,
  tr,
  lang,
  refetchFn,
  onResult,
  hasActiveBet,
}: {
  direction: number
  startPrice: number
  endTime: number
  currentStep: number
  nextDuration: number
  tr: any
  lang: string
  refetchFn?: () => void
  onResult?: (result: 'won' | 'lost' | 'draw' | null) => void
  hasActiveBet: boolean
}) {
  const prices = usePriceData()
  const { writeContract, data: resolveHash, isPending: isResolvePending } = useWriteContract()
  const { isLoading: isResolving, isSuccess: isResolveConfirmed } = useWaitForTransactionReceipt({ hash: resolveHash })
  const [remaining, setRemaining] = useState(() => {
    if (endTime > 0) {
      return Math.max(0, endTime - Math.floor(Date.now() / 1000))
    }
    return 0
  })
  const [currentPriceNow, setCurrentPriceNow] = useState(0)
  const [resultState, setResultState] = useState<'pending' | 'checking' | 'won' | 'lost'>('pending')
  const [finalPrice, setFinalPrice] = useState(0)
  const [rewardWon, setRewardWon] = useState(0)
  const [resolveTxHash, setResolveTxHash] = useState<`0x${string}` | null>(null)
  const [startPriceStored, setStartPriceStored] = useState(0)
  const [priceAtResolve, setPriceAtResolve] = useState(0)
  const [countdownFrozen, setCountdownFrozen] = useState<number | null>(null)
  const resolveInFlight = useRef(false)
  const alertShownRef = useRef(false)
  const onResultRef = useRef(onResult)
  const remainingAtExpired = useRef<number | null>(null)
  const initDone = useRef(false)
  useEffect(() => { onResultRef.current = onResult }, [onResult])

  // ── Countdown timer
  useEffect(() => {
    initDone.current = false
    setCountdownFrozen(null)
    remainingAtExpired.current = null

    const initial = Math.max(0, endTime - Math.floor(Date.now() / 1000))
    setRemaining(initial)
    if (initial === 0) {
      remainingAtExpired.current = 0
      setCountdownFrozen(0)
    }
    initDone.current = true

    const tick = () => {
      const now = Math.floor(Date.now() / 1000)
      const diff = Math.max(0, endTime - now)
      setRemaining(diff)
      if (diff === 0 && remainingAtExpired.current === null) {
        remainingAtExpired.current = 0
        setCountdownFrozen(0)
      }
    }
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  // ── Real-time BTC price
  useEffect(() => {
    if (prices.btcPrice) setCurrentPriceNow(prices.btcPrice)
  }, [prices.btcPrice])

  const stepLabels = lang === 'id' ? STEP_LABELS_ID : STEP_LABELS_EN
  const stepLabel = stepLabels[currentStep] ?? STEP_LABELS_ID[0]
  const rewardMON = STEP_REWARDS_MON[currentStep]?.toFixed(4) ?? '0.0005'
  const startPriceNum = startPrice / 1e8

  const isExpired = remaining === 0
  const priceDiff = currentPriceNow > 0 && startPriceNum > 0
    ? ((currentPriceNow - startPriceNum) / startPriceNum) * 100
    : null

  // ── Auto-resolve: dispatch tx when time expires
  useEffect(() => {
    if (!initDone.current) return
    if (!isExpired || resultState !== 'pending' || isResolvePending || resolveInFlight.current) return
    if (!prices.btcPrice) return

    const currentPrice = Math.round(prices.btcPrice * 1e8)
    const startPriceVal = startPrice
    const diff = currentPrice >= startPriceVal
      ? currentPrice - startPriceVal
      : startPriceVal - currentPrice
    const pct = (diff * 10000) / startPriceVal

    setCountdownFrozen(remainingAtExpired.current ?? remaining)
    setResultState('checking')
    setStartPriceStored(startPriceVal)
    setPriceAtResolve(currentPrice)
    resolveInFlight.current = true
    alertShownRef.current = false

    console.log(`[resolveBet] 🚀 TX — currentPrice=${currentPrice}, start=${startPriceVal}, percent=${pct}`)

    writeContract({
      address: CONTRACT_ADDRESS.BTCOraclePredictorV2,
      abi: PREDICTOR_ABI,
      functionName: 'resolveBet',
      args: [BigInt(currentPrice)],
      gas: 500000n,
    })
  }, [isExpired, resultState, isResolvePending, prices.btcPrice])

  // ── Listen for resolve tx confirmation
  useEffect(() => {
    if (!isResolving && !isResolveConfirmed) return
    if (resolveTxHash === null) return

    if (isResolveConfirmed) {
      const currPrice = priceAtResolve > 0 ? priceAtResolve : startPriceStored
      setFinalPrice(currPrice / 1e8)

      const diff = currPrice >= startPriceStored
        ? currPrice - startPriceStored
        : startPriceStored - currPrice
      const percent = (diff * 10000) / startPriceStored
      const priceMoved = percent >= 1  // ≥ 0.001%
      const betDir = direction

      console.log(`[resolveBet] ✅ CONFIRMED — start=${startPriceStored}, curr=${currPrice}, diff=${diff}, percent=${percent}`)

      // Tentukan hasil: NAIK, TURUN, SAMA, atau SALAH
      let won = false
      if (betDir === DIR.NAIK) {
        won = currPrice > startPriceStored && priceMoved
      } else if (betDir === DIR.TURUN) {
        won = currPrice < startPriceStored && priceMoved
      } else {
        won = !priceMoved  // SAMA menang jika harga diam < 0.001%
      }

      if (won) {
        const wonReward = Number(STEP_REWARDS_MON[currentStep])
        setResultState('won')
        setRewardWon(wonReward)
        showWinAlert(currPrice / 1e8, startPriceNum, wonReward, betDir, lang)
        onResultRef.current?.('won')
      } else {
        setResultState('lost')
        setRewardWon(0)
        showLoseAlert(currPrice / 1e8, startPriceNum, betDir, lang)
        onResultRef.current?.('lost')
      }

      setTimeout(() => refetchFn?.(), 2000)
      setResolveTxHash(null)
      resolveInFlight.current = false
    }
  }, [isResolving, isResolveConfirmed, resolveTxHash, startPriceStored, priceAtResolve, startPriceNum, lang, currentStep])

  // ── Reset when player places new bet
  useEffect(() => {
    if (!hasActiveBet && resultState !== 'pending') {
      setResultState('pending')
      alertShownRef.current = false
      setCountdownFrozen(null)
    }
  }, [hasActiveBet, resultState])

  // ── Capture resolve hash
  useEffect(() => {
    if (resolveHash && resolveTxHash === null) {
      setResolveTxHash(resolveHash)
    }
  }, [resolveHash])

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-xs uppercase tracking-widest text-slate-500 font-mono font-bold mb-1">
          ⏳ {lang === 'id' ? 'Tebakan Aktif' : 'Active Bet'} — {stepLabel}
        </div>
        <div className={`font-mono text-2xl font-bold ${
          direction === DIR.NAIK ? 'text-green-600' :
          direction === DIR.TURUN ? 'text-red-600' :
          'text-yellow-600'
        }`}>
          <DirectionIcon dir={direction} size="text-3xl" />
          <DirectionLabel dir={direction} lang={lang} />
        </div>
        <div className="font-mono text-xs text-slate-500 mt-1">
          {lang === 'id' ? 'Harga Tebakan:' : 'Predicted Price:'}
          <span className="font-bold text-slate-800 ml-1">
            ${startPriceNum.toLocaleString('en-US', { maximumFractionDigits: 8 })}
          </span>
        </div>
      </div>

      {/* Countdown */}
      <div className={`rounded-xl p-4 text-center border ${isExpired ? 'border-green-300 bg-green-50' : 'bg-slate-100 border-slate-200'}`}>
        <div className="font-mono text-xs text-slate-500 mb-1">
          {resultState === 'checking'
            ? (lang === 'id' ? '⚡ Memproses hasil...' : '⚡ Processing result...')
            : isExpired
            ? (lang === 'id' ? '⏰ Waktu Selesai!' : '⏰ Time is Up!')
            : (lang === 'id' ? '⏳ Hitung Mundur:' : '⏳ Countdown:')
          }
        </div>
        <div className={`font-mono text-3xl font-bold ${isExpired ? 'text-green-600' : 'text-slate-800'} ${resultState === 'checking' ? 'animate-pulse' : ''}`}>
          {resultState === 'checking'
            ? formatCountdownFull(countdownFrozen ?? remaining)
            : formatCountdownFull(remaining)
          }
        </div>
        <div className="font-mono text-xs text-slate-400 mt-1">
          {formatDuration(nextDuration, tr)}
        </div>
        {resultState === 'won' && (
          <div className="font-mono text-sm text-green-600 font-bold mt-2 animate-bounce">
            ✅ {lang === 'id' ? 'MENANG!' : 'WON!'}
          </div>
        )}
        {resultState === 'lost' && (
          <div className="font-mono text-sm text-red-600 font-bold mt-2">
            ❌ {lang === 'id' ? 'SALAH — Reset ke Step 1' : 'WRONG — Reset to Step 1'}
          </div>
        )}
      </div>

      {/* Live price comparison */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 space-y-2">
        <div className="text-xs font-mono text-slate-500 text-center uppercase tracking-widest">
          💹 {lang === 'id' ? 'Harga (Live)' : 'Price (Live)'}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
            <div className="font-mono text-[10px] text-slate-400">{lang === 'id' ? 'Tebakan' : 'Predicted'}</div>
            <div className="font-mono text-sm font-bold text-slate-600">
              ${startPriceNum > 0 ? startPriceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : '...'}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center border border-yellow-200">
            <div className="font-mono text-[10px] text-slate-400">{lang === 'id' ? 'Saat ini' : 'Current'}</div>
            <div className="font-mono text-sm font-bold text-[#f7931a] animate-pulse">
              ${currentPriceNow > 0 ? currentPriceNow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : '...'}
            </div>
          </div>
        </div>
        {priceDiff !== null && (
          <div className={`text-center font-mono text-xs font-bold ${priceDiff > 0 ? 'text-green-600' : priceDiff < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
            {priceDiff > 0 ? '📈 +' : priceDiff < 0 ? '📉 ' : '= '}{priceDiff.toFixed(4)}%
            <span className="text-slate-400 ml-1">
              ({lang === 'id' ? 'butuh ≥0.001%' : 'need ≥0.001%'})
            </span>
          </div>
        )}
      </div>

      {/* Reward + Step */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-center">
          <div className="font-mono text-xs text-slate-500">{lang === 'id' ? 'Reward' : 'Reward'}</div>
          <div className="font-mono text-sm font-bold text-green-600">{rewardMON} MON</div>
        </div>
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-center">
          <div className="font-mono text-xs text-slate-500">{lang === 'id' ? 'Step' : 'Step'}</div>
          <div className="font-mono text-sm font-bold text-slate-800">{currentStep + 1}/10</div>
        </div>
      </div>

      {/* Action button — auto-resolve when expired */}
      {resultState === 'pending' || resultState === 'checking' ? (
        <div className="space-y-2">
          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(0, Math.min(100, (1 - remaining / (nextDuration || 1)) * 100))}%` }}
            />
          </div>
          {/* Status text */}
          <div className="text-center font-mono text-sm font-bold text-slate-600">
            {isResolvePending || resultState === 'checking'
              ? `⏳ ${lang === 'id' ? 'Memproses secara otomatis...' : 'Auto-processing...'}`
              : isExpired
              ? `✅ ${lang === 'id' ? 'OTOMATIS CHECK — MOHON TUNGGU' : 'AUTO CHECKING — PLEASE WAIT'}`
              : `⏳ ${lang === 'id' ? 'SEDANG DIHITUNG...' : 'COUNTING...'}`
            }
          </div>
        </div>
      ) : (
        <div className={`text-center py-3 rounded-xl font-mono text-sm font-bold ${
          resultState === 'won' ? 'bg-green-50 border border-green-300 text-green-700' : 'bg-red-50 border border-red-300 text-red-700'
        }`}>
          {resultState === 'won'
            ? `🎉 ${lang === 'id' ? `MENANG! +${rewardWon.toFixed(4)} MON` : `WON! +${rewardWon.toFixed(4)} MON`}`
            : `❌ ${lang === 'id' ? 'SALAH — Reset ke Step 1' : 'WRONG — Reset to Step 1'}`}
          <div className="text-xs mt-1 opacity-70">{lang === 'id' ? 'Tunggu data refresh...' : 'Waiting for refresh...'}</div>
        </div>
      )}
    </div>
  )
}

function getDirectionName(dir: number, lang: string): string {
  if (dir === DIR.NAIK) return lang === 'id' ? '▲ NAIK' : '▲ UP'
  if (dir === DIR.TURUN) return lang === 'id' ? '▼ TURUN' : '▼ DOWN'
  return lang === 'id' ? 'SAMA' : 'SAME'
}

function getDirectionColor(dir: number): string {
  if (dir === DIR.NAIK) return '#16a34a'
  if (dir === DIR.TURUN) return '#dc2626'
  return '#d97706'
}

function showWinAlert(finalPrice: number, startPrice: number, reward: number, direction: number, lang: string) {
  const pct = ((finalPrice - startPrice) / startPrice) * 100
  const dirColor = getDirectionColor(direction)
  const dirName = getDirectionName(direction, lang)

  Swal.fire({
    icon: 'success',
    title: lang === 'id' ? '🎉 KAMU MENANG!' : '🎉 YOU WON!',
    html: `<div style="font-family: monospace; text-align: left; max-width: 360px; margin: 0 auto; font-size: 13px;">
      <div style="padding: 8px; background: #f0fdf4; border-radius: 8px; margin-bottom: 6px;">
        <div style="color: #888; font-size: 10px;">📌 TEBAKAN SAYA</div>
        <div style="font-size: 18px; font-weight: bold; color: ${dirColor};">
          ${dirName}
        </div>
        <div style="color: #333;">$${startPrice.toLocaleString('en-US', { maximumFractionDigits: 8 })}</div>
      </div>
      <div style="padding: 8px; background: #f9fafb; border-radius: 8px; margin-bottom: 6px;">
        <div style="color: #888; font-size: 10px;">📊 HARGA SAAT INI</div>
        <div style="font-size: 18px; font-weight: bold; color: #1f2937;">
          $${finalPrice.toLocaleString('en-US', { maximumFractionDigits: 8 })}
        </div>
        <div style="color: ${pct >= 0 ? '#16a34a' : '#dc2626'}; font-size: 12px;">
          ${pct >= 0 ? '+' : ''}${pct.toFixed(6)}%
        </div>
      </div>
      <div style="padding: 12px; background: #dcfce7; border-radius: 8px; text-align: center; margin-top: 8px;">
        <div style="font-size: 12px; color: #166534;">✅ Benar! +${reward.toFixed(3)} MON</div>
        <div style="font-size: 28px; font-weight: bold; color: #16a34a;">+${reward.toFixed(3)} MON</div>
        <div style="font-size: 11px; color: #166534;">Tersimpan di wallet</div>
      </div>
    </div>`,
    confirmButtonText: '🎯 Lanjut!',
    confirmButtonColor: '#16a34a',
    width: '400px',
  })
}

function showLoseAlert(finalPrice: number, startPrice: number, direction: number, lang: string) {
  const pct = Math.abs((finalPrice - startPrice) / startPrice) * 100
  const dirName = getDirectionName(direction, lang)

  Swal.fire({
    icon: 'error',
    title: lang === 'id' ? '😢 KAMU SALAH!' : '😢 WRONG PREDICTION!',
    html: `<div style="font-family: monospace; text-align: left; max-width: 360px; margin: 0 auto; font-size: 13px;">
      <div style="padding: 8px; background: #fef2f2; border-radius: 8px; margin-bottom: 6px;">
        <div style="color: #888; font-size: 10px;">📌 TEBAKAN SAYA</div>
        <div style="font-size: 18px; font-weight: bold; color: ${getDirectionColor(direction)};">
          ${dirName}
        </div>
        <div style="color: #333;">$${startPrice.toLocaleString('en-US', { maximumFractionDigits: 8 })}</div>
      </div>
      <div style="padding: 8px; background: #f9fafb; border-radius: 8px; margin-bottom: 6px;">
        <div style="color: #888; font-size: 10px;">📊 HARGA SAAT INI</div>
        <div style="font-size: 18px; font-weight: bold; color: #1f2937;">
          $${finalPrice.toLocaleString('en-US', { maximumFractionDigits: 8 })}
        </div>
        <div style="color: ${pct > 0 ? '#dc2626' : '#d97706'}; font-size: 12px;">
          ${pct > 0 ? '+' : ''}${pct.toFixed(6)}%
        </div>
      </div>
      <div style="padding: 12px; background: #fee2e2; border-radius: 8px; text-align: center; margin-top: 8px;">
        <div style="font-size: 12px; color: #991b1b;">❌ Arah salah — Reset ke Step 1</div>
        <div style="font-size: 14px; font-weight: bold; color: #991b1b; margin-top: 4px;">Coba lagi!</div>
      </div>
    </div>`,
    confirmButtonText: '💪 Coba lagi!',
    confirmButtonColor: '#dc2626',
    width: '400px',
  })
}

function formatCountdownFull(sec: number): string {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (d > 0) return `${d}d ${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
}
