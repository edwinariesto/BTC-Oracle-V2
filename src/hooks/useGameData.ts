import { useState, useEffect, useCallback } from 'react'
import { Language, translations } from '@/i18n'

// ============================================================
// Language Store
// ============================================================
let currentLang: Language = 'id'
const langListeners: Set<(lang: Language) => void> = new Set()

export function setLanguage(lang: Language) {
  currentLang = lang
  langListeners.forEach(fn => fn(lang))
  try { localStorage.setItem('btc-oracle-lang', lang) } catch {}
}

export function useLanguage() {
  const [lang, setLang] = useState<Language>(currentLang)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('btc-oracle-lang') as Language | null
      if (saved === 'id' || saved === 'en') {
        currentLang = saved
        setLang(saved)
      }
    } catch {}
    const handler = (l: Language) => setLang(l)
    langListeners.add(handler)
    return () => { langListeners.delete(handler) }
  }, [])

  const toggle = useCallback(() => {
    setLanguage(currentLang === 'id' ? 'en' : 'id')
  }, [])

  return { lang, toggle, tr: translations[currentLang] }
}

// ============================================================
// Price Data
// ============================================================
export interface PriceData {
  btcPrice: number       // USD
  monPrice: number       // USD
  btcChange24h: number   // %
  idrRate: number        // IDR per USD
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

let priceDataCache: PriceData = {
  btcPrice: 0,
  monPrice: 0,
  btcChange24h: 0,
  idrRate: 0,
  loading: true,
  error: null,
  lastUpdated: null,
}
const priceListeners: Set<(data: PriceData) => void> = new Set()

async function fetchPrices() {
  const newData: PriceData = {
    btcPrice: priceDataCache.btcPrice,
    monPrice: priceDataCache.monPrice,
    btcChange24h: priceDataCache.btcChange24h,
    idrRate: priceDataCache.idrRate,
    loading: false,
    error: null,
    lastUpdated: new Date(),
  }

  // Fetch BTC + MON (separate calls, avoid batching) + IDR in parallel
  const [btcResult, monResult, idrResult] = await Promise.allSettled([
    fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin' +
      '?localization=false&tickers=false&community_data=false&developer_data=false',
      { signal: AbortSignal.timeout(5000) }
    ).then(r => r.json()),

    fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=monad&vs_currencies=usd',
      { signal: AbortSignal.timeout(5000) }
    ).then(r => r.json()),

    fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(5000),
    }).then(r => r.json()),
  ])

  if (btcResult.status === 'fulfilled') {
    try {
      const d = btcResult.value
      if (d?.market_data?.current_price?.usd > 0) {
        newData.btcPrice = d.market_data.current_price.usd
        newData.btcChange24h = d.market_data.price_change_percentage_24h ?? 0
      }
    } catch {}
  } else {
    newData.error = 'price'
  }

  if (monResult.status === 'fulfilled') {
    try {
      const d = monResult.value
      if (d?.monad?.usd > 0) {
        newData.monPrice = d.monad.usd
      }
    } catch {}
  }

  if (idrResult.status === 'fulfilled') {
    try {
      const d = idrResult.value
      if (d.rates?.IDR > 0) {
        newData.idrRate = d.rates.IDR
      }
    } catch {}
  } else {
    newData.error = 'idr'
  }

  priceDataCache = newData
  priceListeners.forEach(fn => fn(newData))
}

export function usePriceData() {
  const [data, setData] = useState<PriceData>(priceDataCache)

  useEffect(() => {
    const handler = (d: PriceData) => setData(d)
    priceListeners.add(handler)
    setData({ ...priceDataCache })
    // Refresh every 1s — real-time price for short-duration steps (Step 1 = 30s)
    const interval = setInterval(fetchPrices, 1_000)
    return () => {
      priceListeners.delete(handler)
      clearInterval(interval)
    }
  }, [])

  return data
}

export function isPriceValid(prices: PriceData): boolean {
  return !prices.loading &&
         prices.btcPrice > 0 &&
         prices.idrRate > 0
}
