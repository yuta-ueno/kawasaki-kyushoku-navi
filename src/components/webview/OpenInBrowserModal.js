import React from 'react'
import { X, ExternalLink, Copy, Share, MoreHorizontal, Chrome, Globe } from 'lucide-react'

const OpenInBrowserModal = ({ isOpen, onClose, deviceType, currentUrl }) => {
  if (!isOpen) return null

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      alert('URLをコピーしました')
    } catch (error) {
      console.error('Failed to copy URL:', error)
      // フォールバック: テキストエリアを使用
      const textArea = document.createElement('textarea')
      textArea.value = currentUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('URLをコピーしました')
    }
  }

  const getInstructions = () => {
    if (deviceType === 'android') {
      return {
        title: 'Chromeで開く',
        browser: 'Android Chrome',
        icon: Chrome,
        steps: [
          {
            icon: Copy,
            text: 'URLをコピー',
            description: '下のボタンでURLをコピーします',
            action: copyToClipboard
          },
          {
            icon: Chrome,
            text: 'Chromeアプリを起動',
            description: 'ホーム画面からChromeアプリを開きます'
          },
          {
            icon: null,
            text: 'URLを貼り付けてアクセス',
            description: 'アドレスバーにURLを貼り付けて移動します'
          }
        ]
      }
    } else if (deviceType === 'ios') {
      return {
        title: 'Safariで開く',
        browser: 'iOS Safari',
        icon: Globe,
        steps: [
          {
            icon: Share,
            text: 'LINEの共有ボタン',
            description: '画面右上の共有ボタン（⋯）をタップします'
          },
          {
            icon: Globe,
            text: 'Safariで開く',
            description: '共有メニューから「Safariで開く」を選択します'
          },
          {
            icon: null,
            text: '完了',
            description: 'Safariでページが開きます'
          }
        ]
      }
    } else {
      return {
        title: '外部ブラウザで開く',
        browser: '標準ブラウザ',
        icon: ExternalLink,
        steps: [
          {
            icon: Copy,
            text: 'URLをコピー',
            description: '下のボタンでURLをコピーします',
            action: copyToClipboard
          },
          {
            icon: ExternalLink,
            text: 'ブラウザアプリを起動',
            description: 'Chrome、Safari等のブラウザアプリを開きます'
          },
          {
            icon: null,
            text: 'URLを貼り付けてアクセス',
            description: 'アドレスバーにURLを貼り付けて移動します'
          }
        ]
      }
    }
  }

  const instructions = getInstructions()
  const BrowserIcon = instructions.icon

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* モーダル本体 */}
      <div className="fixed inset-4 md:inset-8 lg:left-1/4 lg:right-1/4 lg:top-20 lg:bottom-20 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <BrowserIcon className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">{instructions.title}</h2>
              <p className="text-sm opacity-90">すべての機能をご利用いただけます</p>
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
            <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400">
              <div className="flex items-start space-x-2">
                <ExternalLink className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 font-medium text-sm mb-1">
                    なぜ外部ブラウザが必要？
                  </p>
                  <p className="text-yellow-700 text-sm">
                    LINEアプリ内では一部のWebAPI（PWA機能、通知等）が制限されているため、最適な体験には外部ブラウザをご利用ください。
                  </p>
                </div>
              </div>
            </div>

            {/* URL表示・コピーボタン */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">現在のページURL:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={currentUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 bg-solarized-blue text-white rounded text-sm hover:bg-blue-600 transition-colors flex items-center space-x-1"
                >
                  <Copy className="w-4 h-4" />
                  <span>コピー</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-800">操作手順</h3>
              {instructions.steps.map((step, index) => {
                const StepIcon = step.icon
                return (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-400 text-white rounded-full font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex items-center space-x-3 flex-1">
                      {StepIcon && (
                        <div className="p-2 bg-white rounded-lg">
                          <StepIcon className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-800">
                            {step.text}
                          </p>
                          {step.action && (
                            <button
                              onClick={step.action}
                              className="px-3 py-1 bg-solarized-green text-white rounded text-sm hover:bg-green-600 transition-colors"
                            >
                              実行
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-gradient-to-r from-solarized-blue to-solarized-green p-4 rounded-lg text-white">
              <h3 className="font-bold mb-2">📱 外部ブラウザのメリット</h3>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• PWAインストール（ホーム画面追加）</li>
                <li>• プッシュ通知機能</li>
                <li>• オフライン表示対応</li>
                <li>• 高速なページ読み込み</li>
              </ul>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-orange-400 text-white rounded-lg font-medium hover:bg-orange-500 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default OpenInBrowserModal