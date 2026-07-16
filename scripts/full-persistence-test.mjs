import { chromium, devices } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext({ ...devices['iPhone 13'] })
const page = await context.newPage()
const errors = []
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', (err) => errors.push(err.message))

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForSelector('text=Which day is it?')
await page.click('text=⚙︎')
await page.waitForSelector('text=Edit the trip')

// Reorder: move Day 2 up to Day 1
await page.locator('text=O Porriño → Redondela').locator('..').locator('..').getByLabel('Move day earlier').click()
await page.waitForTimeout(200)

// Skip what is now Day 2 (Tui → O Porriño)
await page.getByText('⏭ Skip').first().click()
await page.waitForTimeout(200)

// Edit stage details of the new Day 1
await page.getByText('✏️ Edit details').first().click()
await page.waitForSelector('text=Edit day details')
await page.fill('#stage-distance', '12.3')
await page.click('text=Save')
await page.waitForSelector('text=Edit the trip')

// Edit an existing bundled POI on Day 1's POI list
await page.getByText('📍 Points of interest').first().click()
await page.waitForSelector('text=Points of interest')
await page.waitForTimeout(600)
await page.locator('text=Edit').first().click()
await page.waitForSelector('text=Edit point of interest')
await page.fill('#poi-name', 'Renamed POI')
await page.click('text=Save')
await page.waitForSelector('text=Points of interest')
await page.waitForTimeout(300)

console.log('--- Before reload ---')
console.log('Custom name visible:', await page.locator('text=Renamed POI').count())

await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('text=Which day is it?')
await page.waitForTimeout(300)

console.log('--- After reload ---')

await page.click('text=⚙︎')
await page.waitForSelector('text=Edit the trip')
await page.waitForTimeout(300)
await page.screenshot({ path: 'scripts/screenshots/full-persist-01.png', fullPage: true })

const skippedCount = await page.locator('text=— skipped').count()
console.log('Skipped stage count (expect 1):', skippedCount)
const distanceShown = await page.locator('text=12.3 km').count()
console.log('Custom distance shown (expect 1):', distanceShown)

await page.getByText('📍 Points of interest').first().click()
await page.waitForSelector('text=Points of interest')
await page.waitForTimeout(500)
console.log('Renamed POI persisted:', await page.locator('text=Renamed POI').count())
await page.screenshot({ path: 'scripts/screenshots/full-persist-02-pois.png', fullPage: true })

console.log('\nConsole errors:', errors.length ? errors : 'none')
await browser.close()
if (errors.length) process.exit(1)
