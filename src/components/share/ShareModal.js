import React, { useState } from 'react'
import { X, Share, Copy, Smartphone, Check } from 'lucide-react'

const ShareModal = ({ isOpen, onClose }) => {
  const [copiedType, setCopiedType] = useState(null)

  if (!isOpen) return null

  const copyToClipboard = async (url, type) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2000) // 2秒後にリセット
    } catch (error) {
      console.error('Failed to copy URL:', error)
      // フォールバック: テキストエリアを使用
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2000)
    }
  }

  const lineUrl = 'https://link.kawasaki-kyushoku.jp'

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* モーダル本体 */}
      <div className="fixed inset-4 md:inset-8 lg:left-1/4 lg:right-1/4 lg:top-32 lg:bottom-32 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-solarized-blue to-solarized-cyan text-white p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Share className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">共有</h2>
              <p className="text-sm opacity-90">URLをクリップボードにコピー</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* LINE用URL */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Smartphone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-800 text-lg">共有URL</h3>
                    <p className="text-green-600 text-sm">URLをクリップボードにコピー</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                <p className="text-sm text-gray-600 mb-2">URL:</p>
                <p className="font-mono text-green-700 break-all text-sm bg-green-50 p-2 rounded">
                  {lineUrl}
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(lineUrl, 'line')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                {copiedType === 'line' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>コピーしました！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>URLをコピー</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-solarized-blue text-white rounded-lg font-medium hover:bg-solarized-cyan transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ShareModal