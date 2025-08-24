// src/pages/admin/import.js を更新
import { useState } from 'react';
import { importKawasakiMenuData } from '../../services/firebase/import';

// データファイルをインポート
import menuDataA from '../../data/kk2509a.json';
import menuDataB from '../../data/kk2509b.json';
import menuDataC from '../../data/kk2509c.json';

export default function ImportPage() {
  const [status, setStatus] = useState('ready');
  const [results, setResults] = useState([]);

  const datasets = [
    { name: 'A地区', data: menuDataA },
    { name: 'B地区', data: menuDataB },
    { name: 'C地区', data: menuDataC }
  ];

  const handleImportAll = async () => {
    setStatus('importing');
    const importResults = [];

    for (const dataset of datasets) {
      try {
        console.log(`${dataset.name}のインポート開始...`);
        const result = await importKawasakiMenuData(dataset.data);
        importResults.push({
          district: dataset.name,
          success: result.success,
          count: result.count,
          details: result.details
        });
        console.log(`${dataset.name}完了: ${result.count}件`);
      } catch (error) {
        console.error(`${dataset.name}インポートエラー:`, error);
        importResults.push({
          district: dataset.name,
          success: false,
          error: error.message,
          errorDetails: error.errorDetails || null
        });
      }
    }

    setResults(importResults);
    setStatus('completed');
  };

  const handleImportSingle = async (dataset) => {
    setStatus('importing');
    try {
      const result = await importKawasakiMenuData(dataset.data);
      console.log(`${dataset.name}インポート完了:`, result);
      // 結果表示処理
    } catch (error) {
      console.error(`${dataset.name}インポートエラー:`, error);
    }
    setStatus('ready');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">複数地区データインポート</h1>
      
      {/* 全地区一括インポート */}
      <div className="mb-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">全地区一括インポート</h2>
        <button 
          onClick={handleImportAll}
          disabled={status === 'importing'}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'importing' ? '全地区インポート中...' : 'A・B・C地区を一括インポート'}
        </button>
      </div>

      {/* 個別インポート */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {datasets.map((dataset) => (
          <div key={dataset.name} className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">{dataset.name}</h3>
            <p className="text-sm text-gray-600 mb-3">
              {dataset.data.metadata.totalDays}日分の献立
            </p>
            <button
              onClick={() => handleImportSingle(dataset)}
              disabled={status === 'importing'}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {dataset.name}をインポート
            </button>
          </div>
        ))}
      </div>

      {/* 結果表示 */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">インポート結果</h2>
          {results.map((result, index) => (
            <div key={index} className={`p-4 rounded-lg ${
              result.success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <div className="font-medium">
                {result.district}: {result.success ? '✅ 成功' : '❌ 失敗'}
              </div>
              {result.success && (
                <div className="text-sm text-green-700">
                  {result.count}件の献立データをインポートしました
                </div>
              )}
              {result.error && (
                <div className="text-sm text-red-700">
                  エラー: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
