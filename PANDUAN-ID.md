# BTC Oracle V2 — Panduan Lengkap untuk Pemula

> **Versi Indonesia** · [English version](./PANDUAN-EN.md)

---

## Apa Itu BTC Oracle V2?

**BTC Oracle V2** adalah game blockchain di **Monad Testnet** di mana kamu menebak apakah harga BTC/USD akan **NAIK**, **TURUN**, atau **DIAM (SAMA)**. Tebakan benar dapat reward MON dan naik ke step berikutnya. Ada **10 step** dengan durasi dan tantangan yang meningkat.

> ⚠️ Game ini berjalan di **Monad Testnet** — token MON di testnet **tidak memiliki nilai uang nyata**. Gratis dimainkan menggunakan MON dari faucet.

---

## Langkah 1 — Install Alat yang Dibutuhkan

### 1.1 Install Node.js
1. Buka **https://nodejs.org/** → Download versi **LTS** (v20 atau v22)
2. Install → Next → Finish
3. Verifikasi: buka terminal/CMD baru, ketik:
   ```bash
   node -v
   ```
   Akan muncul versi seperti `v20.18.0`

### 1.2 Install VS Code
1. Buka **https://code.visualstudio.com/** → Download & Install
2. Buka VS Code

### 1.3 Install MetaMask (Dompet Digital)
1. Buka **https://metamask.io/download/**
2. Install ekstensi untuk Chrome, Firefox, atau Brave
3. Klik **"Get Started"** → **"Create a new wallet"**
4. Buat password → Centang syarat → Klik **"Create"**
5. **PENTING:** Kamu akan melihat 12 kata (Secret Recovery Phrase):
   - Tulis di kertas
   - Simpan di tempat yang **sangat aman**
   - 12 kata ini = kunci utama dompet kamu
   - Siapa pun yang punya 12 kata ini bisa menguras semua aset!

---

## Langkah 2 — Setup Monad Testnet

### 2.1 Tambahkan Jaringan Monad ke MetaMask
1. Buka MetaMask → Klik **avatar** → **Settings** → **Networks** → **Add Network**
2. Klik **"Add a network manually"** di bagian bawah
3. Isi persis seperti ini:

| Kolom | Isi |
|-------|-----|
| **Network Name** | `Monad Testnet` |
| **Network URL** | `https://testnet-rpc.monad.xyz` |
| **Chain ID** | `10143` |
| **Currency Symbol** | `MON` |
| **Block Explorer** | `https://testnet.monad.xyz` |

4. Klik **Save**

### 2.2 Dapat MON Gratis dari Faucet
1. Buka **https://faucet.monad.xyz/**
2. Paste alamat wallet MetaMask kamu
3. Klik **Claim**
4. Tunggu 1-2 menit sampai MON muncul di MetaMask
5. Verifikasi: Buka MetaMask → saldo harus bertambah

---

## Langkah 3 — Setup Project

### 3.1 Clone Project dari GitHub
```bash
cd c:\xampp\htdocs\project
git clone https://github.com/edwinariesto/BTC-Oracle-V2.git
cd BTC-Oracle-V2
```

### 3.2 Install Semua Dependencies
```bash
npm install
```

### 3.3 Buat File .env (Penting!)
File `.env` menyimpan **private key owner** kamu untuk men-deploy smart contract. **Jangan pernah share atau upload file ini!**

```bash
# Di terminal VS Code:
copy .env.example .env
```

Buka `.env` di VS Code dan isi private key owner kamu:

```env
PRIVATE_KEY=0xPRIVATE_KEY_OWNER_ANDA_DISINI_64_KARAKTER_0123456789abcdef
```

**Cara dapat private key dari MetaMask:**
1. Buka MetaMask → Klik **3 titik (...)** di account kamu
2. Pilih **"Account Details"**
3. Klik **"Export Private Key"**
4. Masukkan password MetaMask kamu
5. Copy key (dimulai `0x...`) → Paste ke `.env`

