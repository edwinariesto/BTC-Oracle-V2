import { useLanguage } from '@/hooks/useGameData'

interface Props { currentDay: number }
export default function DayGrid({ currentDay }: Props) {
  const { tr } = useLanguage()

  return (
    <div className="bg-white border border-gray-200 rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="text-xs uppercase tracking-widest text-gray-500 mb-3">
        {tr.nextReward}
      </div>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 30 }, (_, i) => {
          const day = i + 1
          const cls = day < currentDay ? 'completed'
                    : day === currentDay ? 'current'
                    : 'locked'
          return (
            <div key={day} className={`day-dot ${cls}`} title={`${tr.dayShort.replace('{day}', String(day))}`}>
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}
