import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.BASE_URL || 'http://127.0.0.1:4173/';
const out = 'qa-output';
await mkdir(out, { recursive: true });
const report = { base, desktop: {}, mobile: {}, consoleErrors: [], pageErrors: [] };

async function openPage(context, name) {
  const page = await context.newPage();
  page.on('console', msg => { if (msg.type() === 'error') report.consoleErrors.push(`${name}: ${msg.text()}`); });
  page.on('pageerror', err => report.pageErrors.push(`${name}: ${err.message}`));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 60000 });
  await page.waitForSelector('#viewer canvas');
  return page;
}

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-webgl'] });

const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const page = await openPage(desktopContext, 'desktop');
const exercises = page.locator('.exercise');
report.desktop.exerciseCount = await exercises.count();
if (report.desktop.exerciseCount !== 8) throw new Error(`Expected 8 exercises, got ${report.desktop.exerciseCount}`);

const slugs = ['clap','shift','supine','airplane','dive','row','rotate','reach'];
for (let i = 0; i < 8; i++) {
  await exercises.nth(i).click();
  await page.locator('#timeline').evaluate((el) => { el.value = '500'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(250);
  const title = await page.locator('#title').textContent();
  if (!title?.trim()) throw new Error(`Missing title for exercise ${i + 1}`);
  await page.locator('#viewer').screenshot({ path: `${out}/desktop-${i + 1}-${slugs[i]}.png` });
}

await exercises.nth(4).click();
for (const [label, value] of [['back',40],['lower',250],['forward',520],['up',750],['return',930]]) {
  await page.locator('#timeline').evaluate((el, v) => { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
  await page.waitForTimeout(220);
  await page.locator('#viewer').screenshot({ path: `${out}/dive-${label}.png` });
}

const canvasBox = await page.locator('#viewer canvas').boundingBox();
if (!canvasBox || canvasBox.width < 400 || canvasBox.height < 350) throw new Error('3D canvas is too small');
report.desktop.canvas = canvasBox;

await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 60000 });
await page.waitForTimeout(1500);
await desktopContext.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#viewer canvas', { timeout: 20000 });
await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 30000 });
report.desktop.offlineReload = true;
await desktopContext.setOffline(false);
await desktopContext.close();

const mobileContext = await browser.newContext({ ...devices['Pixel 7'], serviceWorkers: 'allow' });
const mobile = await openPage(mobileContext, 'mobile');
await mobile.locator('.exercise').nth(4).click();
await mobile.locator('#timeline').evaluate((el) => { el.value = '520'; el.dispatchEvent(new Event('input', { bubbles: true })); });
await mobile.waitForTimeout(300);
await mobile.screenshot({ path: `${out}/mobile-dive-full.png`, fullPage: true });
const mobileCanvas = await mobile.locator('#viewer canvas').boundingBox();
if (!mobileCanvas || mobileCanvas.width < 300 || mobileCanvas.height < 350) throw new Error('Mobile canvas is too small');
report.mobile.canvas = mobileCanvas;
report.mobile.exerciseCount = await mobile.locator('.exercise').count();
await mobileContext.close();

await browser.close();
if (report.consoleErrors.length || report.pageErrors.length) {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  throw new Error(`Browser errors: ${[...report.consoleErrors, ...report.pageErrors].join(' | ')}`);
}
report.status = 'PASS';
await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
