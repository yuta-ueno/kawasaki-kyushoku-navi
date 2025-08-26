import { useMemo } from 'react'

export default function useInAppBrowserDetect() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  
  return useMemo(() => {
    // LINEアプリ内ブラウザの検知（精度の高いパターン）
    const isLine = /Line\//.test(ua)
    
    // プラットフォーム検知
    const isAndroid = /Android/i.test(ua)
    const isiOS = /iPhone|iPad|iPod/i.test(ua)
    
    // その他のアプリ内ブラウザ検知（将来の拡張用）
    const isTwitter = /Twitter/i.test(ua)
    const isInstagram = /Instagram/i.test(ua)
    const isFacebook = /FBAN|FBAV/i.test(ua)
    
    // アプリ内ブラウザ総合判定
    const isInApp = isLine || isTwitter || isInstagram || isFacebook
    
    // Safari判定（iOS純正Safariのみ）
    const isSafari = isiOS && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)
    
    // Chrome判定
    const isChrome = /Chrome/i.test(ua) && !/Edge/i.test(ua)
    
    // デバッグモード（URLパラメータで ?debug=line があれば強制的にLINEとして扱う）
    const debugMode = typeof window !== 'undefined' ? 
      new URLSearchParams(window.location.search).get('debug') === 'line' : false
    
    // 追加のLINE検知ロジック（JavaScript API）
    const hasLineInterface = typeof window !== 'undefined' && (
      window.LineInterface || 
      window.liff ||
      window.webkit?.messageHandlers?.line
    )
    
    // 最終的なLINE検知結果
    const finalIsLine = isLine || hasLineInterface || debugMode
    const finalIsInApp = finalIsLine || isTwitter || isInstagram || isFacebook || debugMode
    
    // デバッグ情報（開発時のみ）
    if (typeof window !== 'undefined' && (finalIsLine || debugMode)) {
      console.log('InApp Browser Detection:', {
        ua,
        isLine,
        hasLineInterface,
        debugMode,
        finalIsLine,
        finalIsInApp,
        isAndroid,
        isiOS,
        isSafari,
        isChrome,
        patterns: {
          'Line\/': /Line\//.test(ua),
          'LineInterface': !!window.LineInterface,
          'LIFF': !!window.liff,
          'webkit.line': !!window.webkit?.messageHandlers?.line
        }
      })
    }
    
    return {
      isInApp: finalIsInApp,
      isLine: finalIsLine,
      isTwitter,
      isInstagram,
      isFacebook,
      isAndroid,
      isiOS,
      isSafari,
      isChrome,
      debugMode,
      ua,
      // デバイスタイプの判定
      deviceType: isiOS ? 'ios' : isAndroid ? 'android' : 'unknown'
    }
  }, [ua])
}