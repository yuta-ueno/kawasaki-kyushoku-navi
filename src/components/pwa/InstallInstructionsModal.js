import React from 'react'
import { X, Share, Plus, Menu, MoreVertical } from 'lucide-react'

const InstallInstructionsModal = ({ isOpen, onClose, deviceType }) => {
  if (!isOpen) return null

  const getInstructions = () => {
    switch (deviceType) {
      case 'ios-safari':
        return {
          title: 'iPhoneでホーム画面に追加',
          browser: 'Safari',
          steps: [
            {
              icon: Share,
              text: '画面下部の共有ボタン',
              description: 'をタップします',
            },
            {
              icon: Plus,
              text: 'ホーム画面に追加',
              description: 'を選択します',
            },
            {
              icon: null,
              text: '追加',
              description: 'をタップして完了です',
            },
          ],
        }
      case 'ios-other':
        return {
          title: 'iPhoneでホーム画面に追加',
          browser: 'Safari以外',
          steps: [
            {
              icon: null,
              text: 'Safariで開く',
              description: 'まずSafariブラウザでこのページを開いてください',
            },
            {
              icon: Share,
              text: '共有ボタンをタップ',
              description: '画面下部の共有ボタンをタップします',
            },
            {
              icon: Plus,
              text: 'ホーム画面に追加',
              description: 'を選択して追加をタップします',
            },
          ],
        }
      case 'android-chrome':
        return {
          title: 'Androidでホーム画面に追加',
          browser: 'Chrome',
          steps: [
            {
              icon: MoreVertical,
              text: 'メニューボタン',
              description: '画面右上の三点メニューをタップします',
            },
            {
              icon: Plus,
              text: 'ホーム画面に追加',
              description: 'を選択します',
            },
            {
              icon: null,
              text: '追加',
              description: 'をタップして完了です',
            },
          ],
        }
      case 'android-other':
        return {
          title: 'Androidでホーム画面に追加',
          browser: 'Chrome以外',
          steps: [
            {
              icon: null,
              text: 'Chromeで開く',
              description: 'まずChromeブラウザでこのページを開いてください',
            },
            {
              icon: MoreVertical,
              text: 'メニューボタンをタップ',
              description: '画面右上の三点メニューをタップします',
            },
            {
              icon: Plus,
              text: 'ホーム画面に追加',
              description: 'を選択して追加をタップします',
            },
          ],
        }
      default:
        return {
          title: 'ホーム画面に追加',
          browser: '',
          steps: [
            {
              icon: Menu,
              text: 'ブラウザのメニュー',
              description: 'を開いてください',
            },
            {
              icon: Plus,
              text: 'ホーム画面に追加',
              description: 'または類似の項目を選択してください',
            },
          ],
        }
    }
  }

  const instructions = getInstructions()

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
        <div className="bg-gradient-to-r from-solarized-green to-solarized-cyan text-solarized-base3 p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📱</div>
            <div>
              <h2 className="text-xl font-bold">{instructions.title}</h2>
              {instructions.browser && (
                <p className="text-sm opacity-90">{instructions.browser}での操作方法</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-solarized-base3 bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="bg-solarized-base2 rounded-lg p-4 border-l-4 border-solarized-green">
              <p className="text-solarized-base01 text-sm">
                ホーム画面に追加すると、アプリのようにアイコンから素早くアクセスできます。
              </p>
            </div>

            <div className="space-y-4">
              {instructions.steps.map((step, index) => {
                const IconComponent = step.icon
                return (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 bg-solarized-base3 rounded-lg border border-solarized-base1 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-solarized-green text-solarized-base3 rounded-full font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex items-center space-x-3 flex-1">
                      {IconComponent && (
                        <div className="p-2 bg-solarized-base2 rounded-lg">
                          <IconComponent className="w-5 h-5 text-solarized-base01" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-solarized-base02">
                          {step.text}
                        </p>
                        <p className="text-sm text-solarized-base01">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-gradient-to-r from-solarized-blue to-solarized-green p-4 rounded-lg text-solarized-base3">
              <h3 className="font-bold mb-2">📚 ホーム画面追加のメリット</h3>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• アプリのようにワンタップで起動</li>
                <li>• オフラインでも一部機能が利用可能</li>
                <li>• 通知機能で給食情報をお知らせ</li>
              </ul>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-solarized-green text-solarized-base3 rounded-lg font-medium hover:bg-solarized-cyan transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default InstallInstructionsModal