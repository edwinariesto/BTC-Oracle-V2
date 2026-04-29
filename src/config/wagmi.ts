import { http, createConfig } from 'wagmi'
import { monadTestnet } from 'viem/chains'
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors'

// ============================================================
// ALAMAT KONTRAK — UPDATE SETIAP KALI DEPLOY
// Alamat kontrak baru dapat setelah deploy berhasil:
// node scripts/simple_deploy.cjs
// ============================================================
export const CONTRACT_ADDRESS = {
  BTCOraclePredictorV2: '0xcad0a9f3fadf17d42b0aa01c165b600484171c31',
} as const

// Kontrak baru: 0xcad0a9f3fadf17d42b0aa01c165b600484171c31 (deployed 2026-04-29)
// ⚠️ RENTAL FEE: 0.10 MON — SEWA = 0.10 MON per 30 hari
// ⚠️ REWARD Geometric r=2, a0=0.0003 MON — total 0.1539 MON (153.9% profit dari 0.10 MON)
// STEP1=0.0003, STEP2=0.0006, STEP3=0.0012, STEP4=0.0024, STEP5=0.0048
// STEP6=0.0096, STEP7=0.0192, STEP8=0.0384, STEP9=0.0768, STEP10=0.1536
// 3 ARAH: TURUN(0), SAMA(1), NAIK(2) — SAMA HARUS PERSIS SAMA (diff=0), tidak dapat reward
// Threshold: >= 0.001%

// Total 30 hari persis (2592000 detik):
// Step1=30s, Step2=1m, Step3=5m, Step4=30m, Step5=2h, Step6=10h,
// Step7=2d, Step8=6d, Step9=10d, Step10=11.47d
export const STEP_DURATIONS = [30, 60, 300, 1800, 7200, 36000, 172800, 518400, 864000, 985410] as const

// Geometric progression: r=2, a0=0.0003 MON
// Total: 0.1539 MON (153.9% of 0.10 MON rental)
// Step1=0.0003, Step2=0.0006, Step3=0.0012, Step4=0.0024, Step5=0.0048
// Step6=0.0096, Step7=0.0192, Step8=0.0384, Step9=0.0768, Step10=0.1536
export const STEP_REWARDS_WEI = [
    300000000000000n,    // 0.0003 MON
    600000000000000n,    // 0.0006 MON
   1200000000000000n,    // 0.0012 MON
   2400000000000000n,    // 0.0024 MON
   4800000000000000n,    // 0.0048 MON
   9600000000000000n,    // 0.0096 MON
  19200000000000000n,    // 0.0192 MON
  38400000000000000n,    // 0.0384 MON
  76800000000000000n,    // 0.0768 MON
 153600000000000000n,    // 0.1536 MON
] as const

// ============================================================
// KONSTANTA ARAH — 3 PILIHAN
// ============================================================
export const DIR = {
  TURUN: 0,  // harga turun >= 0.001%
  SAMA:  1,  // harga diam < 0.001%
  NAIK:  2,  // harga naik >= 0.001%
} as const

export const RENTAL_FEE_WEI = BigInt('100000000000000000')
export const DAYS_TO_SECS = 86400

// ============================================================
// ABI — BTCOraclePredictorV2 (3 arah: TURUN/SAMA/NAIK)
// ============================================================
export const PREDICTOR_ABI = [
  {
    name: 'rentSystem',
    type: 'function',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    name: 'placeBet',
    type: 'function',
    inputs: [
      { name: 'direction', type: 'int8' },
      { name: 'startPrice', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'resolveBet',
    type: 'function',
    inputs: [{ name: 'currentPrice', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'claimReward',
    type: 'function',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'fundHousePool',
    type: 'function',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    name: 'getPlayerData',
    type: 'function',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'hasRented', type: 'bool' },
      { name: 'rentEndTime', type: 'uint256' },
      { name: 'remainingDays', type: 'uint256' },
      { name: 'currentStep', type: 'uint256' },
      { name: 'hasActiveBet', type: 'bool' },
      { name: 'betDirection', type: 'int8' },
      { name: 'betStartPrice', type: 'uint256' },
      { name: 'betEndTime', type: 'uint256' },
      { name: 'withdrawable', type: 'uint256' },
      { name: 'totalAccumulated', type: 'uint256' },
      { name: 'waitingUntil', type: 'uint256' },
      { name: 'nextDuration', type: 'uint256' },
      { name: 'nextRewardWei', type: 'uint256' },
      { name: 'isExpiringSoon', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'isOwner',
    type: 'function',
    inputs: [{ name: 'addr', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    name: 'owner',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    name: 'players',
    type: 'function',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { name: 'hasRented', type: 'bool' },
      { name: 'rentEndTime', type: 'uint256' },
      { name: 'currentStep', type: 'uint256' },
      { name: 'hasActiveBet', type: 'bool' },
      { name: 'betDirection', type: 'int8' },
      { name: 'betStartPrice', type: 'uint256' },
      { name: 'betEndTime', type: 'uint256' },
      { name: 'withdrawable', type: 'uint256' },
      { name: 'totalAccumulated', type: 'uint256' },
      { name: 'waitingUntil', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const

// ============================================================
// KONFIGURASI WAGMI
// ============================================================
const MONAD_RPC_URL = 'https://testnet-rpc.monad.xyz'

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'BTC Oracle Predictor V2' }),
    walletConnect({
      projectId: '66fafb17bb4d99ef4e465c491abd6acb',
      metadata: {
        name: 'BTC Oracle Predictor V2',
        description: 'Tebak arah BTC di Monad Testnet',
        url: window.location.origin,
        icons: [`${window.location.origin}/icon.png`],
      },
    }),
  ],
  transports: {
    [monadTestnet.id]: http(MONAD_RPC_URL),
  },
})

export const DEFAULT_GAS = 3000000n
