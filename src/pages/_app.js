// pages/_app.js - 修正版
import { SWRConfig } from 'swr'
import { swrConfig } from '../lib/swr-config'
import '../styles/globals.css'
import { useEffect } from 'react'
import LINEWebViewDetector from '../components/webview/LINEWebViewDetector'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Service Worker を無効化（キャッシュ問題を回避）
    // Firestore データキャッシュのみを使用する戦略のため無効化
    console.log('Service Worker registration disabled to avoid cache conflicts')
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
