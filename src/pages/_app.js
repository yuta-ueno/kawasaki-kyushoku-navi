// pages/_app.js - 修正版
import { SWRConfig } from 'swr'
import { swrConfig } from '../lib/swr-config'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <SWRConfig value={swrConfig}>
      <div className="app-container">
        <Component {...pageProps} />
      </div>
    </SWRConfig>
  )
}
