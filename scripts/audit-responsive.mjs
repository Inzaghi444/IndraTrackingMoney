/**
 * Audit responsive: ukur horizontal overflow & ukuran tap target
 * pada beberapa lebar layar HP nyata. Bukan tebak-tebakan.
 */
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const CANDIDATES = [
  '/home/indra/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
  '/home/indra/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell',
];
const executablePath = CANDIDATES.find(existsSync);
if (!executablePath) {
  console.error('Chromium tidak ditemukan di:', CANDIDATES);
  process.exit(1);
}

const BASE = 'http://localhost:3000';
const PAGES = ['/dashboard', '/transactions', '/reports', '/budgets', '/categories', '/settings'];
const VIEWPORTS = [
  { name: 'iPhone SE   ', width: 320, height: 568 },
  { name: 'Android 360 ', width: 360, height: 800 },
  { name: 'iPhone 12   ', width: 390, height: 844 },
  { name: 'iPhone Pro  ', width: 430, height: 932 },
];

const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });

// login dulu supaya dapat cookie
const loginCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const loginPage = await loginCtx.newPage();
await loginPage.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await loginPage.fill('#email', 'indra@example.com');
await loginPage.fill('#password', 'rahasia12345');
await loginPage.click('button[type=submit]');
await loginPage.waitForURL('**/dashboard', { timeout: 20000 }).catch(() => {});
const cookies = await loginCtx.cookies();
console.log('login:', loginPage.url().includes('dashboard') ? 'OK' : 'GAGAL');
await loginCtx.close();

let problems = 0;

for (const vp of VIEWPORTS) {
  console.log(`\n━━━ ${vp.name} ${vp.width}×${vp.height} ━━━`);

  for (const path of PAGES) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    await ctx.addCookies(cookies);
    const page = await ctx.newPage();

    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });

      const m = await page.evaluate(() => {
        const de = document.documentElement;
        // cari elemen yang lebih lebar dari viewport
        const offenders = [];
        for (const el of Array.from(document.querySelectorAll('*'))) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > de.clientWidth + 1) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className || '').toString().slice(0, 60),
              right: Math.round(r.right),
            });
          }
        }
        // tap target < 40px (Apple: 44, Material: 48)
        const small = [];
        for (const el of Array.from(document.querySelectorAll('button, a[href], [role=button]'))) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && (r.height < 40 || r.width < 40)) {
            small.push({
              tag: el.tagName.toLowerCase(),
              label: (el.textContent || '').trim().slice(0, 24),
              w: Math.round(r.width),
              h: Math.round(r.height),
            });
          }
        }
        return {
          scrollW: de.scrollWidth,
          clientW: de.clientWidth,
          offenders: offenders.slice(0, 3),
          smallCount: small.length,
          smallSamples: small.slice(0, 3),
        };
      });

      const overflow = m.scrollW - m.clientW;
      const ok = overflow <= 1;
      if (!ok) problems++;
      if (m.smallCount > 0) problems++;

      console.log(
        `  ${ok ? '✅' : '❌'} ${path.padEnd(14)} overflow=${overflow}px  tapTargetKecil=${m.smallCount}`,
      );
      if (!ok) {
        for (const o of m.offenders) {
          console.log(`       ↳ <${o.tag}> right=${o.right} .${o.cls}`);
        }
      }
      if (m.smallCount > 0) {
        for (const s of m.smallSamples) {
          console.log(`       ↳ <${s.tag}> "${s.label}" ${s.w}×${s.h}`);
        }
      }
    } catch (e) {
      console.log(`  ⚠️  ${path.padEnd(14)} error: ${e.message.slice(0, 60)}`);
      problems++;
    }
    await ctx.close();
  }
}

await browser.close();
console.log(`\n═══ total masalah: ${problems} ═══`);
