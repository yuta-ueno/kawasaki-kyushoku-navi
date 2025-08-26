// pages/_app.js - 修正版
import { SWRConfig } from 'swr'
import { swrConfig } from '../lib/swr-config'
import '../styles/globals.css'
import { useEffect } from 'react'
import LINEWebViewDetector from '../components/webview/LINEWebViewDetector'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Service Worker を登録
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }
  }, [])

  return (
    <SWRConfig value={swrConfig}>
      <div className="app-container">
        <LINEWebViewDetector />
        <Component {...pageProps} />
      </div>
    </SWRConfig>
  )
}
