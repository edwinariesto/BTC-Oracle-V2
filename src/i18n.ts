// ============================================================
// Sistem Translasi Bahasa Sederhana (ID <-> EN)
// ============================================================

export type Language = 'id' | 'en'

export interface Translations {
  // Header
  appTitle: string
  tagline: string
  saldo: string
  wallet: string
  connectWallet: string
  connected: string

  // Rental
  sewaSistem: string
  depositDesc: string
  deposit1MON: string
  biayaSewa: string
  processing: string
  waitingConfirm: string
  sewaDulu: string
  deposit: string
  expired: string

  // Game steps
  step: string
  langkah: string
  langkah_singkat: string
  durasi: string
  tebakArah: string
  pilihNaikTurun: string
  naiknya: string
  turunnya: string
  konfirmasiNaik: string
  konfirmasiTurun: string
  hargaStart: string
  hargaSekarang: string
  hargaTersimpan: string
  hargaBerubah: string
  perubahan: string

  // Button states
  naik: string
  turun: string
  sama: string
  menunggu: string
  menunguKonfirmasi: string
  betAktif: string
  dalamMasaTunggu: string

  // Results
  tebakanAktif: string
  salah: string
  benar: string
  menang: string
  kalah: string
  resetStep: string
  tungguDurasi: string
  depositKeOwner: string

  // Step durations
  menit_singkat: string
  jam_singkat: string
  hari_singkat: string
  minggu_singkat: string

  // Reward
  hadiahTertunda: string
  klaim: string
  sedangKlaim: string
  sudahDiklaim: string
  rewardMON: string
  rewardPotensial: string
  totalProfit: string
  minKlaim: string

  // Waiting
  masaTunggu: string
  silakanMain: string

  // Rules
  aturan: string
  rule1: string
  rule2: string
  rule3: string
  rule4: string
  rule5: string

  // Misc
  rentalAktif: string
  tersisa: string
  tarikDeposit: string
  hubungkanWallet: string
  untukMulai: string
  btnHubungkan: string
  btnTerhubung: string
  btnBelumTerhubung: string
  realTimeDisclaimer: string
  jam: string
  menit: string
  nextReward: string
  stepShort: string
  modal: string
  profitPotensial: string
  houseEdge: string
  hargaDisimpan: string
  tungguDurasiHabis: string
  klikCekHasil: string
  salahDepositKeOwner: string
  benarDapatReward: string
  stepBerikutnya: string
  resetKeStep1: string
  drawMessage: string
  winMessage: string
  loseMessage: string

  // New
  perpanjangSewa: string
  sewaDitambahkan: string
  aktifSampai: string
  perpanjang: string
  cekHasil: string
  hasilTebakan: string
  hasilBenAR: string
  hasilSalah: string
  tebakanAktifInfo: string
  langkahDurasi: string
}

