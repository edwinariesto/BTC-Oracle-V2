# BTC Oracle V2 — Complete Beginner's Guide

> **English version** · [Indonesian version](./PANDUAN-ID.md)

---

## What Is This?

**BTC Oracle V2** is a blockchain game on **Monad Testnet** where you predict whether the BTC/USD price will go **UP (NAIK)**, **DOWN (TURUN)**, or **STAY THE SAME (SAMA)**. Win to earn MON rewards and climb through 10 steps with increasing durations.

> ⚠️ This game runs on **Monad Testnet** — the MON token has **no real money value**. It's free to play using faucet MON.

---

## Step 1 — Install Required Tools

### 1.1 Install Node.js
1. Go to **https://nodejs.org/** → Download **LTS** version (v20 or v22)
2. Install → Next → Finish
3. Verify: open a new terminal/CMD and type:
   ```bash
   node -v
   ```
   Should show a version like `v20.18.0`

### 1.2 Install VS Code
1. Go to **https://code.visualstudio.com/** → Download & Install
2. Open VS Code

### 1.3 Install MetaMask (Browser Wallet)
1. Go to **https://metamask.io/download/**
2. Install the extension for Chrome, Firefox, or Brave
3. Click **"Get Started"** → **"Create a new wallet"**
4. Create a password → Accept terms → Click **"Create"**
5. **IMPORTANT:** You will see 12 words (Secret Recovery Phrase):
   - Write them down on paper
   - Store in a **very safe place**
   - These 12 words = master key to your wallet
   - Anyone with these words can steal everything!

---

## Step 2 — Setup Monad Testnet

### 2.1 Add Monad Network to MetaMask
1. Open MetaMask → Click your **avatar** → **Settings** → **Networks** → **Add Network**
2. Click **"Add a network manually"** at the bottom
3. Fill in exactly:

| Field | Value |
|-------|-------|
| **Network Name** | `Monad Testnet` |
| **Network URL** | `https://testnet-rpc.monad.xyz` |
| **Chain ID** | `10143` |
| **Currency Symbol** | `MON` |
| **Block Explorer** | `https://testnet.monad.xyz` |

4. Click **Save**

### 2.2 Get Free MON (Faucet)
1. Go to **https://faucet.monad.xyz/**
2. Paste your MetaMask wallet address
3. Click **Claim**
4. Wait 1-2 minutes for MON to appear in MetaMask
5. Verify: Open MetaMask → balance should increase

---

## Step 3 — Setup the Project

### 3.1 Clone the Project
```bash
cd c:\xampp\htdocs\project
git clone https://github.com/edwinariesto/BTC-Oracle-V2.git
cd BTC-Oracle-V2
```

### 3.2 Install Dependencies
```bash
npm install
```

### 3.3 Create .env File (Important!)
The `.env` file stores your **owner private key** for deploying the smart contract. **Never share or upload this file!**

```bash
# In VS Code terminal:
copy .env.example .env
```

Open `.env` in VS Code and fill in your owner private key:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE_64_CHARACTERS_0123456789abcdef
```

**How to get your private key from MetaMask:**
1. Open MetaMask → Click **3 dots (...)** on your account
2. Select **"Account Details"**
3. Click **"Export Private Key"**
4. Enter your MetaMask password
5. Copy the key (starts with `0x...`) → Paste into `.env`

> ⚠️ **WARNING:**
> - `.env` is already in `.gitignore` (will NOT be uploaded to GitHub)
> - Never share your private key with anyone
> - Real assets = real money. Private key = full access to your wallet

---

## Step 4 — Deploy the Smart Contract

### 4.1 Compile
```bash
npm run compile
```
Expected output:
```
Compiled 2 Solidity files with solc 0.8.28
✓ compilation finished
```

### 4.2 Deploy to Monad Testnet
```bash
npm run deploy
```
Example output:
```
Deploying BTCOraclePredictorV2...
  deployed at: 0xe7716ab22af8a82f7e2cbf52b9a986687934d911
