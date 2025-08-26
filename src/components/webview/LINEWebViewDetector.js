import React, { useState, useEffect } from 'react'
import { ExternalLink, Smartphone, AlertCircle } from 'lucide-react'
import OpenInBrowserModal from './OpenInBrowserModal'

const LINEWebViewDetector = () => {
  const [isLINEWebView, setIsLINEWebView] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [deviceType, setDeviceType] = useState('unknown')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const detectLINEWebView = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isIOS = /iphone|ipad|ipod/.test(userAgent)
      const isAndroid = /android/.test(userAgent)
      
      // LINEアプリ内WebViewの判定
      const isLINE = userAgent.includes('line') || 
                    userAgent.includes('linewebview') ||
                    userAgent.includes('lineinapp') ||
                    // LINE内のWebViewでよく見られるパターン
                    (userAgent.includes('line') && userAgent.includes('webkit'))

      console.log('LINE WebView detection:', {
        userAgent,
        isLINE,
        isIOS,
        isAndroid
      })

      if (isLINE) {
        setIsLINEWebView(true)
        if (isIOS) {
          setDeviceType('ios')
        } else if (isAndroid) {
          setDeviceType('android')
        }
      }
    }

    detectLINEWebView()
  }, [])

  const handleOpenInBrowser = () => {
    const currentUrl = window.location.href

    if (deviceType === 'android') {
      // Android: Chrome Intent URLを生成してChrome起動を試行
      const chromeUrl = `googlechrome://navigate?url=${encodeURIComponent(currentUrl)}`
      
      try {
        // Chrome Intent URLにリダイレクト
        window.location.href = chromeUrl
        
        // フォールバック: 500ms後にモーダル表示
        setTimeout(() => {
          setShowModal(true)
        }, 500)
      } catch (error) {
        console.error('Failed to open in Chrome:', error)
        setShowModal(true)
      }
    } else {
      // iOS: 手順説明モーダルを表示
      setShowModal(true)
    }
  }

  // クライアントサイドでない場合は表示しない
  if (!isClient) {
    return null
  }

  // LINEアプリ内WebViewでない場合は表示しない
  if (!isLINEWebView) {
    return null
  }

  return (
    <>
      {/* LINE WebView警告バー */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 sm:py-3">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium truncate">
                  LINEアプリ内では一部機能が制限されます
                </p>
                <p className="text-xs opacity-90 hidden sm:block">
                  すべての機能をご利用いただくには外部ブラウザでご覧ください
                </p>
              </div>
            </div>
            
            <button
              onClick={handleOpenInBrowser}
              className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              aria-label="外部ブラウザで開く"
            >
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>外部ブラウザで開く</span>
            </button>
          </div>
        </div>
      </div>

      <OpenInBrowserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        deviceType={deviceType}
        currentUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
    </>
  )
}

export default LINEWebViewDetector