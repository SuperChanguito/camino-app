import { chromium, devices } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext({
  ...devices['iPhone 13'],
  geolocation: { latitude: 42.0486, longitude: -8.6437 },
  permissions: ['geolocation'],
})
const page = await context.newPage()
const errors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForSelector('text=Which day is it?')

// Enter advanced mode
await page.click('text=⚙︎')
await page.waitForSelector('text=Edit the trip')
await page.screenshot({ path: 'scripts/screenshots/adv-01-stage-list.png' })

// Reorder: move Day 2 up
const dayTwoUpButton = page.locator('text=O Porriño → Redondela').locator('..').locator('..').getByLabel('Move day earlier')
await dayTwoUpButton.click()
await page.waitForTimeout(300)
await page.screenshot({ path: 'scripts/screenshots/adv-02-reordered.png' })

// Skip a stage
const skipButtons = page.getByText('⏭ Skip')
await skipButtons.first().click()
await page.waitForTimeout(300)
await page.screenshot({ path: 'scripts/screenshots/adv-03-skipped.png' })

// Edit stage details
await page.getByText('✏️ Edit details').first().click()
await page.waitForSelector('text=Edit day details')
const nameInput = page.locator('#stage-distance')
await nameInput.fill('99.9')
await page.click('text=Save')
await page.waitForSelector('text=Edit the trip')
await page.screenshot({ path: 'scripts/screenshots/adv-04-after-edit.png' })

// POIs: open POI editor for first stage
await page.getByText('📍 Points of interest').first().click()
await page.waitForSelector('text=Points of interest')
await page.screenshot({ path: 'scripts/screenshots/adv-05-poi-list.png' })

// Add a new POI via map tap
await page.click('text=+ Add point of interest')
await page.waitForSelector('text=Tap the map where this point of interest is.')
await page.waitForTimeout(2500) // let tiles load
const mapBox = await page.locator('.maplibregl-canvas').boundingBox()
await page.mouse.click(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2)
await page.waitForTimeout(300)
await page.screenshot({ path: 'scripts/screenshots/adv-06-picker.png' })
await page.click('text=Use this location')

await page.waitForSelector('text=New point of interest')
await page.fill('#poi-name', 'Test Custom POI')
await page.click('text=Save')
await page.waitForSelector('text=Points of interest')
await page.waitForTimeout(300)
await page.screenshot({ path: 'scripts/screenshots/adv-07-poi-added.png' })

console.log('Advanced mode flow completed.')
console.log('Console errors:', errors.length ? errors : 'none')

await browser.close()
if (errors.length > 0) process.exit(1)
