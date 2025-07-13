import { useState } from 'react';
import { importKawasakiMenuData } from '../../services/firebase/import';
import menuData from '../../data/kk2507a.json';

export default function ImportPage() {
  const [status, setStatus] = useState('ready');
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    setStatus('importing');
    try {
      const importResult = await importKawasakiMenuData(menuData);
      setResult(importResult);
      setStatus(importResult.success ? 'success' : 'error');
    } catch (error) {
      setResult({ success: false, error: error.message });
      setStatus('error');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">給食データインポート</h1>
      
      <div className="mb-4">
        <p>対象データ: {menuData.metadata.year}年{menuData.metadata.month}月 {menuData.metadata.district}地区</p>
        <p>メニュー数: {menuData.menus.length}件</p>
      </div>

      <button 
        onClick={handleImport}
        disabled={status === 'importing'}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'importing' ? 'インポート中...' : 'データをインポート'}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
          {result.success ? (
            <div>
              <p className="text-green-800">✅ インポート成功!</p>
              <p className="text-green-700">{result.count}件のメニューデータを保存しました</p>
            </div>
          ) : (
            <p className="text-red-800">❌ エラー: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
