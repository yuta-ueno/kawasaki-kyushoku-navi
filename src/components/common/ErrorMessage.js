import React from 'react';
import { AlertCircle, RefreshCw, Wifi, Database } from 'lucide-react';

const ErrorMessage = ({ 
  title = 'エラーが発生しました', 
  message = '', 
  onRetry = null,
  type = 'general' 
}) => {
  // エラータイプに応じたアイコンと色
  const getErrorStyle = () => {
    switch (type) {
      case 'network':
        return {
          icon: Wifi,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800',
          textColor: 'text-yellow-700'
        };
      case 'database':
        return {
          icon: Database,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          textColor: 'text-blue-700'
        };
      default:
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          textColor: 'text-red-700'
        };
    }
  };

  const style = getErrorStyle();
  const Icon = style.icon;

  // エラーメッセージの詳細化
  const getDetailedMessage = () => {
    if (message) return message;
    
    switch (type) {
      case 'network':
        return 'インターネット接続を確認してください。';
      case 'database':
        return 'データベースへの接続に問題があります。しばらく時間をおいてから再度お試しください。';
      default:
        return '予期しないエラーが発生しました。';
    }
  };

  return (
    <div className={`
      ${style.bgColor} ${style.borderColor} 
      border rounded-2xl p-8 text-center max-w-2xl mx-auto
    `}>
      {/* エラーアイコン */}
      <div className={`${style.iconColor} mb-4`}>
        <Icon className="w-12 h-12 mx-auto" />
      </div>

      {/* タイトル */}
      <h3 className={`text-lg font-semibold ${style.titleColor} mb-2`}>
        {title}
      </h3>

      {/* メッセージ */}
      <p className={`${style.textColor} mb-6`}>
        {getDetailedMessage()}
      </p>

      {/* アクションボタン */}
      {onRetry && (
        <button
          onClick={onRetry}
          className={`
            inline-flex items-center px-4 py-2 rounded-lg font-medium
            ${style.iconColor} ${style.bgColor} hover:opacity-80
            border ${style.borderColor} transition-opacity
          `}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          再試行
        </button>
      )}

      {/* 詳細情報 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">
            技術的な詳細を表示
          </summary>
          <div className="mt-2 text-left bg-gray-100 p-3 rounded font-mono">
            <div>エラータイプ: {type}</div>
            <div>タイムスタンプ: {new Date().toLocaleString('ja-JP')}</div>
            {message && <div>詳細: {message}</div>}
          </div>
        </details>
      </div>
    </div>
  );
};

// 特定用途のエラーコンポーネント
export const NetworkError = ({ onRetry }) => (
  <ErrorMessage
    title="接続エラー"
    type="network"
    onRetry={onRetry}
  />
);

export const DatabaseError = ({ onRetry }) => (
  <ErrorMessage
    title="データ取得エラー"
    message="Firestoreからのデータ取得に失敗しました。"
    type="database"
    onRetry={onRetry}
  />
);

export const NotFoundError = () => (
  <ErrorMessage
    title="データが見つかりません"
    message="指定された献立データは存在しないか、まだ登録されていません。"
    type="general"
  />
);

export default ErrorMessage;
