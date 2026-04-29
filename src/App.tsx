import { useState, useEffect, useRef } from 'react'
import { useAccount, useBalance, useReadContract, useConnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Swal from 'sweetalert2'
import { CONTRACT_ADDRESS, PREDICTOR_ABI, STEP_DURATIONS, STEP_REWARDS_WEI, DIR } from '@/config/wagmi'
import { useLanguage, usePriceData, isPriceValid } from '@/hooks/useGameData'
import { t, formatDuration } from '@/i18n'
import ChartPanel from '@/components/ChartPanel'
import RentCard from '@/components/RentCard'
import ExtendCard from '@/components/ExtendCard'
import RulesBox from '@/components/RulesBox'
import WaitingCard from '@/components/WaitingCard'
import DirectionPanel from '@/components/DirectionPanel'
import PendingCard from '@/components/PendingCard'
import StepGrid from '@/components/StepGrid'
import LeaderboardModal from '@/components/LeaderboardModal'
import btcLogo from '@/images/btc-logo.png'
import indonesiaLogo from '@/images/england-logo.svg'
import englandLogo from '@/images/indonesia-logo.svg'

// ── Animated Background ───────────────────────────────────────
function AnimatedBackground() {
  const coinsRef = useRef<HTMLDivElement>(null)
  const starsRef = useRef<HTMLDivElement>(null)
  const sparklesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const NUM_COINS = 14
    const NUM_STARS = 50
    const NUM_SPARKLES = 12

    const setCoins = () => {
      if (!coinsRef.current) return
      coinsRef.current.innerHTML = ''
      for (let i = 0; i < NUM_COINS; i++) {
        const el = document.createElement('div')
        el.className = 'btc-coin'
        const size = 28 + Math.random() * 36
        el.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          --size: ${size}px;
          --dur: ${7 + Math.random() * 8}s;
          --delay: ${-Math.random() * 10}s;
        `
        coinsRef.current.appendChild(el)
      }
    }

    const setStars = () => {
      if (!starsRef.current) return
      starsRef.current.innerHTML = ''
      for (let i = 0; i < NUM_STARS; i++) {
        const el = document.createElement('div')
        el.className = 'star'
        const size = 1 + Math.random() * 2
        el.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          --dur: ${2 + Math.random() * 4}s;
          --delay: ${-Math.random() * 5}s;
        `
        starsRef.current.appendChild(el)
      }
    }

    const setSparkles = () => {
      if (!sparklesRef.current) return
      sparklesRef.current.innerHTML = ''
      for (let i = 0; i < NUM_SPARKLES; i++) {
        const el = document.createElement('div')
        el.className = 'sparkle'
        el.style.cssText = `
          left: ${5 + Math.random() * 90}%;
          top: ${5 + Math.random() * 90}%;
          --dur: ${2 + Math.random() * 3}s;
          --delay: ${-Math.random() * 5}s;
        `
        sparklesRef.current.appendChild(el)
      }
    }

    setCoins()
    setStars()
    setSparkles()
  }, [])

  return (
    <div className="animated-bg">
      <div ref={coinsRef} />
      <div ref={starsRef} />
      <div ref={sparklesRef} />
      <div className="purple-glow" />
    </div>
  )
}

