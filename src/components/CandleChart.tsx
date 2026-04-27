import { useEffect, useRef, useState } from 'react'
import { useLanguage, usePriceData } from '@/hooks/useGameData'

// TradingView Lightweight Charts loaded via CDN (standalone, no bundler deps)
declare global {
  interface Window {
    LightweightCharts: typeof import('lightweight-charts')
  }
}

interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
}

interface Props {
  candles: Candle[]
  currentPrice: number
  isUp: boolean
}

// ============================================================
// CandleChart — TradingView Lightweight Charts via CDN
// ============================================================
export default function CandleChart({ candles, currentPrice, isUp }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)

  // Init chart once when library is ready
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function initChart(LightweightCharts: any) {
      if (chartRef.current) return // already initialized

      const chart = LightweightCharts.createChart(container, {
        width: container.clientWidth || 640,
        height: container.clientHeight || 380,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#64748b',
          fontFamily: 'Space Mono, monospace',
        },
        grid: {
          vertLines: { color: '#e2e8f0' },
          horzLines: { color: '#e2e8f0' },
        },
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
          vertLine: { color: '#94a3b8', width: 1, style: 2 },
          horzLine: { color: '#94a3b8', width: 1, style: 2 },
        },
        rightPriceScale: {
          borderColor: '#e2e8f0',
          textColor: '#64748b',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          borderColor: '#e2e8f0',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true },
        handleScale: { axisPressedMouseMove: true },
      })

      const series = chart.addCandlestickSeries({
        upColor: '#16a34a',
        downColor: '#fed7aa',
        borderUpColor: '#16a34a',
        borderDownColor: '#f97316',
        wickUpColor: '#16a34a',
        wickDownColor: '#f97316',
      })

      chartRef.current = chart
      seriesRef.current = series

      const ro = new ResizeObserver(() => {
        if (chart && container) {
          chart.applyOptions({ width: container.clientWidth, height: container.clientHeight })
        }
      })
      ro.observe(container)
    }

    // Try immediate
    if (window.LightweightCharts) {
      initChart(window.LightweightCharts)
      return
    }

    // Load via CDN
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js'
    script.onload = () => {
      if (window.LightweightCharts) initChart(window.LightweightCharts)
    }
    script.onerror = () => {
      // Fallback: use bundled version
      import('lightweight-charts').then(lc => {
        initChart(lc)
      })
    }
    document.head.appendChild(script)

    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        seriesRef.current = null
      }
    }
  }, [])

  // Update candle data
  useEffect(() => {
    const series = seriesRef.current
    const chart = chartRef.current
    if (!series || !chart || candles.length === 0) return

    try {
      series.setData(candles.map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })))
      chart.timeScale().fitContent()
    } catch {}
  }, [candles])

  // Update current price line
  useEffect(() => {
    const series = seriesRef.current
    if (!series || currentPrice <= 0) return
    try {
      series.createPriceLine({
        price: currentPrice,
        color: isUp ? '#16a34a' : '#f97316',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
      })
    } catch {}
  }, [currentPrice, isUp])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
    />
  )
}

// ============================================================
// useCandleChart — loads history + Binance WS, stable across renders
// ============================================================
export function useCandleChart() {
  const [candles, setCandles] = useState<Candle[]>([])
  const prices = usePriceData()
  const wsRef = useRef<WebSocket | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    let cancelled = false

    async function init() {
      // CoinGecko OHLC — primary data source (history)
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=3',
          { signal: AbortSignal.timeout(15000) }
        )
        if (cancelled) return
        if (!res.ok) throw new Error('CoinGecko failed')
        const raw: number[][] = await res.json()
        if (cancelled) return
        setCandles(raw.map(d => ({
          time: Math.floor(d[0] / 1000),
          open: d[1],
          high: d[2],
          low: d[3],
          close: d[4],
        })))
      } catch {
        // Silent fail
      }

      // Binance WebSocket — live candle updates
      try {
        const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1m')
        ws.onmessage = (ev) => {
          if (cancelled) return
          try {
            const { k } = JSON.parse(ev.data)
            const candle: Candle = {
              time: Math.floor(k.t / 1000),
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
            }
            setCandles(prev => {
              const arr = [...prev]
              if (arr.length > 0 && arr[arr.length - 1].time === candle.time) {
                arr[arr.length - 1] = candle
              } else {
                arr.push(candle)
                if (arr.length > 500) arr.shift()
              }
              return arr
            })
          } catch {}
        }
        ws.onerror = () => ws.close()
        wsRef.current = ws
      } catch {}
    }

    init()
    return () => {
      cancelled = true
      try { wsRef.current?.close() } catch {}
      wsRef.current = null
    }
  }, [])

  return {
    candles,
    currentPrice: prices.btcPrice,
    isUp: prices.btcChange24h >= 0,
  }
}
