// 사용법: node render.js  → out/ 폴더에 섹션별 PNG + 전체 미리보기 생성
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 860, height: 1200 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(__dirname, 'page.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);
  const ids = await p.$$eval('section', s => s.map(e => e.id));
  for (const [i, id] of ids.entries()) {
    await p.locator('#' + id).screenshot({ path: `out/${String(i + 1).padStart(2, '0')}.png` });
  }
  await p.screenshot({ path: 'out/full_preview.jpg', fullPage: true, type: 'jpeg', quality: 80 });
  console.log('done', ids.length);
  await b.close();
})();
