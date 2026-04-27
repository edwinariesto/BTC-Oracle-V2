import { useBalance } from 'wagmi'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useLanguage } from '@/hooks/useGameData'
import type { Abi } from 'viem'
import Swal from 'sweetalert2'

interface Props {
  amount: bigint
  totalAccumulated: bigint
  contractAddr: `0x${string}`
  abi: Abi
  canClaim: boolean
}

export default function PendingCard({ amount, totalAccumulated, contractAddr, abi, canClaim }: Props) {
  const { tr, lang } = useLanguage()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: hash ?? undefined })
  const { data: contractBal } = useBalance({ address: contractAddr })

  const contractBalMON = contractBal ? Number(contractBal.value) / 1e18 : 0
  const amountMON = Number(amount) / 1e18
  const hasEnoughInPool = contractBalMON >= amountMON
  const txInFlight = isPending || isConfirming

  function handleClaim() {
    // Double-submit guard — check BEFORE any state changes
    if (txInFlight) return
    if (!canClaim) return

    if (!hasEnoughInPool && contractBalMON > 0) {
      Swal.fire({
        icon: 'warning',
        title: lang === 'id' ? '⚠️ Saldo House Pool Tidak Cukup' : '⚠️ Insufficient House Pool',
        html: lang === 'id'
          ? `<div style="font-family: monospace; text-align: left;">
              <div style="margin-bottom: 6px;">📦 Saldo kontrak: <b>${contractBalMON.toFixed(4)} MON</b></div>
              <div style="margin-bottom: 6px;">💰 Yang ingin Anda klaim: <b>${amountMON.toFixed(4)} MON</b></div>
              <div style="margin-top: 8px; padding: 8px; background: #fef9c3; border-radius: 6px; font-size: 12px;">
                ⚡ Owner harus isi house pool dulu sebelum Anda bisa klaim.
              </div>
            </div>`
          : `<div style="font-family: monospace; text-align: left;">
              <div style="margin-bottom: 6px;">📦 Contract balance: <b>${contractBalMON.toFixed(4)} MON</b></div>
              <div style="margin-bottom: 6px;">💰 You want to claim: <b>${amountMON.toFixed(4)} MON</b></div>
              <div style="margin-top: 8px; padding: 8px; background: #fef9c3; border-radius: 6px; font-size: 12px;">
                ⚡ Owner must fund the house pool first before you can claim.
              </div>
            </div>`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#d97706',
      })
      return
    }

    if (!hasEnoughInPool && contractBalMON === 0) {
      Swal.fire({
        icon: 'error',
        title: lang === 'id' ? '❌ House Pool Kosong!' : '❌ House Pool is Empty!',
        html: lang === 'id'
          ? `<div style="font-family: monospace; text-align: center;">
              <div style="font-size: 14px; margin-bottom: 8px;">Owner belum mengisi house pool.</div>
              <div style="font-size: 12px; color: #666;">Tunggu sampai owner menyetor dana ke kontrak.</div>
            </div>`
          : `<div style="font-family: monospace; text-align: center;">
              <div style="font-size: 14px; margin-bottom: 8px;">Owner has not funded the house pool yet.</div>
              <div style="font-size: 12px; color: #666;">Wait until the owner deposits funds into the contract.</div>
            </div>`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc2626',
      })
      return
    }

    writeContract({ address: contractAddr, abi, functionName: 'claimReward', gas: 100000n })
  }

  return (
    <div className="bg-green-500/15 border border-green-400/30 rounded-xl backdrop-blur-md p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs text-green-400 font-bold">{tr.hadiahTertunda}</span>
        <span className="font-mono text-sm font-bold text-green-400">
          {amountMON.toFixed(4)} MON
        </span>
      </div>
      <div className="flex justify-between items-center pb-2 border-b border-green-400/20">
        <span className="font-mono text-xs text-slate-300">{tr.totalProfit} (history)</span>
        <span className="font-mono text-xs font-bold text-white/70">
          {(Number(totalAccumulated) / 1e18).toFixed(4)} MON
        </span>
      </div>

      {!canClaim && (
        <div className="font-mono text-xs text-slate-300 text-center py-1">
          {tr.minKlaim}
        </div>
      )}

      {/* House pool info */}
      <div className="font-mono text-[10px] text-slate-500 text-center">
        {lang === 'id' ? 'House pool: ' : 'House pool: '}
        <span className={contractBalMON > 0 ? 'text-white/60' : 'text-red-400'}>
          {contractBalMON.toFixed(4)} MON
        </span>
      </div>

      <button
        onClick={handleClaim}
        disabled={isPending || isConfirming || !canClaim}
        className={`w-full py-2 font-mono text-sm font-bold rounded-lg transition-all ${
          !canClaim
            ? 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed'
            : isPending || isConfirming
            ? 'bg-green-500/40 text-white/70 cursor-not-allowed animate-pulse'
            : 'bg-green-500 hover:bg-green-400 text-white'
        }`}
      >
        {isPending || isConfirming
          ? `⏳ ${tr.sedangKlaim}`
          : canClaim
          ? `💰 ${tr.klaim}`
          : `🔒 ${lang === 'id' ? 'Min. 1 MON untuk klaim' : 'Min. 1 MON to claim'}`}
      </button>
    </div>
  )
}