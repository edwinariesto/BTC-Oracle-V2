import { useState, useEffect } from 'react'
import { createPublicClient, http } from 'viem'
import { monadTestnet } from 'viem/chains'
import { useLanguage } from '@/hooks/useGameData'
import Swal from 'sweetalert2'
import { CONTRACT_ADDRESS, PREDICTOR_ABI } from '@/config/wagmi'

// ── Blockchain client (read-only public client — no wallet needed) ──
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http('https://testnet-rpc.monad.xyz'),
})

// ── Types ──────────────────────────────────────────────────────────
interface PlayerEntry {
  address: string
  totalPaid: bigint
  timesRented: number
  totalAccumulated: bigint
  currentStep: number
  withdrawable: bigint
  hasRented: boolean
  rank: number
}

type SortKey = 'paid' | 'reward' | 'step'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 10

// ── Helpers ─────────────────────────────────────────────────────────
function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function MONDisplay(wei: bigint | number, decimals = 4): string {
  const n = typeof wei === 'bigint' ? Number(wei) / 1e18 : wei
  return n.toFixed(decimals)
}

// ── Trophy icon by rank ──────────────────────────────────────────────
function TrophyIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🏆</span>
  if (rank === 2) return <span className="text-2xl">🥈</span>
  if (rank === 3) return <span className="text-2xl">🥉</span>
  return (
    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
      <span className="font-mono text-xs font-bold text-slate-500">{rank}</span>
    </div>
  )
}

// ── Sort arrow icon ─────────────────────────────────────────────────
function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-slate-300 ml-1">↕</span>
  return <span className={`ml-1 ${dir === 'desc' ? '▲' : '▼'}`} />
}

// ── Badge components ────────────────────────────────────────────────
function ClaimBadge({ withdrawable, totalAccumulated }: { withdrawable: bigint; totalAccumulated: bigint }) {
  const unclaimed = totalAccumulated - withdrawable
  if (totalAccumulated === 0n) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-400 font-mono text-[10px] font-bold">
        belum menang
      </span>
    )
  }
  if (unclaimed <= 0n) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 border border-blue-300 text-blue-700 font-mono text-[10px] font-bold">
        ✅ diklaim
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 font-mono text-[10px] font-bold">
      ⏳ {MONDisplay(unclaimed)} belum
    </span>
  )
}

function RentCountBadge({ times }: { times: number }) {
  if (times === 0) return null
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 border border-green-300 text-green-700 font-mono text-[10px] font-bold">
      💰 {times}×
    </span>
  )
}

// ── Column Header ─────────────────────────────────────────────────
function Th({ label, sortKey, currentSort, sortDir, onSort }: {
  label: string
  sortKey: SortKey
  currentSort: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}) {
  const active = currentSort === sortKey
  return (
    <th
      className="px-3 py-2.5 text-left text-xs text-gray-500 font-mono uppercase tracking-wider cursor-pointer hover:text-purple-600 select-none transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortArrow active={active} dir={sortDir} />
      </span>
    </th>
  )
}

// ── Main Modal ───────────────────────────────────────────────────────
interface Props {
  open: boolean
  onClose: () => void
}