export const translations: Record<Language, Translations> = {
  id: {
    appTitle: 'BTC Oracle V2',
    tagline: 'MONAD TESTNET · TEBak ARAH BTC',
    saldo: 'Saldo',
    wallet: 'Wallet',
    connectWallet: 'Connect Wallet',
    connected: 'Terhubung',

    sewaSistem: 'Sewa Sistem',
    depositDesc: 'Deposit {mon} MON untuk bermain {days} hari',
    deposit1MON: 'Deposit {mon} MON',
    processing: 'Processing...',
    waitingConfirm: 'Menunggu konfirmasi...',
    sewaDulu: 'Sewa dulu {mon} MON',
    deposit: 'Deposit',
    expired: 'Expired',
    biayaSewa: 'Biaya Sewa',

    step: 'Step',
    langkah: 'Langkah',
    langkah_singkat: 'L',
    durasi: 'Durasi',
    tebakArah: 'Tebak Arah BTC',
    pilihNaikTurun: 'Pilih NAIK atau TURUN',
    naiknya: 'Anda memilih: NAIK ↑',
    turunnya: 'Anda memilih: TURUN ↓',
    konfirmasiNaik: 'Konfirmasi NAIK ↑',
    konfirmasiTurun: 'Konfirmasi TURUN ↓',
    hargaStart: 'Harga Start',
    hargaSekarang: 'Harga Sekarang',
    hargaTersimpan: 'Harga Tersimpan',
    hargaBerubah: 'Harga Berubah',
    perubahan: 'Perubahan',
    naik: 'NAIK',
    turun: 'TURUN',
    sama: 'SAMA',
    menunggu: 'Menunggu...',
    menunguKonfirmasi: 'Konfirmasi di blockchain...',
    betAktif: 'Tebakan Aktif',
    dalamMasaTunggu: 'Dalam Masa Tunggu',
    salah: 'SALAH',
    benar: 'BENAR',
    menang: 'MENANG',
    kalah: 'KALAH',
    resetStep: 'Reset ke Step 1',
    tungguDurasi: 'Tunggu {durasi}',
    depositKeOwner: 'Deposit masuk ke owner',

    menit_singkat: 'm',
    jam_singkat: 'h',
    hari_singkat: 'd',
    minggu_singkat: 'w',

    hadiahTertunda: 'Hadiah Tertunda',
    klaim: 'Klaim',
    sedangKlaim: 'Mengklaim...',
    sudahDiklaim: 'Sudah Diklaim',
    rewardMON: 'Reward MON',
    rewardPotensial: 'Reward Potensial',
    totalProfit: 'Total Profit',
    minKlaim: 'Minimal klaim: 1 MON (belum capai)',

    masaTunggu: 'MASA TUNGGU',
    silakanMain: 'SILAKAN MAIN',

    aturan: 'Aturan Main',
    rule1: 'Klik NAIK ↑ atau TURUN ↓ untuk simpan harga BTC saat ini',
    rule2: 'Tunggu sampai durasi selesai — tombol di-hidden',
    rule3: 'Klik CEK HASIL — bandingkan harga sekarang vs tersimpan',
    rule4: 'BENAR → dapat reward MON + lanjut step berikutnya',
    rule5: 'SALAH / absen → deposit 1 MON masuk ke owner, reset step 1',
    rentalAktif: 'Rental aktif:',
    tersisa: 'tersisa',
    tarikDeposit: 'Tarik deposit {mon} MON ↑',
    hubungkanWallet: 'Hubungkan Wallet',
    untukMulai: 'Hubungkan wallet untuk mulai bermain',
    btnHubungkan: 'Hubungkan Dompet',
    btnTerhubung: 'Terhubung',
    btnBelumTerhubung: 'Belum Terhubung',
    realTimeDisclaimer: 'Harga BTC/USD real-time dari CoinGecko. Tebakan berdasarkan arah harga (NAIK/TURUN).',
    jam: 'jam',
    menit: 'menit',
    nextReward: 'Reward Berikutnya',
    stepShort: 'Step {step}',
    modal: 'Modal 1 MON',
    profitPotensial: 'Profit Maksimal',
    houseEdge: 'House Edge',
    hargaDisimpan: 'Harga BTC sudah tersimpan!',
    tungguDurasiHabis: 'Tunggu durasi selesai...',
    klikCekHasil: 'Tekan tombol untuk cek hasil',
    salahDepositKeOwner: 'SALAH! Deposit 0.01 MON masuk ke owner',
    benarDapatReward: 'BENAR! Dapat reward MON',
    stepBerikutnya: 'Step berikutnya: {step}',
    resetKeStep1: 'Di-reset ke Step 1!',
    drawMessage: 'SERI! Harga tidak berubah — Anda tetap di Step ini',
    winMessage: 'MENANG! Anda dapat {reward} MON — Maju ke Step berikutnya',
    loseMessage: 'KALAH! Arah salah atau perubahan < 0.001% — Reset ke Step 1',

    perpanjangSewa: 'Perpanjang Sewa',
    sewaDitambahkan: 'Sewa ditambah {days} hari',
    aktifSampai: 'Aktif sampai',
    perpanjang: 'Perpanjang +30 Hari',
    hasilTebakan: 'HASIL TEBAKAN',
    hasilBenAR: 'BENAR! Dapat {reward} MON',
    hasilSalah: 'SALAH! Reset ke Step 1',
    tebakanAktifInfo: 'Tebakan aktif',
    langkahDurasi: 'Langkah {step} · {durasi}',
  },

  en: {
    appTitle: 'BTC Oracle V2',
    tagline: 'MONAD TESTNET · GUESS BTC DIRECTION',
    saldo: 'Balance',
    wallet: 'Wallet',
    connectWallet: 'Connect Wallet',
    connected: 'Connected',

    sewaSistem: 'Rent System',
    depositDesc: 'Deposit {mon} MON to play for {days} days',
    deposit1MON: 'Deposit {mon} MON',
    processing: 'Processing...',
    waitingConfirm: 'Waiting for confirmation...',
    sewaDulu: 'Rent first {mon} MON',
    deposit: 'Deposit',
    expired: 'Expired',
    biayaSewa: 'Rental Fee',

    step: 'Step',
    langkah: 'Step',
    langkah_singkat: 'S',
    durasi: 'Duration',
    tebakArah: 'Guess BTC Direction',
    pilihNaikTurun: 'Choose UP ↑ or DOWN ↓',
    naiknya: 'You chose: UP ↑',
    turunnya: 'You chose: DOWN ↓',
    konfirmasiNaik: 'Confirm UP ↑',
    konfirmasiTurun: 'Confirm DOWN ↓',
    hargaStart: 'Start Price',
    hargaSekarang: 'Current Price',
    hargaTersimpan: 'Stored Price',
    hargaBerubah: 'Price Changed',
    perubahan: 'Change',
    naik: 'UP',
    turun: 'DOWN',
    sama: 'SAME',
    cekHasil: 'CHECK RESULT',
    menunggu: 'Waiting...',
    menunguKonfirmasi: 'Confirming on blockchain...',
    betAktif: 'Active Bet',
    dalamMasaTunggu: 'In Waiting Period',
    salah: 'WRONG',
    benar: 'CORRECT',
    menang: 'WIN',
    kalah: 'LOSE',
    resetStep: 'Reset to Step 1',
    tungguDurasi: 'Wait {durasi}',
    depositKeOwner: 'Deposit goes to owner',

    menit_singkat: 'm',
    jam_singkat: 'h',
    hari_singkat: 'd',
    minggu_singkat: 'w',

    hadiahTertunda: 'Pending Reward',
    klaim: 'Claim',
    sedangKlaim: 'Claiming...',
    sudahDiklaim: 'Claimed',
    rewardMON: 'Reward MON',
    rewardPotensial: 'Potential Reward',
    totalProfit: 'Total Profit',
    minKlaim: 'Min claim: 1 MON (not reached)',

    masaTunggu: 'WAITING PERIOD',
    silakanMain: 'PLAY NOW',

    aturan: 'Game Rules',
    rule1: 'Click UP ↑ or DOWN ↓ to store the current BTC price',
    rule2: 'Wait until duration ends — buttons are hidden',
    rule3: 'Click CHECK RESULT — compare current price vs stored price',
    rule4: 'CORRECT → get MON reward + advance to next step',
    rule5: 'WRONG / absent → 1 MON deposit goes to owner, reset to step 1',
    rentalAktif: 'Rental active:',
    tersisa: 'remaining',
    tarikDeposit: 'Withdraw {mon} MON deposit ↑',
    hubungkanWallet: 'Connect Wallet',
    untukMulai: 'Connect wallet to start playing',
    btnHubungkan: 'Connect Wallet',
    btnTerhubung: 'Connected',
    btnBelumTerhubung: 'Not Connected',
    realTimeDisclaimer: 'Real-time BTC/USD price from CoinGecko. Guess the price direction (UP/DOWN).',
    jam: 'hr',
    menit: 'min',
    nextReward: 'Next Reward',
    stepShort: 'Step {step}',
    modal: '1 MON Modal',
    profitPotensial: 'Max Profit',
    houseEdge: 'House Edge',
    hargaDisimpan: 'BTC price stored!',
    tungguDurasiHabis: 'Wait for duration to end...',
    klikCekHasil: 'Press button to check result',
    salahDepositKeOwner: 'WRONG! 0.01 MON deposit goes to owner',
    benarDapatReward: 'CORRECT! Got MON reward',
    stepBerikutnya: 'Next step: {step}',
    resetKeStep1: 'Reset to Step 1!',
    drawMessage: 'DRAW! Price unchanged — You stay on this Step',
    winMessage: 'WIN! You got {reward} MON — Advance to next Step',
    loseMessage: 'LOSE! Wrong direction or change < 0.001% — Reset to Step 1',

    perpanjangSewa: 'Extend Rental',
    sewaDitambahkan: 'Rental extended by {days} days',
    aktifSampai: 'Active until',
    perpanjang: 'Extend +30 Days',
    hasilTebakan: 'BET RESULT',
    hasilBenAR: 'CORRECT! Got {reward} MON',
    hasilSalah: 'WRONG! Reset to Step 1',
    tebakanAktifInfo: 'Active bet',
    langkahDurasi: 'Step {step} · {durasi}',
  },
}

// Helper function untuk format string
export function t(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
}

// Format durasi jadi string
export function formatDuration(sec: number, tr: Translations): string {
  if (sec < 60) return `${sec}s`
  if (sec < 3600) return `${Math.round(sec / 60)}${tr.menit_singkat}`
  if (sec < 86400) return `${Math.round(sec / 3600)}${tr.jam_singkat}`
  // >= 1 day: use floor to preserve whole days; show 1 decimal for partial days
  const days = sec / 86400
  if (days < 7) return `${days.toFixed(1)}${tr.hari_singkat}`
  if (days < 30) return `${Math.floor(days)}${tr.hari_singkat}`
  return `${Math.round(sec / 604800)}${tr.minggu_singkat}`
}