// ── Simple Accordion Component ────────────────────────────────
function Accordion({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string
  icon: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden backdrop-blur-md">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="font-mono text-sm font-bold text-white uppercase tracking-wide">{title}</span>
        </div>
        <span className={`font-mono text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-700 pt-3">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Rental Status Card (merged: status + countdown) ──────────
function RentalStatusCard({
  rentCountdown,
  rentalExpired,
  rentEndTime,
  lang,
  remainingDays,
}: {
  rentCountdown: { d: number; h: number; m: number; expired: boolean } | null
  rentalExpired: boolean
  rentEndTime: number
  lang: string
  remainingDays: number
}) {
  const { tr } = useLanguage()
  const [hovered, setHovered] = useState(false)

  if (rentalExpired) {
    return (
      <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-5 text-center backdrop-blur-md">
        <div className="text-4xl mb-2">❌</div>
        <div className="font-mono text-base font-bold text-red-300">
          {lang === 'id' ? 'Sewa Sudah Habis!' : 'Subscription Expired!'}
        </div>
        <div className="font-mono text-xs text-slate-300 mt-1">
          {lang === 'id' ? 'Perpanjang untuk lanjut bermain' : 'Extend to continue playing'}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl p-5 border transition-all backdrop-blur-md ${
        hovered ? 'border-white/40 bg-white/15' : 'border-slate-700 bg-slate-800'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📅</span>
        <div className="font-mono text-sm font-bold text-white uppercase tracking-widest">
          {lang === 'id' ? 'Status Sewa' : 'Rental Status'}
        </div>
      </div>

      {/* Big countdown display */}
      <div className="text-center mb-4">
        <div className="font-mono text-5xl font-black text-white">
          {rentCountdown
            ? rentCountdown.d > 0
              ? rentCountdown.d
              : rentCountdown.h
            : '—'}
        </div>
        <div className="font-mono text-sm text-slate-300 mt-1">
          {rentCountdown
            ? rentCountdown.d > 0
              ? (lang === 'id' ? 'hari tersisa' : 'days remaining')
              : (lang === 'id' ? 'jam tersisa' : 'hours remaining')
            : lang === 'id' ? 'memuat...' : 'loading...'}
        </div>
        {rentCountdown && rentCountdown.d === 0 && (
          <div className="font-mono text-xs text-slate-400 mt-1">
            {rentCountdown.m}m {rentCountdown.h.toString().padStart(2,'0')}h
          </div>
        )}
      </div>

      {/* Detail strip */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 divide-y divide-white/10 text-xs font-mono">
        <div className="flex justify-between px-3 py-2">
          <span className="text-slate-300">{lang === 'id' ? 'Aktif sampai' : 'Active until'}</span>
          <span className="font-bold text-white">
            {new Date(rentEndTime * 1000).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', {
              dateStyle: 'medium', timeStyle: 'short'
            })}
          </span>
        </div>
        <div className="flex justify-between px-3 py-2">
          <span className="text-slate-300">{lang === 'id' ? 'Biaya sewa' : 'Rental fee'}</span>
          <span className="font-bold text-white">0.01 MON</span>
        </div>
        <div className="flex justify-between px-3 py-2">
          <span className="text-slate-300">{lang === 'id' ? 'Durasi' : 'Duration'}</span>
          <span className="font-bold text-white">30 {lang === 'id' ? 'hari' : 'days'}</span>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { address, isConnected } = useAccount()
  const { lang, toggle, tr } = useLanguage()
  const prices = usePriceData()
  const priceOk = isPriceValid(prices)

  const { data: balance } = useBalance({ address })
  const balanceWei = Number(balance?.value ?? 0)
  const balanceMON = (balanceWei / 1e18).toFixed(4)
  const insufficientBalance = isConnected && balanceWei < 1e18

  const [showResult, setShowResult] = useState<'won' | 'lost' | 'draw' | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const playerData = useReadContract({
    address: CONTRACT_ADDRESS.BTCOraclePredictorV2,
    abi: PREDICTOR_ABI,
    functionName: 'getPlayerData',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      staleTime: 0,
      refetchInterval: 10_000,
      refetchIntervalInBackground: false,
    },
  }) as any

  const playerDataUpdatedAt = (playerData as any)?.dataUpdatedAt ?? 0

  const isOwnerAccount = useReadContract({
    address: CONTRACT_ADDRESS.BTCOraclePredictorV2,
    abi: PREDICTOR_ABI,
    functionName: 'isOwner',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  }) as any
  const isOwnerConnected = Boolean(isOwnerAccount?.data)

  const raw = playerData?.data as readonly unknown[] | undefined
  const num = (idx: number, fallback: number = 0): number => {
    const v = raw?.[idx]
    if (v === undefined || v === null) return fallback
    if (typeof v === 'bigint') return Number(v)
    if (typeof v === 'number') return v
    if (typeof v === 'boolean') return v ? 1 : 0
    return fallback
  }
  const hasRented        = Boolean(num(0))
  const rentEndTime       = num(1)
  const remainingDays    = num(2)
  const currentStep       = num(3)
  const hasActiveBet      = Boolean(num(4))
  const betDirection      = num(5)
  const betStartPrice     = num(6)
  const betEndTime        = num(7)
  const withdrawable      = num(8)
  const totalAccumulated  = num(9)
  const waitingUntil      = num(10)
  const nextDuration      = num(11, Number(STEP_DURATIONS[0]))
  const nextRewardWei     = num(12)

  const now = Math.floor(Date.now() / 1000)
  const computedRemainingDays = rentEndTime > now
    ? Math.max(1, Math.ceil((rentEndTime - now) / 86400))
    : 0

  const isWaiting = waitingUntil > now && waitingUntil > 0
  const betExpired = hasActiveBet && now >= betEndTime
  const rentalExpired = hasRented && now >= rentEndTime
  const currentDuration = hasActiveBet
    ? (betEndTime > now ? betEndTime - now : 0)
    : nextDuration

  // ── Rental countdown timer ─────────────────────────────────
  const [rentCountdown, setRentCountdown] = useState<{
    d: number; h: number; m: number; expired: boolean
  } | null>(null)

  useEffect(() => {
    if (!hasRented || rentalExpired) {
      setRentCountdown(null)
      return
    }
    function tick() {
      const now = Math.floor(Date.now() / 1000)
      const diff = rentEndTime - now
      if (diff <= 0) {
        setRentCountdown({ d: 0, h: 0, m: 0, expired: true })
        return
      }
      const d = Math.floor(diff / 86400)
      const h = Math.floor((diff % 86400) / 3600)
      const m = Math.floor((diff % 3600) / 60)
      setRentCountdown({ d, h, m, expired: false })
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [hasRented, rentEndTime, rentalExpired])

  // ── Result banner ───────────────────────────────────────────
  useEffect(() => {
    if (showResult) {
      resultTimerRef.current = setTimeout(() => setShowResult(null), 30_000)
    }
    return () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current)
    }
  }, [showResult])

  useEffect(() => {
    if (showResult !== null) {
      window.dispatchEvent(new CustomEvent('oracle-result', { detail: showResult }))
    }
  }, [showResult])

  // ── Not connected placeholder ──────────────────────────────
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <AnimatedBackground />

        {/* ── HEADER ── */}
        <header className="bg-slate-900 border-b border-slate-700 px-4 sm:px-6 py-3 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={btcLogo} alt="BTC" className="h-7 w-7 object-contain" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight text-white">BTC Oracle</h1>
                <p className="text-[10px] text-slate-400 font-mono">{tr.tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggle} className="px-2.5 py-1.5 border border-slate-700 rounded-lg font-mono text-xs font-bold hover:border-white/40 transition-all text-white/70">
                {lang === 'id' ? 'EN' : 'ID'}
              </button>
              <div className="px-2.5 py-1.5 bg-white/5 border border-slate-700 rounded-lg font-mono text-xs text-white/40 cursor-not-allowed">
                🏆 {lang === 'id' ? 'Skor' : 'Score'}
              </div>
              <ConnectButton key={lang} showBalance={false} chainStatus="icon" accountStatus="address" label={tr.btnHubungkan} />
            </div>
          </div>
        </header>

        {/* ── CONTRACT INFO BAR ── */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-2 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-xs text-slate-500 font-mono">
              BTC Oracle V2 · Powered by Edwin Al-Syatrie © 2026
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-mono">
                {lang === 'id' ? 'Kontrak:' : 'Contract:'}
              </span>
              <code className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700 max-w-[120px] truncate block">
                {CONTRACT_ADDRESS.BTCOraclePredictorV2}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(CONTRACT_ADDRESS.BTCOraclePredictorV2).then(() => {
                    Swal.fire({ icon: 'success', title: '✅', text: 'Smart Contract tercopy', timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' })
                  }).catch(() => {
                    Swal.fire({ icon: 'error', title: '❌', text: 'Gagal copy', timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' })
                  })
                }}
                title={lang === 'id' ? 'Salin alamat kontrak' : 'Copy contract address'}
                className="px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all text-sm"
              >
                📋
              </button>
              <a
                href={`https://testnet.monad.xyz/address/${CONTRACT_ADDRESS.BTCOraclePredictorV2}`}
                target="_blank"
                rel="noopener noreferrer"
                title={lang === 'id' ? 'Buka di explorer' : 'Open in explorer'}
                className="px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all text-sm"
              >
                🔗
              </a>
            </div>
          </div>
        </div>

        {/* ── TAGLINE BANNER ── */}
        <div className="bg-slate-900 border-b border-slate-700 px-4 py-2 relative z-10">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-xs text-slate-400 font-mono">
              {lang === 'id'
                ? '🔮 Tebak arah BTC · Menang dapat reward MON'
                : '🔮 Guess BTC direction · Win MON rewards'}
            </p>
          </div>
        </div>

        <main className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center max-w-md w-full shadow-2xl">
            <div className="text-6xl mb-6">🔗</div>
            <div className="text-2xl font-bold text-white mb-3">{tr.hubungkanWallet}</div>
            <div className="text-sm text-slate-400 font-mono mb-8">{tr.untukMulai}</div>
            <div className="rainbowkit-button-bg flex justify-center">
              <ConnectButton key={lang} label={tr.btnHubungkan} />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="text-white flex flex-col" style={{ minHeight: '100vh' }}>
      <AnimatedBackground />

      {/* ── HEADER ── */}
      <header className="bg-slate-800 backdrop-blur-md border-b border-slate-700 px-4 sm:px-6 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={btcLogo} alt="BTC" className="h-7 w-7 object-contain" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight text-white">BTC Oracle</h1>
              <p className="text-[10px] text-slate-400 font-mono">{tr.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <div className="text-right hidden sm:block">
                <div className="text-[10px] text-slate-400 font-mono">{tr.saldo}</div>
                <div className={`font-mono text-sm font-bold ${insufficientBalance && !hasRented ? 'text-red-400' : 'text-white'}`}>
                  {balanceMON} MON
                </div>
              </div>
            )}
            <button onClick={toggle} className="px-2.5 py-1.5 border border-slate-700 rounded-lg font-mono text-xs font-bold hover:border-white/40 transition-all text-white/70">
              {lang === 'id' ? 'EN' : 'ID'}
            </button>
            <button onClick={() => setShowLeaderboard(true)} className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg font-mono text-xs font-bold text-white/70 hover:bg-white/20">
              🏆 {lang === 'id' ? 'Skor' : 'Score'}
            </button>
            <ConnectButton key={lang} showBalance={false} chainStatus="icon" accountStatus="address" label={isConnected ? tr.btnTerhubung : tr.btnHubungkan} />
          </div>
        </div>
      </header>

      {/* ── CONTRACT INFO BAR (below header) ── */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-2 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs text-slate-500 font-mono">
            BTC Oracle V2 · Powered by Edwin Al-Syatrie © 2026
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-mono">
              {lang === 'id' ? 'Kontrak:' : 'Contract:'}
            </span>
            <code className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700 max-w-[120px] truncate block">
              {CONTRACT_ADDRESS.BTCOraclePredictorV2}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(CONTRACT_ADDRESS.BTCOraclePredictorV2).then(() => {
                  Swal.fire({ icon: 'success', title: '✅', text: 'Smart Contract tercopy', timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' })
                }).catch(() => {
                  Swal.fire({ icon: 'error', title: '❌', text: 'Gagal copy', timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' })
                })
              }}
              title={lang === 'id' ? 'Salin alamat kontrak' : 'Copy contract address'}
              className="px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all text-sm"
            >
              📋
            </button>
            <a
              href={`https://testnet.monad.xyz/address/${CONTRACT_ADDRESS.BTCOraclePredictorV2}`}
              target="_blank"
              rel="noopener noreferrer"
              title={lang === 'id' ? 'Buka di explorer' : 'Open in explorer'}
              className="px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all text-sm"
            >
              🔗
            </a>
          </div>
        </div>
      </div>

      {/* ── ALL CONTENT (pushes footer down) ── */}
      <div className="flex-1 flex flex-col min-h-0">

      {/* ── RESULT BANNER ── */}
      {showResult && (
        <div className={`mx-4 sm:mx-6 mt-4 rounded-xl p-4 text-center border transition-all backdrop-blur-md ${
          showResult === 'won' ? 'bg-green-500/20 border-green-400/40' :
          showResult === 'lost' ? 'bg-red-500/20 border-red-400/40' :
          'bg-yellow-500/20 border-yellow-400/40'
        }`}>
          <div className="text-3xl mb-1">
            {showResult === 'won' ? '🎉' : showResult === 'lost' ? '😢' : '🔄'}
          </div>
          <div className={`font-mono text-xl font-bold ${
            showResult === 'won' ? 'text-green-300' :
            showResult === 'lost' ? 'text-red-300' : 'text-yellow-300'
          }`}>
            {showResult === 'won' ? tr.benarDapatReward :
             showResult === 'lost' ? tr.salahDepositKeOwner : tr.drawMessage}
          </div>
          <div className="font-mono text-xs text-white/60 mt-1">
            {showResult === 'won' ? t(tr.stepBerikutnya, { step: String(Math.min(currentStep + 2, 10)) }) :
             showResult === 'lost' ? tr.resetKeStep1 :
             lang === 'id' ? 'Tidak ada reward — tetap di step ini' : 'No reward — stay on this step'}
          </div>
        </div>
      )}

      {/* ── OWNER BLOCKED ── */}
      {isOwnerConnected && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: chart only */}
            <div className="lg:col-span-2 space-y-4">
              <ChartPanel />
              {/* Owner prohibition notice */}
              <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-6 text-center space-y-2">
                <div className="text-4xl">🚫</div>
                <div className="font-mono text-lg font-bold text-red-300">
                  {lang === 'id' ? 'Akun Ini Tidak Bisa Bermain!' : 'This Account Cannot Play!'}
                </div>
                <div className="font-mono text-sm text-white/60">
                  {lang === 'id'
                    ? 'Wallet ini adalah owner kontrak. Gunakan wallet lain.'
                    : 'This wallet is the contract owner. Use a different wallet to play.'}
                </div>
                <div className="font-mono text-xs text-white/40 mt-2">
                  {lang === 'id'
                    ? 'Owner tidak bisa sewa atau pasang tebakan di kontrak.'
                    : 'Owner cannot rent or place bets in the contract.'}
                </div>
              </div>
            </div>
            {/* Right: market price */}
            <div className="space-y-3">
              {priceOk && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="text-xs uppercase tracking-widest text-slate-300 font-mono mb-3">💹 Live Prices</div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">BTC/USD</span>
                      <div className="text-right">
                        <div className="font-bold text-[#f7931a]">${prices.btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                        <div className={`text-[10px] ${prices.btcChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {prices.btcChange24h >= 0 ? '+' : ''}{prices.btcChange24h.toFixed(2)}% (24j)
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                      <span className="text-slate-300">MON/USD</span>
                      <span className="font-bold text-white">${prices.monPrice.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="text-xs uppercase tracking-widest text-slate-300 font-mono mb-2">📋 Info</div>
                <div className="font-mono text-xs text-slate-400 space-y-1">
                  <p>{lang === 'id' ? 'Hubungi developer untuk akses kontrak.' : 'Contact developer to access the contract.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NOT RENTED STATES ── */}
      {!hasRented && !rentalExpired && !isOwnerConnected && (
        <div className="mx-4 sm:mx-6 mt-4 space-y-4 relative z-10">
          {/* Balance warning */}
          {priceOk && insufficientBalance && (
            <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-4 text-center backdrop-blur-md">
              <div className="text-3xl mb-2">💸</div>
              <div className="font-mono text-sm font-bold text-red-300">
                {lang === 'id' ? 'Saldo Tidak Cukup!' : 'Insufficient Balance!'}
              </div>
              <div className="font-mono text-xs text-white/60 mt-1">
                {lang === 'id' ? `Saldo: ${balanceMON} MON. Butuh 0.01 MON.` : `Balance: ${balanceMON} MON. Need 0.01 MON.`}
              </div>
              <a href="https://faucet.monad.xyz/" target="_blank" rel="noopener noreferrer"
                className="inline-block mt-3 px-4 py-2 bg-accent text-white font-mono text-xs font-bold rounded-lg hover:bg-accent/90 transition-all">
                🔗 {lang === 'id' ? 'Dapat MON di Faucet' : 'Get MON at Faucet'}
              </a>
            </div>
          )}

          {/* Price unavailable */}
          {prices.loading && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center backdrop-blur-md">
              <div className="text-3xl animate-pulse mb-2">⏳</div>
              <div className="font-mono text-sm text-white/60">
                {lang === 'id' ? 'Memuat harga pasar...' : 'Loading market prices...'}
              </div>
            </div>
          )}

          {!prices.loading && !priceOk && (
            <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-4 text-center backdrop-blur-md">
              <div className="text-3xl mb-2">⚠️</div>
              <div className="font-mono text-sm font-bold text-red-300">
                {lang === 'id' ? 'Harga Tidak Tersedia!' : 'Prices Unavailable!'}
              </div>
            </div>
          )}

          {/* Rent card + Rules */}
          {priceOk && !insufficientBalance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RentCard isOwner={isOwnerConnected} />
              <Accordion
                title={tr.aturan}
                icon="📋"
                defaultOpen={false}
              >
                <RulesBox />
              </Accordion>
            </div>
          )}
        </div>
      )}

      {/* ── RENTED — MAIN LAYOUT ── */}
      {hasRented && !isOwnerConnected && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 relative z-10">

          {/* 2-column grid: LEFT = game, RIGHT = sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* ── LEFT COLUMN: Prediction + Chart ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Step Progress + Info */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 backdrop-blur-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs uppercase tracking-widest text-slate-300 font-mono">
                    ⚡ {tr.langkah} Progress
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="font-mono text-[10px] text-slate-400">{tr.durasi}</div>
                      <div className="font-mono text-xs font-bold text-white">{formatDuration(currentDuration, tr)}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] text-slate-400">{tr.nextReward}</div>
                      <div className="font-mono text-xs font-bold text-green-400">{(Number(nextRewardWei) / 1e18).toFixed(4)} MON</div>
                    </div>
                  </div>
                </div>
                <StepGrid currentStep={currentStep} />
              </div>

              {/* Chart */}
              <ChartPanel />

              {/* Direction Panel (PREDICTION — MAIN GAME) */}
              <div id="prediction-panel">
                {isWaiting && (
                  <WaitingCard waitingUntil={waitingUntil} currentStep={currentStep} />
                )}
                {hasActiveBet && !isWaiting && (
                  <DirectionPanel
                    currentStep={currentStep}
                    nextDuration={currentDuration > 0 ? currentDuration : nextDuration}
                    nextRewardWei={nextRewardWei}
                    hasActiveBet={hasActiveBet}
                    betDirection={betDirection}
                    betStartPrice={betStartPrice}
                    betEndTime={betEndTime}
                    resetCounter={playerDataUpdatedAt}
                    refetchFn={playerData.refetch}
                    onNewBet={() => setShowResult(null)}
                    onResult={(r) => { if (r) setShowResult(r) }}
                  />
                )}
                {!hasActiveBet && (
                  <DirectionPanel
                    currentStep={currentStep}
                    nextDuration={nextDuration}
                    nextRewardWei={nextRewardWei}
                    hasActiveBet={hasActiveBet}
                    betDirection={betDirection}
                    betStartPrice={betStartPrice}
                    betEndTime={betEndTime}
                    resetCounter={playerDataUpdatedAt}
                    refetchFn={playerData.refetch}
                    onNewBet={() => setShowResult(null)}
                    onResult={(r) => { if (r) setShowResult(r) }}
                  />
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN: Sidebar ── */}
            <div className="space-y-3">

              {/* Rental Status Card */}
              <RentalStatusCard
                rentCountdown={rentCountdown}
                rentalExpired={rentalExpired}
                rentEndTime={rentEndTime}
                lang={lang}
                remainingDays={computedRemainingDays}
              />

              {/* Extend + Pending (always show when rented) */}
              <Accordion
                title={lang === 'id' ? 'Perpanjang Sewa' : 'Extend Rental'}
                icon="🔄"
                defaultOpen={rentalExpired}
              >
                <ExtendCard
                  remainingDays={computedRemainingDays}
                  isExpired={rentalExpired}
                  isOwner={isOwnerConnected}
                />
              </Accordion>

              {/* Pending Reward */}
              {withdrawable > 0 && (
                <PendingCard
                  amount={BigInt(withdrawable)}
                  totalAccumulated={BigInt(totalAccumulated)}
                  contractAddr={CONTRACT_ADDRESS.BTCOraclePredictorV2}
                  abi={PREDICTOR_ABI}
                  canClaim={withdrawable >= 1_000_000_000_000_000_000}
                />
              )}

              {/* Game Rules */}
              <Accordion
                title={tr.aturan}
                icon="📋"
                defaultOpen={false}
              >
                <RulesBox />
              </Accordion>

              {/* Market Live Price */}
              {priceOk && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 backdrop-blur-md">
                  <div className="text-xs uppercase tracking-widest text-slate-300 font-mono mb-3">
                    💹 {lang === 'id' ? 'Harga Live' : 'Live Prices'}
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">BTC/USD</span>
                      <div className="text-right">
                        <div className="font-bold text-[#f7931a]">
                          ${prices.btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                        <div className={`text-[10px] ${prices.btcChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {prices.btcChange24h >= 0 ? '+' : ''}{prices.btcChange24h.toFixed(2)}% (24j)
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                      <span className="text-slate-300">MON/USD</span>
                      <span className="font-bold text-white">${prices.monPrice.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      )}

      {/* ── RENTAL EXPIRED STATE ── */}
      {hasRented && rentalExpired && !isOwnerConnected && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
          <div className="lg:col-span-2 space-y-4">
            <ChartPanel />
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 backdrop-blur-md">
              <StepGrid currentStep={currentStep} />
            </div>
          </div>
          <div className="space-y-3">
            <RentalStatusCard
              rentCountdown={null}
              rentalExpired={true}
              rentEndTime={rentEndTime}
              lang={lang}
              remainingDays={computedRemainingDays}
            />
            <Accordion title={lang === 'id' ? 'Perpanjang Sewa' : 'Extend Rental'} icon="🔄" defaultOpen={true}>
              <ExtendCard remainingDays={computedRemainingDays} isExpired={true} isOwner={isOwnerConnected} />
            </Accordion>
            {withdrawable > 0 && (
              <PendingCard
                amount={BigInt(withdrawable)}
                totalAccumulated={BigInt(totalAccumulated)}
                contractAddr={CONTRACT_ADDRESS.BTCOraclePredictorV2}
                abi={PREDICTOR_ABI}
                canClaim={withdrawable >= 1_000_000_000_000_000_000}
              />
            )}
            <Accordion title={tr.aturan} icon="📋" defaultOpen={false}>
              <RulesBox />
            </Accordion>
          </div>
        </div>
      )}

      {/* ── FOOTER REMOVED — info moved to contract bar above ── */}
      </div>

      <LeaderboardModal open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </div>
  )
}
