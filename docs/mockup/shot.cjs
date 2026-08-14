const { chromium } = require('playwright');
const path = require('path');

const file = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const shots = ['login', 'mapa', 'tabela'];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1720, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto(file, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);

  for (const theme of ['light', 'dark']) {
    await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
    await page.waitForTimeout(250);
    for (let i = 0; i < shots.length; i++) {
      await page.locator('.frame').nth(i)
        .screenshot({ path: path.join(__dirname, `shot-${shots[i]}-${theme}.png`) });
    }
  }
  await browser.close();
  console.log('screenshots ok');
})();
