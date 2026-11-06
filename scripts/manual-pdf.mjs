#!/usr/bin/env node
/**
 * Renders the system manual (docs/manual/index.html) to docs/manual/manual-ar.pdf with a real Chrome.
 *   npm run manual:pdf          (needs Chrome; set CHROME_PATH if it is not in a standard place)
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const chrome = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean).find((p) => existsSync(p));
if (!chrome) {
  console.error('No Chrome found. Set CHROME_PATH.');
  process.exit(2);
}
const src = resolve('docs/manual/index.html');
const out = resolve('docs/manual/manual-ar.pdf');
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-first-run', ...(process.env.CI ? ['--no-sandbox'] : [])] });
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(src).href, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  await page.emulateMediaType('print');
  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: '<div style="width:100%;font-size:8px;color:#5b5f58;text-align:center;font-family:sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span></div>', margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' } });
  console.log(`wrote ${out}`);
} finally {
  await browser.close();
}
