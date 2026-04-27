import { useEffect, useRef } from 'react'
import { useLanguage } from '@/hooks/useGameData'
import btcLogo from '@/images/btc-logo.png'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gecko-coin-price-chart-widget': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
    }
  }
}

export default function ChartPanel() {
  const { lang, tr } = useLanguage()
  const widgetRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    if (scriptLoadedRef.current) return
    scriptLoadedRef.current = true

    const script = document.createElement('script')
    script.src = 'https://widgets.coingecko.com/gecko-coin-price-chart-widget.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    const container = widgetRef.current
    if (!container) return

    container.innerHTML = ''

    const widget = document.createElement('gecko-coin-price-chart-widget')
    widget.setAttribute('locale', lang === 'id' ? 'id' : 'en')
    widget.setAttribute('outlined', 'true')
    widget.setAttribute('coin-id', 'bitcoin')
    widget.setAttribute('initial-currency', 'usd')
    widget.setAttribute('width', '0')
    widget.setAttribute('height', '0')
    container.appendChild(widget)
  }, [lang])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-2">
          <img src={btcLogo} alt="BTC" className="h-5 w-5 object-contain" />
          <div className="text-xs uppercase tracking-widest text-white/60 font-semibold">BTC/USD</div>
          <div className="font-mono text-xs text-slate-400">
            {lang === 'id' ? '· 1 Hari · Live' : '· 1 Day · Live'}
          </div>
        </div>
        <div className="font-mono text-xs text-slate-500 hidden sm:block">
          CoinGecko · HighCharts
        </div>
      </div>

      {/* CoinGecko Chart Widget */}
      <div ref={widgetRef} style={{ minHeight: 0 }} />

      {/* Disclaimer */}
      <div className="px-5 py-2 border-t border-slate-700 bg-slate-900">
        <div className="text-xs text-slate-500 font-mono">{tr.realTimeDisclaimer}</div>
      </div>
    </div>
  )
}
