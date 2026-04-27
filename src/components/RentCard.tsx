import { useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi'
import { CONTRACT_ADDRESS, PREDICTOR_ABI, RENTAL_FEE_WEI } from '@/config/wagmi'
import { useLanguage, usePriceData } from '@/hooks/useGameData'
import { t } from '@/i18n'
import Swal from 'sweetalert2'

interface Props {
  isOwner?: boolean
}

export default function RentCard({ isOwner = false }: Props) {
  const { tr, lang } = useLanguage()
  const prices = usePriceData()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: hash ?? undefined })
  const { data: balance } = useBalance()

  const feeUSD = prices.monPrice * 0.01
  const feeIDR = (prices.monPrice * 0.01) * prices.idrRate
  const insufficientBalance = Boolean(balance && balance.value < RENTAL_FEE_WEI)

  function handleRent() {
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
    <div className="bg-slate-800 border border-slate-700 rounded-xl backdrop-blur-md p-5 space-y-4">
      <div className="text-center">
        <div className="text-4xl mb-2">🔐</div>
        <div className="text-lg font-bold text-white mb-1">{tr.sewaSistem}</div>
        <div className="text-sm text-slate-300 font-mono">
          {t(tr.depositDesc, { mon: '0.01', days: '30' })}
        </div>
      </div>

      {/* Biaya sewa */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl backdrop-blur-md p-4 space-y-3">
        <div className="text-xs text-slate-300 font-mono uppercase tracking-widest text-center">
          {tr.biayaSewa}
        </div>

        {prices.loading ? (
          <div className="text-center font-mono text-sm text-slate-300 animate-pulse">
            {lang === 'id' ? 'Memuat harga...' : 'Loading price...'}
          </div>
        ) : (
          <>
            {/* 0.01 MON = ? */}
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm text-slate-300">0.01 MON</span>
              <div className="text-right">
                <div className="font-mono text-sm text-white">${feeUSD.toFixed(4)} USD</div>
                <div className="font-mono text-xs text-slate-400">Rp{feeIDR.toLocaleString('id-ID', { maximumFractionDigits: 0 })} IDR</div>
              </div>
            </div>

            <div className="border-t border-slate-700" />

            {/* Total deposit */}
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm font-bold text-white">Total</span>
              <div className="text-right">
                <div className="font-mono text-lg font-bold text-white">${feeUSD.toFixed(4)} USD</div>
                <div className="font-mono text-sm font-bold text-white">
                  Rp{feeIDR.toLocaleString('id-ID', { maximumFractionDigits: 0 })} IDR
                </div>
              </div>
            </div>

            {/* Rent period */}
            <div className="text-center font-mono text-xs text-slate-400">
              = 0.01 MON = 30 {tr.hari_singkat}
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-400/40 rounded-lg p-2 text-xs font-mono text-red-300">
          Error: {(error as any).message?.slice(0, 120)}
        </div>
      )}

      {isOwner ? (
        <button
          onClick={handleRent}
          disabled={false}
          className="w-full py-3 font-bold font-mono rounded-xl transition-all text-lg bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed"
        >
          🚫 {lang === 'id' ? 'Owner Tidak Bisa Deposit' : 'Owner Cannot Deposit'}
        </button>
      ) : (
        <button
          onClick={handleRent}
          disabled={isPending || isConfirming || prices.loading || insufficientBalance}
          className={`w-full py-3 font-bold font-mono rounded-xl transition-all text-lg ${
            insufficientBalance
              ? 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white'
          }`}
        >
          {isPending || isConfirming
            ? tr.waitingConfirm
            : insufficientBalance
            ? (lang === 'id' ? 'Saldo Tidak Cukup' : 'Insufficient Balance')
            : `🔒 ${t(tr.deposit1MON, { mon: '0.01' })}`}
        </button>
      )}

      {insufficientBalance && (
        <div className="text-center text-xs text-slate-500 font-mono">
          {lang === 'id'
            ? `Butuh 0.01 MON — saldo: ${(Number(balance!.value) / 1e18).toFixed(4)} MON`
            : `Need 0.01 MON — balance: ${(Number(balance!.value) / 1e18).toFixed(4)} MON`}
        </div>
      )}
    </div>
  )
}
