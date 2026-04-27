import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'
import App from './App'
import { wagmiConfig } from '@/config/wagmi'

const queryClient = new QueryClient()

// Error Boundary — prevents white/blank screen on any render crash
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: undefined }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: '2rem', color: '#ef4444', fontFamily: 'Space Mono, monospace' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '8px' }}>Terjadi error pada aplikasi</h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '8px 16px',
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'Space Mono, monospace',
              fontSize: '12px',
            }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function Main() {
  return (
    <StrictMode>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={lightTheme({
              accentColor: '#7c3aed',
              accentColorForeground: 'white',
              borderRadius: 'medium',
            })}
            modalSize="compact"
          >
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<Main />)
