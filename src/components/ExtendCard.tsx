import { useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi'
import { CONTRACT_ADDRESS, PREDICTOR_ABI, RENTAL_FEE_WEI } from '@/config/wagmi'
import { useLanguage, usePriceData } from '@/hooks/useGameData'
import Swal from 'sweetalert2'

interface Props {
  remainingDays: number
  isExpired?: boolean
  isOwner?: boolean
}

export default function ExtendCard({ remainingDays, isExpired = false, isOwner = false }: Props) {
  const { tr, lang } = useLanguage()
  const prices = usePriceData()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: hash ?? undefined })
  const { data: balance } = useBalance()

  const feeUSD = prices.monPrice * 0.01
  const feeIDR = (prices.monPrice * 0.01) * prices.idrRate
  const insufficientBalance = Boolean(balance && balance.value < RENTAL_FEE_WEI)
  const extendDisabled = insufficientBalance && !isExpired

  function handleExtend() {
    if (isOwner) {
      Swal.fire({
        icon: 'error',
        title: lang === 'id' ? '❌ Owner Tidak Bisa Bermain!' : '❌ Owner Cannot Play!',
        html: lang === 'id'
          ? 'Wallet ini adalah <b>owner kontrak</b> dan tidak bisa bermain.<br>Gunakan wallet lain untuk bermain.'
          : 'This wallet is the <b>contract owner</b> and cannot play.<br>Use a different wallet to play.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444',
      })
      return
    }
    writeContract({
      address: CONTRACT_ADDRESS.BTCOraclePredictorV2,
      abi: PREDICTOR_ABI,
      functionName: 'rentSystem',
      value: RENTAL_FEE_WEI,
      gas: 300000n,
    })
  }

  return (
    <div className={`border rounded-xl backdrop-blur-md p-5 space-y-4 ${
      isExpired
        ? 'bg-red-500/15 border-red-400/30'
        : 'bg-slate-800 border-slate-700'
    }`}>
      <div className="text-center">
        <div className="text-4xl mb-2">{isExpired ? '⏰' : '🔄'}</div>
        <div className={`text-lg font-bold mb-1 ${isExpired ? 'text-red-400' : 'text-white'}`}>
          {isExpired
            ? (lang === 'id' ? 'Sewa Sudah Habis!' : 'Subscription Expired!')
            : (lang === 'id' ? 'Perpanjang Sewa' : 'Extend Rental')}
        </div>
        {isExpired && (
          <div className="font-mono text-sm text-slate-300">
            {lang === 'id' ? 'Sewa terakhir habis' : 'Last subscription ended'}
          </div>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl backdrop-blur-md p-4 space-y-3">
        <div className="text-xs text-slate-300 font-mono uppercase tracking-widest text-center">
          {lang === 'id' ? 'Tambah +30 Hari' : 'Add +30 Days'}
        </div>
        <div className="flex justify-between items-center">
          <span className="font-mono text-sm text-slate-300">0.01 MON</span>
          <div className="text-right">
            <div className="font-mono text-sm text-white">${feeUSD.toFixed(4)} USD</div>
            <div className="font-mono text-xs text-slate-400">Rp{feeIDR.toLocaleString('id-ID', { maximumFractionDigits: 0 })} IDR</div>
          </div>
        </div>
        <div className="border-t border-slate-700" />
        <div className="flex justify-between items-center">
          <span className="font-mono text-sm font-bold text-white">+30 {tr.hari_singkat}</span>
          <span className="font-mono text-xs text-slate-400">
            {lang === 'id' ? 'ditambahkan ke sisa' : 'added to remaining'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-400/40 rounded-lg p-2 text-xs font-mono text-red-300">
          Error: {(error as any).message?.slice(0, 120)}
        </div>
      )}

      <button
        onClick={handleExtend}
        disabled={isPending || isConfirming || extendDisabled || isOwner}
        className={`w-full py-3 font-bold font-mono rounded-xl transition-all text-lg ${
          isOwner
            ? 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed'
            : extendDisabled
            ? 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white'
        }`}
      >
        {isPending || isConfirming
          ? tr.waitingConfirm
          : isOwner
          ? (lang === 'id' ? '🚫 Owner Tidak Bisa' : '🚫 Owner Cannot')
          : `🔄 +30 ${tr.hari_singkat}`}
      </button>

      {extendDisabled && (
        <div className="text-center text-xs text-slate-500 font-mono">
          {lang === 'id'
            ? `Butuh 0.01 MON — saldo: ${(Number(balance!.value) / 1e18).toFixed(4)} MON`
            : `Need 0.01 MON — balance: ${(Number(balance!.value) / 1e18).toFixed(4)} MON`}
        </div>
      )}

      <div className="text-center text-xs text-slate-400 font-mono">
        {lang === 'id'
          ? 'Hari ditambahkan ke sisa waktu berjalan'
          : 'Days added to remaining time'}
      </div>
    </div>
  )
}