```

**IMPORTANT:** Save this contract address! You will need it in the next step.

### 4.3 Update Contract Address
Open `src/config/wagmi.ts` → replace the address:

```typescript
export const CONTRACT_ADDRESS = {
  BTCOraclePredictorV2: '0xe7716ab22af8a82f7e2cbf52b9a986687934d911',
} as const
```

### 4.4 Fund the House Pool (Optional — for Owner)
To fund rewards for players, send MON to the contract:
```bash
npm run fund
```
Or manually send MON to the contract address from your owner wallet.

---

## Step 5 — Run the Application

### Development Mode (Recommended)
```bash
npm run dev
```
Open browser → **http://localhost:5173/**

### Production Build
```bash
npm run build
```
Files are in the `dist/` folder. Deploy `dist/` to any static hosting (Vercel, Netlify, GitHub Pages, etc.)

---

## How to Play

### Game Concept
1. **Rent access** — Deposit 1 MON → get 30 days of access
2. **Predict BTC direction** — Choose UP, DOWN, or STAY within a time limit
3. **Wait for the duration** — Duration depends on your current step
4. **Check result** — Correct = reward + step up. Wrong = reset to step 1 (no deposit deduction!)
5. **Repeat** — Climb all 10 steps for maximum rewards

### Step Duration & Rewards Table

| Step | Duration | Reward | Cumulative Time |
|------|----------|--------|----------------|
| 1 | 30 sec | 0.0005 MON | 30 sec |
| 2 | 1 min | 0.0005 MON | 1.5 min |
| 3 | 5 min | 0.0005 MON | 6.5 min |
| 4 | 30 min | 0.0005 MON | 36.5 min |
| 5 | 2 hrs | 0.0005 MON | 2.5 hrs |
| 6 | 10 hrs | 0.0005 MON | 12.5 hrs |
| 7 | 2 days | 0.0005 MON | 2.5 days |
| 8 | 6 days | 0.0005 MON | 8.5 days |
| 9 | 10 days | 0.0005 MON | 18.5 days |
| 10 | ~11.4 days | 0.0005 MON | **30 days total** |

> Total game time from Step 1 to Step 10 = exactly 30 days (2,592,000 seconds)

### The 3 Directions Explained

| Direction | Label | Meaning |
|-----------|-------|---------|
| **TURUN ↓** | 0 | BTC price goes DOWN by ≥ 0.001% |
| **SAMA —** | 1 | BTC price change is < 0.001% (TIE) |
| **NAIK ↑** | 2 | BTC price goes UP by ≥ 0.001% |

> **Threshold:** The minimum price change to count as UP or DOWN is **0.001%**. If the change is less than that, the result is STAY (SAMA).

**Example:**
- You bet **NAIK** when BTC = $95,000
- After 30 seconds, BTC = $95,001
- Change: $1 / $95,000 = 0.00105% → **≥ 0.001%** → You WIN! ✅
- After 30 seconds, BTC = $94,999.99
- Change: ~0.00001% → **< 0.001%** → Result = SAMA (tie, no reward, but stay on same step)

### Playing Steps

#### 1. Connect Wallet
- Click **"Connect Wallet"** in the app
- Select your MetaMask wallet
- Confirm the connection

#### 2. Rent Access
- Click **"Deposit 1 MON"**
- Confirm in MetaMask
- Wait for blockchain confirmation (~5 seconds)
- You now have 30 days of access!

> Your 1 MON stays in the smart contract and can be withdrawn anytime (as long as no bet is active).

#### 3. Place a Bet
1. Watch the live BTC/USD price chart
2. Analyze the price movement
3. Click one of the 3 buttons:
   - **NAIK ↑** — You think price will go up
   - **SAMA —** — You think price will stay (change < 0.001%)
   - **TURUN ↓** — You think price will go down
4. The current BTC price is stored on the blockchain
5. A countdown timer appears

#### 4. Wait for Duration
- Wait until the countdown reaches zero
- Duration depends on your current step (see table above)
- You cannot cancel the bet

#### 5. Check Result
- Click the **"CHECK RESULT"** button
- The smart contract compares the stored price with the current price
- Results:
  - **WIN:** Get 0.0005 MON reward + advance to next step
  - **SAMA (TIE):** No reward, stay on current step, can bet again immediately
  - **LOSE:** Reset to Step 1, wait 5 seconds cooldown, deposit NOT deducted

#### 6. Withdraw Deposit
- As long as no bet is active, you can withdraw your deposit anytime
- Click **"Withdraw"** → MON returns to your wallet

---

## Troubleshooting

### "Chain 10143 not found" — Wallet won't connect
1. Make sure Monad Testnet is added in MetaMask (see Step 2.1)
2. Verify Chain ID is `10143`
3. Verify RPC URL is `https://testnet-rpc.monad.xyz`
4. Refresh the page
5. Try turning off VPN

### "Insufficient funds"
- Go to **https://faucet.monad.xyz/** → Claim free MON
- Max 2-3 claims per day

### "Rent first" / "Rental expired"
- Click **"Deposit 1 MON"** to activate or extend your rental