> ⚠️ **PERINGATAN:**
> - `.env` sudah ada di `.gitignore` (TIDAK akan di-upload ke GitHub)
> - Jangan pernah share private key ke siapapun
> - Private key wallet mainnet = uang sungguhan. Jaga baik-baik!

---

## Langkah 4 — Deploy Smart Contract

### 4.1 Compile Kontrak
```bash
npm run compile
```
Output yang diharapkan:
```
Compiled 2 Solidity files with solc 0.8.28
✓ compilation finished
```

### 4.2 Deploy ke Monad Testnet
```bash
npm run deploy
```
Contoh output:
```
Deploying BTCOraclePredictorV2...
  deployed at: 0xe7716ab22af8a82f7e2cbf52b9a986687934d911
```

**SIMPAN ALAMAT INI!** Kamu butuh alamat kontrak ini di langkah berikutnya.

### 4.3 Update Alamat Kontrak
Buka `src/config/wagmi.ts` → ganti alamatnya:

```typescript
export const CONTRACT_ADDRESS = {
  BTCOraclePredictorV2: '0xe7716ab22af8a82f7e2cbf52b9a986687934d911',
} as const
```

### 4.4 Dana House Pool (Opsional — untuk Owner)
Untuk menyediakan reward bagi pemain, kirim MON ke kontrak:
```bash
npm run fund
```
Atau kirim MON manual ke alamat kontrak dari wallet owner.

---

## Langkah 5 — Jalankan Aplikasi

### Mode Development (Recommended)
```bash
npm run dev
```
Buka browser → **http://localhost:5173/**

### Build untuk Production
```bash
npm run build
```
File ada di folder `dist/`. Deploy `dist/` ke hosting statis manapun (Vercel, Netlify, GitHub Pages, dll.)

---

## Cara Bermain

### Konsep Game
1. **Sewa akses** — Deposit 0.01 MON → dapat 30 hari akses
2. **Tebak arah BTC** — Pilih NAIK, TURUN, atau SAMA dalam waktu tertentu
3. **Tunggu durasi** — Durasi tergantung step kamu saat ini
4. **Cek hasil** — Benar = reward + naik step. Salah = reset ke step 1 (deposit TIDAK dipotong!)
5. **Ulangi** — Raih semua 10 step untuk reward maksimal

### Tabel Durasi & Reward per Step

| Step | Durasi | Reward | Total Waktu |
|------|--------|--------|-------------|
| 1 | 30 detik | 0.0005 MON | 30 detik |
| 2 | 1 menit | 0.0005 MON | 1.5 menit |
| 3 | 5 menit | 0.0005 MON | 6.5 menit |
| 4 | 30 menit | 0.0005 MON | 36.5 menit |
| 5 | 2 jam | 0.0005 MON | 2.5 jam |
| 6 | 10 jam | 0.0005 MON | 12.5 jam |
| 7 | 2 hari | 0.0005 MON | 2.5 hari |
| 8 | 6 hari | 0.0005 MON | 8.5 hari |
| 9 | 10 hari | 0.0005 MON | 18.5 hari |
| 10 | ~11.4 hari | 0.0005 MON | **30 hari total** |

> Total waktu dari Step 1 ke Step 10 = tepat 30 hari (2.592.000 detik)

### 3 Arah Prediksi Explained

| Arah | Label | Arti |
|------|-------|------|
| **TURUN ↓** | 0 | Harga BTC TURUN ≥ 0.001% |
| **SAMA —** | 1 | Perubahan harga BTC < 0.001% (SERI) |
| **NAIK ↑** | 2 | Harga BTC NAIK ≥ 0.001% |

> **Threshold:** Perubahan harga minimum untuk dihitung sebagai NAIK atau TURUN adalah **0.001%**. Jika perubahan kurang dari itu, hasilnya SAMA (seri).

**Contoh:**
- Kamu pilih **NAIK** saat BTC = $95,000
- Setelah 30 detik, BTC = $95,001
- Perubahan: $1 / $95,000 = 0.00105% → **≥ 0.001%** → Kamu MENANG! ✅
- Setelah 30 detik, BTC = $94,999.99
- Perubahan: ~0.00001% → **< 0.001%** → Hasil = SAMA (seri, tidak dapat reward, tapi tetap di step ini)

