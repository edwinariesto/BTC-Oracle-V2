import { useLanguage } from '@/hooks/useGameData'
import { STEP_REWARDS_WEI } from '@/config/wagmi'

function RewardBadge({ mon }: { mon: number }) {
  return (
    <span className="inline-block bg-green-500/20 border border-green-400/40 text-green-300 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold">
      +{mon} MON
    </span>
  )
}

export default function RulesBox() {
  const { tr, lang } = useLanguage()

  return (
    <div className="space-y-4">

      {/* ── Judul ── */}
      <div className="text-center">
        <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">{lang === 'id' ? 'Cara Main' : 'How to Play'}</div>
        <div className="text-lg font-bold font-mono text-white">
          {lang === 'id' ? 'Aturan Game' : 'Game Rules'}
        </div>
      </div>

      {/* ── RENTAL ── */}
      <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 space-y-2">
        <div className="text-xs font-mono font-bold text-green-300 uppercase tracking-wider">
          💰 {lang === 'id' ? 'Deposit Sewa' : 'Rental Deposit'}
        </div>
        <div className="text-sm font-mono text-white/80">
          {lang === 'id'
            ? 'Deposit 0.10 MON → 30 hari bermain'
            : 'Deposit 0.10 MON → 30 days play'}
        </div>
        <div className="text-xs font-mono text-slate-400">
          {lang === 'id'
            ? 'Biaya sewa langsung ke owner wallet'
            : 'Rental fee goes directly to owner wallet'}
        </div>
      </div>

      {/* ── LANGKAH MAIN ── */}
      <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 space-y-3">
        <div className="text-xs font-mono font-bold text-blue-300 uppercase tracking-wider">
          🎮 {lang === 'id' ? 'Langkah Bermain' : 'How to Play'}
        </div>

        {[
          {
            num: '1',
            icon: '📌',
            id: { title: 'Pilih Arah BTC', desc: 'Klik NAIK ▲, TURUN ▼, atau SAMA = untuk simpan harga BTC saat ini' },
            en: { title: 'Pick BTC Direction', desc: 'Click UP ▲, DOWN ▼, or SAME = to store the current BTC price' },
            color: 'text-blue-300',
          },
          {
            num: '2',
            icon: '⏳',
            id: { title: 'Tunggu Durasi', desc: 'Tunggu sampai timer selesai — tombol cek hasil muncul otomatis' },
            en: { title: 'Wait for Duration', desc: 'Wait until countdown ends — check result button appears automatically' },
            color: 'text-blue-300',
          },
          {
            num: '3',
            icon: '📈',
            id: { title: 'Cek Hasil BTC', desc: 'Bandingkan harga sekarang vs harga saat tebak disimpan. Perubahan harus ≥ 0.001%' },
            en: { title: 'Check BTC Result', desc: 'Compare current price vs stored price. Price must move ≥ 0.001%' },
            color: 'text-blue-300',
          },
        ].map(step => (
          <div key={step.num} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-mono text-sm font-bold flex-shrink-0 mt-0.5">
              {step.num}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm font-bold text-blue-300">
                {step.icon} {(step as any)[lang].title}
              </div>
              <div className="font-mono text-xs text-slate-300 leading-snug">
                {(step as any)[lang].desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── HASIL ── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
        <div className="text-xs font-mono font-bold text-white/60 uppercase tracking-wider">
          🏆 {lang === 'id' ? 'Hasil & Reward' : 'Results & Rewards'}
        </div>

        <div className="space-y-2">
          {/* WIN */}
          <div className="flex items-center gap-2 bg-green-500/15 border border-green-400/30 rounded-lg p-2">
            <div className="w-8 h-8 bg-green-500/30 border border-green-400/40 rounded-full flex items-center justify-center text-green-300 text-sm flex-shrink-0">✓</div>
            <div className="flex-1">
              <div className="font-mono text-xs font-bold text-green-300">
                {lang === 'id' ? 'MENANG' : 'WIN'} — {lang === 'id' ? 'Arah benar + ≥ 0.001%' : 'Correct direction + ≥ 0.001%'}
              </div>
              <div className="font-mono text-xs text-slate-300">
                {lang === 'id' ? 'Dapat reward + maju ke step berikutnya' : 'Get reward + advance to next step'}
                <RewardBadge mon={Number(STEP_REWARDS_WEI[0]) / 1e18} />
              </div>
            </div>
          </div>

          {/* LOSE */}
          <div className="flex items-center gap-2 bg-red-500/15 border border-red-400/30 rounded-lg p-2">
            <div className="w-8 h-8 bg-red-500/30 border border-red-400/40 rounded-full flex items-center justify-center text-red-300 text-sm flex-shrink-0">✗</div>
            <div className="flex-1">
              <div className="font-mono text-xs font-bold text-red-300">
                {lang === 'id' ? 'KALAH' : 'LOSE'} — {lang === 'id' ? 'Arah salah ATAU < 0.001%' : 'Wrong direction OR < 0.001%'}
              </div>
              <div className="font-mono text-xs text-slate-300">
                {lang === 'id' ? 'Reset ke Step 1. Deposit sudah di owner.' : 'Reset to Step 1. Deposit already with owner.'}
              </div>
            </div>
          </div>

          {/* DRAW */}
          <div className="flex items-center gap-2 bg-yellow-500/15 border border-yellow-400/30 rounded-lg p-2">
            <div className="w-8 h-8 bg-yellow-500/30 border border-yellow-400/40 rounded-full flex items-center justify-center text-yellow-300 text-sm flex-shrink-0">=</div>
            <div className="flex-1">
              <div className="font-mono text-xs font-bold text-yellow-300">
                {lang === 'id' ? 'SERI' : 'DRAW'} — {lang === 'id' ? 'Harga tidak berubah' : 'Price unchanged'}
              </div>
              <div className="font-mono text-xs text-slate-300">
                {lang === 'id' ? 'Tetap naik level + Dapat reward' : 'Still advance level + Get reward'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KLAIM ── */}
      <div className="bg-purple-500/15 border border-purple-400/30 rounded-xl p-4 space-y-1">
        <div className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider">
          🎁 {lang === 'id' ? 'Klaim Reward' : 'Claim Reward'}
        </div>
        <div className="font-mono text-xs text-white/60 leading-relaxed">
          {lang === 'id'
            ? 'Reward terakumulasi per pemain. Klaim bisa dilakukan saat total reward ≥ 1 MON.'
            : 'Rewards accumulate per player. Claim when total ≥ 1 MON.'}
        </div>
        <div className="font-mono text-xs text-slate-400">
          {lang === 'id'
            ? 'Owner TIDAK bisa bermain (alamat owner diblokir dari game).'
            : 'Owner CANNOT play (owner address is blocked from game).'}
        </div>
      </div>

    </div>
  )
}