export default function LeaderboardModal({ open, onClose }: Props) {
  const { lang } = useLanguage()

  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<PlayerEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [searchAddr, setSearchAddr] = useState('')
  const [ownerAddr, setOwnerAddr] = useState<string>('')
  const [sortKey, setSortKey] = useState<SortKey>('paid')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // ── Sort handler ─────────────────────────────────────────────────
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  // ── Fetch blockchain data ────────────────────────────────────────────
  async function loadLeaderboard() {
    setLoading(true)
    setError(null)
    // Use any to bypass strict ABI type checks on public client
    const client = publicClient as any

    try {
      // 1. Get owner address
      const owner = await client.readContract({
        address: CONTRACT_ADDRESS.BTCOraclePredictorV2,
        abi: PREDICTOR_ABI,
        functionName: 'owner',
        args: [],
      }) as `0x${string}`
      setOwnerAddr(owner)

      // 2. Get current block number (needed because RPC limits range)
      const currentBlock = await client.getBlockNumber()

      // Fetch only the LAST 5000 blocks to get recent activity (faster, covers active players)
      const RECENT_BLOCKS = 5000n
      const fromRecent = currentBlock > RECENT_BLOCKS ? currentBlock - RECENT_BLOCKS : 1n

      // Helper: fetch logs in chunks of 100 blocks
      async function fetchLogsChunked(fromBlock: bigint, toBlock: bigint, event: any): Promise<any[]> {
        const BLOCK_STEP = 100n
        const allLogs: any[] = []
        let cursor = fromBlock
        while (cursor <= toBlock) {
          try {
            const end = cursor + BLOCK_STEP - 1n
            const chunk = await client.getLogs({
              address: CONTRACT_ADDRESS.BTCOraclePredictorV2,
              event,
              fromBlock: cursor,
              toBlock: end > toBlock ? toBlock : end,
            })
            allLogs.push(...chunk)
            cursor = cursor + BLOCK_STEP
          } catch {
            break // stop if RPC fails on a chunk
          }
        }
        return allLogs
      }

      // 3-4. Fetch RentPurchased + RentExtended events (recent 5000 blocks only)
      const [rentEvents, extendEvents] = await Promise.all([
        fetchLogsChunked(fromRecent, currentBlock, {
          type: 'event',
          name: 'RentPurchased',
          inputs: [
            { name: 'player', type: 'address', indexed: true },
            { name: 'endTime', type: 'uint256', indexed: false },
            { name: 'daysAdded', type: 'uint256', indexed: false },
          ],
        }),
        fetchLogsChunked(fromRecent, currentBlock, {
          type: 'event',
          name: 'RentExtended',
          inputs: [
            { name: 'player', type: 'address', indexed: true },
            { name: 'newEndTime', type: 'uint256', indexed: false },
            { name: 'daysAdded', type: 'uint256', indexed: false },
          ],
        }),
      ])

      // 4. Aggregate rent per player (0.01 MON per rental)
      const RENT_FEE = 10000000000000000n
      const rentMap = new Map<string, { total: bigint; count: number }>()
      const addRent = (player: string) => {
        const existing = rentMap.get(player) || { total: 0n, count: 0 }
        rentMap.set(player, { total: existing.total + RENT_FEE, count: existing.count + 1 })
      }
      for (const e of rentEvents) {
        addRent((e.args.player as string).toLowerCase())
      }
      for (const e of extendEvents) {
        addRent((e.args.player as string).toLowerCase())
      }

      // 5. Get unique player addresses (exclude owner), sort by rent count desc, take top 10
      const playerAddresses = Array.from(rentMap.entries())
        .filter(([addr]) => addr.toLowerCase() !== owner.toLowerCase())
        .sort((a, b) => b[1].count - a[1].count) // most active first
        .slice(0, 10)                            // top 10 only
        .map(([addr]) => addr as `0x${string}`)

      // 6. Fetch player data in batches
      const enriched: PlayerEntry[] = []
      for (let i = 0; i < playerAddresses.length; i += 20) {
        const batch = playerAddresses.slice(i, i + 20)
        const results = await Promise.allSettled(
          batch.map(addr =>
            client.readContract({
              address: CONTRACT_ADDRESS.BTCOraclePredictorV2,
              abi: PREDICTOR_ABI as any,
              functionName: 'getPlayerData',
              args: [addr],
            } as any)
          )
        )

        for (let j = 0; j < batch.length; j++) {
          const addr = batch[j]
          const result = results[j]
          const rentInfo = rentMap.get(addr.toLowerCase()) || { total: 0n, count: 0 }

          if (result.status === 'fulfilled') {
            const data = result.value as unknown as [
              boolean, bigint, bigint, bigint, boolean, number,
              bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean
            ]
            const hasRented = data[0] as boolean
            const currentStep = Number(data[3])
            const withdrawable = data[8] as bigint
            const totalAccumulated = data[9] as bigint

            enriched.push({
              address: addr,
              totalPaid: rentInfo.total,
              timesRented: rentInfo.count,
              totalAccumulated,
              currentStep,
              withdrawable,
              hasRented,
              rank: 0,
            })
          } else {
            enriched.push({
              address: addr,
              totalPaid: rentInfo.total,
              timesRented: rentInfo.count,
              totalAccumulated: 0n,
              currentStep: 0,
              withdrawable: 0n,
              hasRented: false,
              rank: 0,
            })
          }
        }
      }

      // 7. Sort by total paid descending initially
      enriched.sort((a, b) => Number(b.totalPaid - a.totalPaid))
      enriched.forEach((e, idx) => { e.rank = idx + 1 })

      setEntries(enriched)
    } catch (err: any) {
      console.error('[Leaderboard] fetch error:', err)
      setError(
        lang === 'id'
          ? `Gagal mengambil data: ${err?.message || 'Unknown error'}`
          : `Failed to fetch data: ${err?.message || 'Unknown error'}`
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Reload when modal opens ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    setPage(1)
    setSearchAddr('')
    setSortKey('paid')
    setSortDir('desc')
    loadLeaderboard()
  }, [open])

  // ── Sort + filter ─────────────────────────────────────────────────
  const filtered = searchAddr
    ? entries.filter(e => e.address.toLowerCase().includes(searchAddr.toLowerCase()))
    : entries

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'paid') cmp = Number(b.totalPaid - a.totalPaid)
    else if (sortKey === 'reward') cmp = Number(b.totalAccumulated - a.totalAccumulated)
    else cmp = b.currentStep - a.currentStep
    return sortDir === 'desc' ? cmp : -cmp
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // ── Stats ────────────────────────────────────────────────────────
  const totalRentCollected = entries.reduce((sum, e) => sum + e.totalPaid, 0n)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="relative px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-slate-800 to-slate-700">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg font-bold transition-all"
          >
            ×
          </button>
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏆</div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {lang === 'id' ? 'Leaderboard' : 'Leaderboard'}
              </h2>
              <p className="text-xs text-white/60 font-mono">
                {lang === 'id'
                  ? 'Data real dari blockchain · Penyewaan & reward'
                  : 'Real data from blockchain · Rentals & rewards'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-6 py-3 bg-slate-50 border-b border-gray-100 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm">👥</span>
            <span className="font-mono text-sm font-bold text-slate-700">
              {entries.length} {lang === 'id' ? 'pemain' : 'players'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">💰</span>
            <span className="font-mono text-sm font-bold text-slate-700">
              {MONDisplay(totalRentCollected)} MON {lang === 'id' ? 'total sewa' : 'total rent'}
            </span>
          </div>
          {ownerAddr && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-slate-400 font-mono">Owner:</span>
              <code className="font-mono text-xs text-slate-600 bg-white px-2 py-1 rounded border border-gray-200">
                {shortenAddress(ownerAddr)}
              </code>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100 bg-slate-50">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchAddr}
              onChange={e => {
                setSearchAddr(e.target.value)
                setPage(1)
              }}
              placeholder={lang === 'id' ? 'Cari alamat wallet (0x...)' : 'Search wallet address (0x...)'}
              className="w-full pl-9 pr-4 py-2 text-sm font-mono text-slate-800 placeholder-slate-400 border border-gray-200 rounded-lg
                         bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-4xl animate-bounce">⏳</div>
            <div className="font-mono text-sm text-slate-500">
              {lang === 'id' ? 'Mengambil data dari blockchain...' : 'Fetching data from blockchain...'}
            </div>
            <div className="font-mono text-xs text-slate-400">
              RPC: testnet-rpc.monad.xyz
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-4xl">⚠️</div>
            <div className="font-mono text-sm text-red-600 text-center max-w-sm">{error}</div>
            <button
              onClick={loadLeaderboard}
              className="px-4 py-2 bg-slate-800 text-white font-mono text-sm rounded-lg hover:bg-slate-700 transition-all"
            >
              {lang === 'id' ? '🔄 Coba lagi' : '🔄 Retry'}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-4xl">🔍</div>
            <div className="font-mono text-sm text-slate-500">
              {lang === 'id' ? 'Belum ada data pemain' : 'No player data yet'}
            </div>
            <div className="font-mono text-xs text-slate-400 text-center px-8">
              {lang === 'id'
                ? 'Data akan muncul setelah ada pemain yang sewa sistem'
                : 'Data will appear after players rent the system'}
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && !error && sorted.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white border-b border-gray-100 z-10 shadow-sm">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs text-gray-500 font-mono uppercase tracking-wider w-14">
                    {lang === 'id' ? 'Rank' : 'Rank'}
                  </th>
                  <Th label={lang === 'id' ? 'Wallet' : 'Wallet'} sortKey="paid" currentSort={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <Th label={lang === 'id' ? 'Total Sewa' : 'Total Rent'} sortKey="paid" currentSort={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <Th label={lang === 'id' ? 'Reward' : 'Reward'} sortKey="reward" currentSort={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <Th label={lang === 'id' ? 'Step' : 'Step'} sortKey="step" currentSort={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-3 py-2.5 text-left text-xs text-gray-500 font-mono uppercase tracking-wider">
                    {lang === 'id' ? 'Status' : 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((entry) => (
                  <tr
                    key={entry.address}
                    className={`border-b border-gray-50 hover:bg-slate-50/80 transition-colors ${
                      entry.rank <= 3 ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center">
                        <TrophyIcon rank={entry.rank} />
                      </div>
                    </td>

                    {/* Address */}
                    <td className="px-3 py-3">
                      <div className="font-mono text-sm font-bold text-gray-800">
                        {shortenAddress(entry.address)}
                      </div>
                      <div className="font-mono text-[10px] text-gray-400 truncate max-w-[120px]">
                        {entry.address}
                      </div>
                    </td>

                    {/* Total paid */}
                    <td className="px-3 py-3">
                      <div className="font-mono text-sm font-bold text-green-700">
                        {MONDisplay(entry.totalPaid)} MON
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <RentCountBadge times={entry.timesRented} />
                      </div>
                    </td>

                    {/* Reward accumulated */}
                    <td className="px-3 py-3">
                      {entry.totalAccumulated > 0n ? (
                        <div className="font-mono text-sm font-bold text-purple-700">
                          +{MONDisplay(entry.totalAccumulated)}
                        </div>
                      ) : (
                        <div className="font-mono text-sm text-gray-300">—</div>
                      )}
                    </td>

                    {/* Step */}
                    <td className="px-3 py-3">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 border border-slate-200">
                        <span className="font-mono text-xs font-bold text-slate-600">
                          {Math.min(entry.currentStep + 1, 10)}
                        </span>
                      </div>
                    </td>

                    {/* Claim status */}
                    <td className="px-3 py-3">
                      <ClaimBadge
                        withdrawable={entry.withdrawable}
                        totalAccumulated={entry.totalAccumulated}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer — Pagination */}
        {!searchAddr && !loading && sorted.length > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-gray-100 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="font-mono text-xs text-gray-500">
                {lang === 'id'
                  ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, sorted.length)} dari ${sorted.length} pemain`
                  : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, sorted.length)} of ${sorted.length} players`}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-mono font-bold
                             text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ‹ Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => {
                    if (totalPages <= 7) return true
                    if (p === 1 || p === totalPages) return true
                    return Math.abs(p - currentPage) <= 2
                  })
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 font-mono text-sm">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-9 h-9 rounded-lg border text-sm font-mono font-bold transition-all ${
                          currentPage === p
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )
                }

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-mono font-bold
                             text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-slate-500">
              BTC Oracle V2 · Powered by Edwin Al-Syatrie © 2026
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-slate-400">Contract:</span>
            <code className="font-mono text-[10px] text-slate-600 bg-white px-2 py-1 rounded border border-gray-200 max-w-[120px] truncate">
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
              className="px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-all text-sm"
            >
              📋
            </button>
            <a
              href={`https://testnet.monadexplorer.com/address/${CONTRACT_ADDRESS.BTCOraclePredictorV2}`}
              target="_blank"
              rel="noopener noreferrer"
              title={lang === 'id' ? 'Buka di explorer' : 'Open in explorer'}
              className="px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-all text-sm"
            >
              🔗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}