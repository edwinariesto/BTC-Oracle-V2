interface Props {
  currentDay: number
  nextRewardIDR: number
  nextDuration: number
}

function formatDuration(sec: number) {
  if (sec < 3600) return `${Math.round(sec / 60)} menit`
  if (sec < 86400) return `${Math.round(sec / 3600)} jam`
  return `${Math.round(sec / 86400)} hari`
}

export default function RewardCard({ currentDay, nextRewardIDR, nextDuration }: Props) {
  const nextDay = Math.min(currentDay + 1, 30)
  return (
    <div className="bg-white border border-gray-200 rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Hari {nextDay}</div>
          <div className="text-3xl font-bold font-mono text-up">
            Rp {nextRewardIDR.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-gray-500 font-mono mt-1">
            ≈ {(nextRewardIDR / 5000).toFixed(4)} MON
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Durasi</div>
          <div className="text-xl font-bold font-mono text-accent">
            {formatDuration(nextDuration)}
          </div>
        </div>
      </div>
    </div>
  )
}
