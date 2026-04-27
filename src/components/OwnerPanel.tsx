import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { PRICE_FEED_ABI, CONTRACT_ADDRESS } from '@/config/wagmi'
// NOTE: OwnerPanel is disabled — PRICE_FEED_ABI was removed from wagmi.ts
// Remove this file or update if you need an owner panel

export default function OwnerPanel() {
  const [priceInput, setPriceInput] = useState('')
  const [status, setStatus] = useState('')
  const { writeContract, data: hash, isPending } = useWriteContract()
  useWaitForTransactionReceipt({ hash })

  function handleUpdate() {
    if (!priceInput) { setStatus('Masukkan harga!'); return }
    try {
      writeContract({
        address: CONTRACT_ADDRESS.BTCPriceFeed,
        abi: PRICE_FEED_ABI,
        functionName: 'updatePrice',
        args: [BigInt(priceInput)],
      })
      setStatus('Updating...')
    } catch (e: any) {
      setStatus('Error: ' + e.message)
    }
  }

  return (
    <div className="bg-accent/5 border border-accent/30 rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="font-mono text-xs text-accent uppercase tracking-widest mb-3">
        Owner — Update Harga BTC
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={priceInput}
          onChange={e => setPriceInput(e.target.value)}
          placeholder="USD × 10^8 (misal: 9500000000)"
          className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2
                     text-gray-800 font-mono text-xs focus:outline-none focus:border-accent"
        />
        <button
          onClick={handleUpdate}
          disabled={isPending}
          className="px-4 py-2 bg-accent text-gray-800 font-mono text-xs font-bold
                     rounded-lg hover:opacity-85 disabled:opacity-40"
        >
          {isPending ? '...' : 'Update'}
        </button>
      </div>
      {status && <div className="font-mono text-xs text-gray-500 mt-2">{status}</div>}
    </div>
  )
}
