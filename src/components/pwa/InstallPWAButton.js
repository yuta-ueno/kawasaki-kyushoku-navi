import React, { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import InstallInstructionsModal from './InstallInstructionsModal'
import useInAppBrowserDetect from '../../hooks/useInAppBrowserDetect'

const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  const { isInApp, isLine, isiOS, isAndroid, isSafari, isChrome } = useInAppBrowserDetect()

  useEffect(() => {
    setIsClient(true)
    
    const detectDevice = () => {
      console.log('PWA Button - Device detection:', { 
        isInApp, 
        isLine, 
        isiOS, 
        isAndroid, 
        isSafari, 
        isChrome 
      })

      // アプリ内ブラウザ（LINE等）ではPWAインストールボタンを表示しない
      if (isInApp) {
        setIsInstallable(false)
        return
      }

      // PWA対応プラットフォームでのみ表示
      if (isiOS || isAndroid) {
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
  }, [isInApp, isiOS, isAndroid, isChrome, isSafari, isLine]) // 依存関係を追加

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
        deviceType={isiOS ? (isSafari ? 'ios-safari' : 'ios-other') : 
                   isAndroid ? (isChrome ? 'android-chrome' : 'android-other') : 'unknown'}
      />
    </>
  )
}

export default InstallPWAButton