### "Still in cooldown"
- You just lost a bet → wait **5 seconds**
- The countdown will disappear automatically

### "Complete bet first" when withdrawing
- An active bet exists → wait for it to finish
- Click **"CHECK RESULT"** → then withdraw

### App shows white/blank screen
1. Open DevTools (F12) → Console tab → Look for red errors
2. Check if contract address in `wagmi.ts` matches deployed contract
3. Check your internet connection
4. Refresh the page

### "Failed to fetch data from blockchain"
- Check your internet connection
- The RPC endpoint might be temporarily down → try again in a few minutes
- Make sure Monad Testnet is selected in MetaMask

---

## Important Commands

```bash
npm install          # Install all dependencies
npm run compile      # Compile the Solidity smart contract
npm run deploy       # Deploy contract to Monad Testnet
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build production files to dist/
npm run preview      # Preview production build locally
```

---

## Project File Structure

```
BTC-Oracle-V2/
├── PANDUAN-EN.md              # This file (English)
├── PANDUAN-ID.md              # Indonesian guide
├── README.md                  # Quick README
├── .env                       # PRIVATE_KEY (SECRET — not uploaded)
├── .gitignore                 # Ignored files list
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── hardhat.config.js
├── index.html
│
├── src/
│   ├── main.tsx               # Entry: React + wagmi + RainbowKit
│   ├── App.tsx                # Main game UI
│   ├── index.css              # Styling (Tailwind + animations)
│   ├── i18n.ts                # Language translation (EN/ID)
│   ├── images.d.ts
│   ├── images/                # Logos (BTC, Monad, EN/ID flags)
│   ├── hooks/
│   │   └── useGameData.ts     # Language store + live price data
│   ├── config/
│   │   └── wagmi.ts           # Wallet + contract config
│   └── components/
│       ├── ChartPanel.tsx     # BTC price chart
│       ├── StepGrid.tsx       # Step 1-10 progress circles
│       ├── DirectionPanel.tsx  # NA/K/SAMA/TURUN prediction buttons
│       ├── BetCard.tsx        # Active bet display + countdown
│       ├── RentCard.tsx       # Rental deposit card
│       ├── WaitingCard.tsx    # Cooldown card
│       ├── RulesBox.tsx       # Game rules
│       ├── LeaderboardModal.tsx # Top players leaderboard
│       ├── FlagIcons.tsx      # EN/ID flag SVG components
│       └── AnimatedBackground.tsx # Animated BTC coins + stars
│
├── contracts/
│   └── BTCOraclePredictorV2.sol  # Smart contract (Solidity)
│
├── ignition/
│   └── modules/
│       └── BTCOracle.ts       # Deployment script
│
└── scripts/
    └── simple_deploy.cjs       # Alternative deploy script
```

---

## Smart Contract Reference

**Contract Address:** `0xe7716ab22af8a82f7e2cbf52b9a986687934d911`
**Network:** Monad Testnet (Chain ID: 10143)
**Explorer:** https://testnet.monad.xyz

### Key Contract Functions

| Function | Description |
|----------|-------------|
| `rentSystem()` | Deposit 1 MON for 30 days rental |
| `placeBet(direction, startPrice)` | Place prediction (0=TURUN, 1=SAMA, 2=NAIK) |
| `resolveBet(currentPrice)` | Check bet result (called after duration) |
| `claimReward()` | Claim pending reward |
| `withdrawDeposit()` | Withdraw your deposit (no active bet required) |
| `getPlayerData(player)` | Read any player's current state |

### Key Values
```
Rental fee:    0.01 MON (not 1 MON — updated in V2!)
Days:          30 days per rental
Duration step: 30s → 1m → 5m → 30m → 2h → 10h → 2d → 6d → 10d → ~11.4d
Reward:        0.0005 MON per step (all steps)
Threshold:     0.001% minimum price change
Cooldown:      5 seconds after losing
```

---

## Security Notes

> 🔐 **PROTECT YOUR PRIVATE KEY!**
> - Never share your private key with anyone — not even "support" or "developers"
> - Never enter your private key on websites you don't trust
> - Real wallet private keys = real money. Testnet keys = no value, but good practice
> - If lost, your assets are gone forever — there is no recovery

> ⚠️ **THIS IS A TESTNET GAME**
> - MON Testnet tokens are **free and have NO real value**
> - Contracts on testnet can be reset at any time
> - Always DYOR (Do Your Own Research) before interacting with any contract

---

*BTC Oracle V2 · Powered by Edwin Al-Syatrie © 2026*
