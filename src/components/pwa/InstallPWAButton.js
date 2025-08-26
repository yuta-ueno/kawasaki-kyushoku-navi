import React, { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import InstallInstructionsModal from './InstallInstructionsModal'

const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deviceType, setDeviceType] = useState('unknown')
  const [isInstallable, setIsInstallable] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isIOS = /iphone|ipad|ipod/.test(userAgent)
      const isAndroid = /android/.test(userAgent)
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
      const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent)
      
      // LINEアプリ内WebViewかチェック
      const isLINEWebView = userAgent.includes('line') || 
                           userAgent.includes('linewebview') ||
                           userAgent.includes('lineinapp') ||
                           (userAgent.includes('line') && userAgent.includes('webkit'))

      console.log('Device detection:', { userAgent, isIOS, isAndroid, isSafari, isChrome, isLINEWebView })

      // LINE WebView内ではPWAインストールボタンを表示しない
      if (isLINEWebView) {
        setIsInstallable(false)
        return
      }

      if (isIOS) {
        setDeviceType(isSafari ? 'ios-safari' : 'ios-other')
        setIsInstallable(true)
      } else if (isAndroid) {
        setDeviceType(isChrome ? 'android-chrome' : 'android-other')
        setIsInstallable(true)
      }
    }

    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired', e)
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // PWAの条件をチェック
    const checkPWAInstallable = () => {
      // Service Workerが登録されているかチェック
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          console.log('Service Worker registrations:', registrations.length)
        })
      }
    }

    detectDevice()
    checkPWAInstallable()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    console.log('Install button clicked, deferredPrompt:', !!deferredPrompt)
    
    if (deferredPrompt) {
      try {
        // Android Chrome - 直接インストールダイアログを表示
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log(`PWA install prompt outcome: ${outcome}`)
        setDeferredPrompt(null)
      } catch (error) {
        console.error('Error showing install prompt:', error)
        setShowModal(true)
      }
    } else {
      // iOS Safari または その他のブラウザ - 操作説明モーダルを表示
      setShowModal(true)
    }
  }

  // クライアントサイドでない場合は表示しない
  if (!isClient || typeof window === 'undefined') {
    return null
  }

  // モバイルデバイスでない場合やインストール不可の場合は表示しない
  if (!isInstallable || window.innerWidth >= 768) {
    return null
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-solarized-green text-solarized-base3 rounded-lg text-xs sm:text-sm font-medium hover:bg-solarized-cyan transition-colors shadow-sm whitespace-nowrap"
        aria-label="ホーム画面に追加"
      >
        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-2" />
        <span className="text-xs sm:text-sm">ホームに追加</span>
      </button>

      <InstallInstructionsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        deviceType={deviceType}
      />
    </>
  )
}

export default InstallPWAButton