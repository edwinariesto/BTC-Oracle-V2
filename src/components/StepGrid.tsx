import { useLanguage } from '@/hooks/useGameData'
import { STEP_DURATIONS, STEP_REWARDS_WEI } from '@/config/wagmi'

interface Props {
  currentStep: number
  hasActiveBet?: boolean
}

function stepLabel(secs: number): string {
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.round(secs / 60)}m`
  if (secs < 86400) return `${Math.round(secs / 3600)}h`
  const days = secs / 86400
  return `${days < 7 ? days.toFixed(1) : Math.floor(days)}d`
}

export default function StepGrid({ currentStep, hasActiveBet = false }: Props) {
  useLanguage() // required for context

  return (
    <div className="space-y-1">

      {/* ── Step circles + reward (5 col mobile / 10 col desktop) ── */}
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
        {STEP_DURATIONS.map((dur, i) => {
          const isCurrent = i === currentStep
          const isPast   = i < currentStep
          const rewardMON = Number(STEP_REWARDS_WEI[i]) / 1e18

          const circleClass = isCurrent
            ? hasActiveBet
              ? 'bg-purple-500/40 border-purple-400 text-white shadow-md shadow-purple-500/20 scale-110 z-10'
              : 'bg-purple-500/30 border-purple-400/60 text-white shadow-md scale-110 z-10'
            : isPast
            ? 'bg-green-500/30 border-green-400/50 text-green-300'
            : 'bg-slate-800 border-slate-700 text-slate-500'

          return (
            <div key={i} className="flex flex-col items-center" title={`Step ${i+1} · ${stepLabel(dur)}`}>
              {/* Circle — step number + MON reward stacked inside */}
              <div className={`relative w-full max-w-[38px] sm:max-w-[48px] mx-auto aspect-square rounded-full flex flex-col items-center justify-center gap-0.5 font-mono font-bold border transition-all ${circleClass}`}>
                <span className="text-[11px] sm:text-sm leading-none">{i + 1}</span>
                <span className="leading-none text-[8px] sm:text-[8px] opacity-70">+{rewardMON}</span>
                {isCurrent && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Duration row ── */}
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
        {STEP_DURATIONS.map((dur, i) => (
          <div key={i} className="text-center">
            <div className={`font-mono leading-tight ${i === currentStep ? 'text-purple-400 font-bold' : 'text-slate-500'}`} style={{ fontSize: '8px' }}>
              {stepLabel(dur)}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
