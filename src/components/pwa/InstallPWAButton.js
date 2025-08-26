import React, { useState, useEffect } from 'react'
import { Smartphone, Download } from 'lucide-react'
import InstallInstructionsModal from './InstallInstructionsModal'

const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deviceType, setDeviceType] = useState('unknown')
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isIOS = /iphone|ipad|ipod/.test(userAgent)
      const isAndroid = /android/.test(userAgent)
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
      const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent)

      if (isIOS) {
        setDeviceType(isSafari ? 'ios-safari' : 'ios-other')
        setIsInstallable(true)
      } else if (isAndroid) {
        setDeviceType(isChrome ? 'android-chrome' : 'android-other')
        setIsInstallable(true)
      }
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    detectDevice()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android Chrome - 直接インストールダイアログを表示
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`PWA install prompt outcome: ${outcome}`)
      setDeferredPrompt(null)
    } else {
      // iOS Safari または その他のブラウザ - 操作説明モーダルを表示
      setShowModal(true)
    }
  }

  // モバイルデバイスでない場合は表示しない
  if (!isInstallable || typeof window === 'undefined') {
    return null
  }

  // デスクトップでは表示しない
  if (window.innerWidth >= 768) {
    return null
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-solarized-green text-solarized-base3 rounded-lg text-xs sm:text-sm font-medium hover:bg-solarized-cyan transition-colors shadow-sm"
        aria-label="ホーム画面に追加"
      >
        <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden xs:inline">ホーム画面に追加</span>
        <span className="xs:hidden">📱</span>
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