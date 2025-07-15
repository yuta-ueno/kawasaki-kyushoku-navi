// pages/api/sitemap.xml.js
export default function handler(req, res) {
  // XMLヘッダーを設定
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  // 現在の日付を取得
  const lastmod = new Date().toISOString();

  // 基本ページのURL
  const staticPages = [
    {
      url: 'https://kawasaki-kyushoku.jp/',
      lastmod: lastmod,
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      url: 'https://kawasaki-kyushoku.jp/menu',
      lastmod: lastmod,
      changefreq: 'daily',
      priority: '0.9'
    },
    {
      url: 'https://kawasaki-kyushoku.jp/calendar',
      lastmod: lastmod,
      changefreq: 'daily',
      priority: '0.8'
    },
    {
      url: 'https://kawasaki-kyushoku.jp/schools',
      lastmod: lastmod,
      changefreq: 'monthly',
      priority: '0.6'
    },
    {
      url: 'https://kawasaki-kyushoku.jp/about',
      lastmod: lastmod,
      changefreq: 'monthly',
      priority: '0.5'
    }
  ];

  // 動的な献立ページURL生成（Phase 2以降で実装）
  const generateMenuUrls = () => {
    const menuUrls = [];
    const today = new Date();
    
    // 過去30日と未来30日の献立ページを生成
    for (let i = -30; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // 平日のみ（土日は給食なし）
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        const dateString = date.toISOString().split('T')[0];
        menuUrls.push({
          url: `https://kawasaki-kyushoku.jp/menu/${dateString}`,
          lastmod: lastmod,
          changefreq: 'weekly',
          priority: '0.7'
        });
      }
    }
    
    return menuUrls;
  };

  // 学校別ページURL生成（Phase 2以降で実装）
  const generateSchoolUrls = () => {
    const schools = [
      'kawasaki-elementary',
      'saiwai-elementary', 
      'nakahara-elementary',
      'takatsu-elementary',
      'miyamae-elementary',
      'tama-elementary',
      'asao-elementary'
    ];

    return schools.map(school => ({
      url: `https://kawasaki-kyushoku.jp/schools/${school}`,
      lastmod: lastmod,
      changefreq: 'monthly',
      priority: '0.6'
    }));
  };

  // 全URLを結合
  const allUrls = [
    ...staticPages,
    ...generateMenuUrls(),
    ...generateSchoolUrls()
  ];

  // XMLサイトマップ生成
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // XMLレスポンスを送信
  res.write(sitemap);
  res.end();
}

// 設定情報（オプション）
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
