const { chromium } = require('playwright');
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const p of ['pricing.html','philosophy.html','products.html','index.html']) {
    await page.goto('http://127.0.0.1:8000/' + p, { waitUntil: 'networkidle' });
    await page.screenshot({ path: '/tmp/' + p.replace('.html','.png'), fullPage: true });
  }
  await browser.close();
})();