### Langkah Bermain

#### 1. Konek Wallet
- Klik **"Hubungkan Dompet"** di aplikasi
- Pilih wallet MetaMask kamu
- Konfirmasi koneksi

#### 2. Sewa Akses
- Klik **"Deposit 0.01 MON"**
- Konfirmasi di MetaMask
- Tunggu konfirmasi blockchain (~5 detik)
- Kamu sekarang punya akses 30 hari!

> Deposit kamu disimpan di smart contract dan bisa ditarik kapan saja (asalkan tidak ada tebakan aktif).

#### 3. Pasang Tebakan
1. Lihat grafik harga BTC/USD yang update real-time
2. Analisa pergerakan harga
3. Klik salah satu dari 3 tombol:
   - **NAIK ↑** — Menurutmu harga akan naik
   - **SAMA —** — Menurutmu harga diam (perubahan < 0.001%)
   - **TURUN ↓** — Menurutmu harga akan turun
4. Harga BTC saat itu tersimpan di blockchain
5. Muncul hitung mundur waktu tunggu

#### 4. Tunggu Durasi
- Tunggu sampai hitung mundur mencapai nol
- Durasi tergantung step kamu saat ini (lihat tabel di atas)
- Kamu tidak bisa membatalkan tebakan

#### 5. Cek Hasil
- Klik tombol **"CEK HASIL"**
- Smart contract membandingkan harga tersimpan dengan harga sekarang
- Hasil:
  - **MENANG:** Dapat 0.0005 MON + naik ke step berikutnya
  - **SAMA (SERI):** Tidak dapat reward, tetap di step ini, bisa langsung pasang lagi
  - **KALAH:** Reset ke Step 1, tunggu 5 detik cooldown, deposit TIDAK dipotong

#### 6. Tarik Deposit
- Selama tidak ada tebakan aktif, kamu bisa tarik deposit kapan saja
- Klik **"Tarik Deposit"** → MON kembali ke wallet kamu

---

## Troubleshooting (Pemecahan Masalah)

### "Chain 10143 not found" — Wallet tidak konek
1. Pastikan Monad Testnet sudah ditambahkan di MetaMask (lihat Langkah 2.1)
2. Pastikan Chain ID adalah `10143`
3. Pastikan RPC URL adalah `https://testnet-rpc.monad.xyz`
4. Refresh halaman
5. Coba matikan VPN

### "Insufficient funds"
- Buka **https://faucet.monad.xyz/** → Claim MON gratis
- Maksimal 2-3 kali per hari

### "Sewa dulu" / "Rental expired"
- Klik **"Deposit 0.01 MON"** untuk aktifkan atau perpanjang sewa

### "Masih dalam masa tunggu"
- Kamu baru kalah tebakan → tunggu **5 detik**
- Hitung mundur akan hilang sendiri

### "Selesaikan bet dulu" saat mau tarik deposit
- Ada tebakan aktif yang belum selesai
- Tunggu durasi selesai → Klik **"CEK HASIL"** → baru tarik deposit

### Aplikasi layar putih / kosong
1. Buka DevTools (F12) → Tab Console → Cari error merah
2. Cek apakah alamat kontrak di `wagmi.ts` sama dengan kontrak yang di-deploy
3. Cek koneksi internet
4. Refresh halaman

### "Failed to fetch data from blockchain"
- Cek koneksi internet
- RPC endpoint mungkin sedang down → coba lagi beberapa menit
- Pastikan Monad Testnet dipilih di MetaMask

---

## Perintah Penting

```bash
npm install          # Install semua dependencies
npm run compile      # Compile smart contract Solidity
npm run deploy       # Deploy kontrak ke Monad Testnet
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build file production ke dist/
npm run preview      # Preview build production secara lokal
```

---

## Struktur File Project

