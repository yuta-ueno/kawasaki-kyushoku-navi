import React, { useState, useEffect } from 'react'
import { ExternalLink, Smartphone, AlertCircle } from 'lucide-react'
import OpenInBrowserModal from './OpenInBrowserModal'

const LINEWebViewDetector = () => {
  const [isLINEWebView, setIsLINEWebView] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [deviceType, setDeviceType] = useState('unknown')
  const [isClient, setIsClient] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // デバッグモード（URL パラメータで ?debug=line があれば強制表示）
    const urlParams = new URLSearchParams(window.location.search)
    const isDebug = urlParams.get('debug') === 'line'
    setDebugMode(isDebug)
    
    const detectLINEWebView = () => {
      const userAgent = navigator.userAgent
      const userAgentLower = userAgent.toLowerCase()
      const isIOS = /iphone|ipad|ipod/i.test(userAgent)
      const isAndroid = /android/i.test(userAgent)
      
      // LINEアプリ内WebViewの詳細な判定パターン
      const linePatterns = [
        // 一般的なLINEパターン
        /line/i,
        /linewebview/i,
        /lineinapp/i,
        // iOS LINE固有パターン
        /line.*webkit/i,
        /line.*mobile/i,
        // Android LINE固有パターン
        /line.*version/i,
        /line.*chrome/i,
        // その他のLINE関連パターン
        /line.*safari/i,
        // LINEの特殊なUserAgent文字列
        /jp\.naver\.line/i
      ]

      const isLINE = linePatterns.some(pattern => pattern.test(userAgent)) ||
                    // 追加のLINE検知ロジック
                    (userAgentLower.includes('line') || 
                     userAgentLower.includes('naver') ||
                     // window.LineInterfaceオブジェクトの存在確認
                     (typeof window !== 'undefined' && (
                       window.LineInterface || 
                       window.liff ||
                       window.webkit?.messageHandlers?.line
                     )))

      // デバッグ用のより詳細なログ
      console.log('LINE WebView detection:', {
        userAgent,
        userAgentLower,
        isLINE,
        isIOS,
        isAndroid,
        hasLineInterface: typeof window !== 'undefined' && !!window.LineInterface,
        hasLIFF: typeof window !== 'undefined' && !!window.liff,
        hasWebkitLine: typeof window !== 'undefined' && !!window.webkit?.messageHandlers?.line,
        patternMatches: linePatterns.map(pattern => ({ 
          pattern: pattern.toString(), 
          matches: pattern.test(userAgent) 
        }))
      })

      if (isLINE || isDebug) {
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

  // LINEアプリ内WebViewでない場合は表示しない（デバッグモード除く）
  if (!isLINEWebView && !debugMode) {
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
                  {debugMode ? '🐛 デバッグモード: LINE WebView テスト' : 'LINEアプリ内では一部機能が制限されます'}
                </p>
                <p className="text-xs opacity-90 hidden sm:block">
                  {debugMode ? 'デバッグ用に表示中 (?debug=line)' : 'すべての機能をご利用いただくには外部ブラウザでご覧ください'}
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