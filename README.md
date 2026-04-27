# BTC Oracle V2

> Guess BTC price direction on Monad Testnet and earn MON rewards.

**BTC Oracle V2** is a blockchain-based prediction game where you forecast whether BTC/USD will go **UP (NAIK)**, **DOWN (TURUN)**, or **STAY (SAMA)**. Win to earn 0.0005 MON per step and climb through 10 levels with increasing durations.

Contract: `0xe7716ab22af8a82f7e2cbf52b9a986687934d911`
Network: [Monad Testnet](https://testnet.monad.xyz) · Chain ID: `10143`

---

## Quick Start

```bash
git clone https://github.com/edwinariesto/BTC-Oracle-V2.git
cd BTC-Oracle-V2
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

## Game Rules

| Direction | When you win |
|-----------|-------------|
| NAIK ↑ | BTC price increases by ≥ 0.001% |
| SAMA — | BTC price changes by < 0.001% (TIE) |
| TURUN ↓ | BTC price decreases by ≥ 0.001% |

**No deposit loss on wrong guess** — your 0.01 MON stays safe.

## Documentation

- 🇮🇩 [Panduan Bahasa Indonesia](./PANDUAN-ID.md)
- 🇬🇧 [English Guide](./PANDUAN-EN.md)

## Tech Stack

React · TypeScript · Tailwind CSS · wagmi v2 · RainbowKit · Vite · Solidity · Hardhat · Monad Testnet

---

*Powered by Edwin Al-Syatrie © 2026*
