import { chromium, devices } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext({ ...devices['iPhone 13'] })
const page = await context.newPage()
page.on('dialog', (d) => d.accept()) // window.confirm

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForSelector('text=Which day is it?')
await page.click('text=⚙︎')
await page.waitForSelector('text=Edit the trip')
await page.getByText('📍 Points of interest').first().click()
await page.waitForSelector('text=Points of interest')
await page.waitForTimeout(500)

const firstRow = page.locator('div').filter({ has: page.getByRole('button', { name: 'Edit' }) }).first()
const firstPoiName = await firstRow.locator('span').nth(1).textContent()
console.log('Deleting POI:', firstPoiName)

await page.locator('text=Edit').first().click()
await page.waitForSelector('text=Edit point of interest')
await page.click('text=Delete')
await page.waitForSelector('text=Points of interest')
await page.waitForTimeout(400)

const stillThere = await page.locator(`text=${firstPoiName}`).count()
console.log('Still present after delete (expect 0):', stillThere)

await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('text=Which day is it?')
await page.click('text=⚙︎')
await page.waitForSelector('text=Edit the trip')
await page.getByText('📍 Points of interest').first().click()
await page.waitForSelector('text=Points of interest')
await page.waitForTimeout(500)
const stillGoneAfterReload = await page.locator(`text=${firstPoiName}`).count()
console.log('Still gone after reload (expect 0):', stillGoneAfterReload)

await browser.close()
