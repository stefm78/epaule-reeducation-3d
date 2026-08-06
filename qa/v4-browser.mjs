import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.BASE_URL || 'http://127.0.0.1:4173/';
const out = 'qa-output';
await mkdir(out, { recursive: true });
const report = { base, desktop: {}, mobile: {}, continuity: {}, camera: {}, support: {}, consoleErrors: [], pageErrors: [] };

async function openPage(context, name) {
  const page = await context.newPage();
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(`${name}: ${message.text()}`); });
  page.on('pageerror', error => report.pageErrors.push(`${name}: ${error.message}`));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 60000 });
  await page.waitForSelector('#viewer canvas');
  return page;
}

async function setTimeline(page, value) {
  await page.locator('#timeline').evaluate((element, next) => {
    element.value = String(next);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await page.waitForTimeout(90);
}

async function diagnostics(page) { return page.evaluate(() => window.__APP_DIAGNOSTICS__()); }
function distance(a, b) { return Math.hypot(...a.map((value, index) => value - b[index])); }
function maximumAbsolute(...values) { return Math.max(...values.map(value => Math.abs(value))); }

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-webgl'] });
const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, serviceWorkers: 'allow' });
const page = await openPage(desktopContext, 'desktop');
const exercises = page.locator('.exercise');
report.desktop.exerciseCount = await exercises.count();
if (report.desktop.exerciseCount !== 8) throw new Error(`Expected 8 exercises, got ${report.desktop.exerciseCount}`);

const slugs = ['supine', 'reach', 'airplane', 'row', 'rotate', 'shift', 'clap', 'dive'];
for (let index = 0; index < slugs.length; index += 1) {
  await exercises.nth(index).click();
  await setTimeline(page, 500);
  const title = await page.locator('#title').textContent();
  if (!title?.trim()) throw new Error(`Missing title for exercise ${index + 1}`);
  await page.locator('#viewer').screenshot({ path: `${out}/desktop-${index + 1}-${slugs[index]}.png` });
}

await exercises.nth(5).click();
if (!await page.locator('#supportControl').isVisible()) throw new Error('Push support selector is not visible');
await setTimeline(page, 300);
const kneeDiagnostics = await diagnostics(page);
await page.locator('#viewer').screenshot({ path: `${out}/support-knees.png` });
await page.locator('[data-support="toes"]').click();
await setTimeline(page, 300);
const toeDiagnostics = await diagnostics(page);
await page.locator('#viewer').screenshot({ path: `${out}/support-toes.png` });
const kneeGroundError = maximumAbsolute(
  kneeDiagnostics.joints.calf_l[1] - 0.025,
  kneeDiagnostics.joints.calf_r[1] - 0.025,
  kneeDiagnostics.joints.middle_01_l[1] - 0.018,
  kneeDiagnostics.joints.middle_01_r[1] - 0.018
);
const toeGroundError = maximumAbsolute(
  toeDiagnostics.joints.ball_l[1] - 0.025,
  toeDiagnostics.joints.ball_r[1] - 0.025,
  toeDiagnostics.joints.middle_01_l[1] - 0.018,
  toeDiagnostics.joints.middle_01_r[1] - 0.018
);
report.support = {
  mode: toeDiagnostics.supportMode,
  kneeGroundError,
  toeGroundError,
  kneeMeshMinY: kneeDiagnostics.meshMinY,
  toeMeshMinY: toeDiagnostics.meshMinY,
  knees: { left: kneeDiagnostics.joints.calf_l, right: kneeDiagnostics.joints.calf_r },
  toes: { left: toeDiagnostics.joints.ball_l, right: toeDiagnostics.joints.ball_r },
  kneeFingers: { left: kneeDiagnostics.joints.middle_01_l, right: kneeDiagnostics.joints.middle_01_r },
  toeFingers: { left: toeDiagnostics.joints.middle_01_l, right: toeDiagnostics.joints.middle_01_r }
};
if (toeDiagnostics.supportMode !== 'toes') throw new Error('Toe support mode was not applied');
if (toeDiagnostics.joints.calf_l[1] <= kneeDiagnostics.joints.calf_l[1] + 0.08) throw new Error('Toe support does not extend the knees away from the floor');
if (kneeGroundError > 0.07) throw new Error(`Knee support is not grounded: ${kneeGroundError}`);
if (toeGroundError > 0.07) throw new Error(`Toe support is not grounded: ${toeGroundError}`);
if (Math.abs(kneeDiagnostics.meshMinY) > 0.07) throw new Error(`Knee-support mesh is not on the floor: ${kneeDiagnostics.meshMinY}`);
if (Math.abs(toeDiagnostics.meshMinY) > 0.07) throw new Error(`Toe-support mesh is not on the floor: ${toeDiagnostics.meshMinY}`);
await page.locator('[data-support="knees"]').click();

await exercises.nth(7).click();
const samples = [];
for (let value = 0; value <= 1000; value += 20) {
  await setTimeline(page, value);
  const sample = await diagnostics(page);
  samples.push({ value, shoulder: sample.joints.upperarm_l, wrist: sample.joints.hand_l, knee: sample.joints.calf_l });
}
let maximumStep = 0;
for (let index = 1; index < samples.length; index += 1) {
  maximumStep = Math.max(maximumStep,
    distance(samples[index - 1].shoulder, samples[index].shoulder),
    distance(samples[index - 1].wrist, samples[index].wrist),
    distance(samples[index - 1].knee, samples[index].knee));
}
const wrapDistance = Math.max(
  distance(samples[0].shoulder, samples.at(-1).shoulder),
  distance(samples[0].wrist, samples.at(-1).wrist),
  distance(samples[0].knee, samples.at(-1).knee));
report.continuity = { maximumStep, wrapDistance };
if (maximumStep > 0.28) throw new Error(`Dive animation discontinuity detected: ${maximumStep}`);
if (wrapDistance > 0.045) throw new Error(`Dive loop discontinuity detected: ${wrapDistance}`);

for (const [label, value] of [['back', 60], ['lower', 280], ['forward', 520], ['up', 760], ['return', 940]]) {
  await setTimeline(page, value);
  await page.locator('#viewer').screenshot({ path: `${out}/dive-${label}.png` });
}

await page.waitForTimeout(500);
const cameraDiagnostics = await diagnostics(page);
report.camera = cameraDiagnostics.camera;
if (cameraDiagnostics.camera.panEnabled !== false) throw new Error('Camera panning must be disabled');
if (cameraDiagnostics.camera.distanceToCenter > 0.35) throw new Error(`Camera target is not centered on the model: ${cameraDiagnostics.camera.distanceToCenter}`);
if (cameraDiagnostics.camera.distance < 2.7 || cameraDiagnostics.camera.distance > 6.3) throw new Error(`Camera distance is outside constraints: ${cameraDiagnostics.camera.distance}`);
if (await page.locator('#level.advanced').count() !== 1) throw new Error('Advanced exercise is not clearly labelled');
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
await mobile.locator('.exercise').nth(7).click();
await setTimeline(mobile, 520);
await mobile.screenshot({ path: `${out}/mobile-dive-full.png`, fullPage: true });
const mobileDiagnostics = await diagnostics(mobile);
if (mobileDiagnostics.camera.distanceToCenter > 0.42) throw new Error(`Mobile camera is not centered: ${mobileDiagnostics.camera.distanceToCenter}`);
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
