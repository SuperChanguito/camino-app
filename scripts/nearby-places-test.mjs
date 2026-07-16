import { chromium, devices } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext({ ...devices['iPhone 13'] })
const page = await context.newPage()
const errors = []
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', (err) => errors.push(err.message))

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForSelector('text=Which day is it?')
await page.click('text=Tui → O Porriño')
await page.waitForSelector('text=Walked')

await page.getByRole('button', { name: 'More' }).click()
await page.waitForSelector('text=More places nearby')
await page.waitForTimeout(500)
await page.screenshot({ path: 'scripts/screenshots/nearby-stage1.png', fullPage: true })

const cardCount = await page.locator('div:has-text("Near ")').filter({ hasText: /^Near / }).count()
console.log('Places shown for Tui → O Porriño (expect 2):', cardCount)

const photoImgCount = await page.locator('img[alt="Bar O Novo"], img[alt="Mesón Las Bodegas"]').count()
console.log('Real photo <img> tags for stage 1 (expect 0, both are icon-fallback):', photoImgCount)

// Check a stage with real photos
await page.getByRole('button', { name: 'Day' }).click()
await page.waitForSelector('text=Which day is it?')
await page.click('text=Redondela → Pontevedra')
await page.waitForSelector('text=Walked')
await page.getByRole('button', { name: 'More' }).click()
await page.waitForSelector('text=More places nearby')
await page.waitForTimeout(500)
await page.screenshot({ path: 'scripts/screenshots/nearby-stage3.png', fullPage: true })

const recreoPhoto = await page.locator('img[alt="Marisquería O Recreo"]').count()
console.log('O Recreo photo rendered:', recreoPhoto)

// Verify no map/GPS pin exists for these -- confirm the map screen doesn't show them as markers
await page.getByRole('button', { name: 'Map' }).click()
await page.waitForSelector('text=Walked')
await page.waitForTimeout(3000)
const recreoOnMap = await page.locator('.maplibregl-popup:has-text("Marisquería")').count()
console.log('O Recreo NOT pinned on map (expect 0 popups, markers only show on click so this just confirms no crash):', recreoOnMap)

console.log('\nConsole errors:', errors.length ? errors : 'none')
await browser.close()
if (errors.length) process.exit(1)