```
BTC-Oracle-V2/
├── PANDUAN-ID.md              # File ini (Bahasa Indonesia)
├── PANDUAN-EN.md              # Panduan bahasa Inggris
├── README.md                  # README singkat
├── .env                       # PRIVATE_KEY (RAHASIA — tidak di-upload)
├── .gitignore                 # Daftar file yang diabaikan
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── hardhat.config.js
├── index.html
│
├── src/
│   ├── main.tsx               # Entry: React + wagmi + RainbowKit
│   ├── App.tsx                # UI game utama
│   ├── index.css              # Styling (Tailwind + animasi)
│   ├── i18n.ts                # Translasi bahasa (EN/ID)
│   ├── images.d.ts
│   ├── images/                # Logo (BTC, Monad, bendera EN/ID)
│   ├── hooks/
│   │   └── useGameData.ts     # Store bahasa + data harga live
│   ├── config/
│   │   └── wagmi.ts           # Konfigurasi wallet + kontrak
│   └── components/
│       ├── ChartPanel.tsx     # Grafik harga BTC
│       ├── StepGrid.tsx       # Lingkaran progress Step 1-10
│       ├── DirectionPanel.tsx # Tombol prediksi NAIK/SAMA/TURUN
│       ├── BetCard.tsx        # Tampilan tebakan aktif + countdown
│       ├── RentCard.tsx       # Card deposit sewa
│       ├── WaitingCard.tsx    # Card masa tunggu/cooldown
│       ├── RulesBox.tsx       # Aturan game
│       ├── LeaderboardModal.tsx # Papan skor pemain teratas
│       ├── FlagIcons.tsx      # Komponen SVG bendera EN/ID
│       └── AnimatedBackground.tsx # Animasi koin BTC + bintang
│
├── contracts/
│   └── BTCOraclePredictorV2.sol  # Smart contract (Solidity)
│
├── ignition/
│   └── modules/
│       └── BTCOracle.ts       # Script deployment
│
└── scripts/
    └── simple_deploy.cjs       # Script deploy alternatif
```

---

## Referensi Smart Contract

**Alamat Kontrak:** `0xe7716ab22af8a82f7e2cbf52b9a986687934d911`
**Jaringan:** Monad Testnet (Chain ID: 10143)
**Explorer:** https://testnet.monad.xyz

### Fungsi-fungsi Utama Kontrak

| Fungsi | Deskripsi |
|--------|-----------|
| `rentSystem()` | Deposit 0.01 MON untuk sewa 30 hari |
| `placeBet(direction, startPrice)` | Pasang tebakan (0=TURUN, 1=SAMA, 2=NAIK) |
| `resolveBet(currentPrice)` | Cek hasil tebakan (dipolar setelah durasi selesai) |
| `claimReward()` | Klaim reward yang pending |
| `withdrawDeposit()` | Tarik deposit kamu (tidak ada tebakan aktif) |
| `getPlayerData(player)` | Baca status pemain apapun |

### Nilai-nilai Penting
```
Biaya sewa:     0.01 MON
Hari:           30 hari per sewa
Durasi step:    30d → 1m → 5m → 30m → 2j → 10j → 2h → 6h → 10h → ~11.4h
Reward:         0.0005 MON per step (semua step sama)
Threshold:      0.001% perubahan harga minimum
Cooldown:      5 detik setelah kalah
```

---

## Catatan Keamanan

> 🔐 **JAGA PRIVATE KEY ANDA!**
> - Jangan pernah bagikan private key ke siapapun — termasuk "support" atau "developer"
> - Jangan masukkan private key di website yang tidak kamu percaya
> - Private key wallet mainnet = uang sungguhan. Lindungi baik-baik!
> - Jika hilang, aset kamu hilang навсегда — tidak ada pemulihan

> ⚠️ **INI ADALAH GAME DI TESTNET**
> - Token MON Testnet adalah **gratis dan tidak memiliki nilai uang nyata**
> - Kontrak di testnet bisa di-reset kapan saja
> - Selalu DYOR (Do Your Own Research) sebelum berinteraksi dengan kontrak apapun

---

*BTC Oracle V2 · Powered by Edwin Al-Syatrie © 2026*
