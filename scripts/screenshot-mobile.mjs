import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const OUT = '/home/indra/duitrack/screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/home/indra/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
  args: ['--no-sandbox'],
});

const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const p = await ctx.newPage();

await p.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
await p.fill('#email', 'indra@example.com');
await p.fill('#password', 'rahasia12345');
await p.click('button[type=submit]');
await p.waitForURL('**/dashboard', { timeout: 20000 }).catch(() => {});
await p.waitForTimeout(2500);

const shots = [
  ['/dashboard', 'mobile-dashboard'],
  ['/transactions', 'mobile-transactions'],
  ['/reports', 'mobile-reports'],
  ['/budgets', 'mobile-budgets'],
  ['/categories', 'mobile-categories'],
];

for (const [path, name] of shots) {
  await p.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log('ok:', name);
}

// dialog quick-add
await p.goto('http://localhost:3000/transactions?new=1', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.screenshot({ path: `${OUT}/mobile-quick-add.png` });
console.log('ok: mobile-quick-add');

// dark mode dashboard
await p.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
await p.evaluate(() => {
  document.documentElement.classList.add('dark');
  localStorage.setItem('theme', 'dark');
});
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/mobile-dashboard-dark.png`, fullPage: true });
console.log('ok: mobile-dashboard-dark');

await browser.close();
