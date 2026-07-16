import { chromium, devices } from 'playwright'

const consoleErrors = []

const browser = await chromium.launch()
const context = await browser.newContext({
  ...devices['iPhone 13'],
  geolocation: { latitude: 42.0486, longitude: -8.6437 }, // near Tui, start of stage 1
  permissions: ['geolocation'],
})
const page = await context.newPage()
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`))

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForSelector('text=Which day is it?', { timeout: 10000 })
await page.screenshot({ path: 'scripts/screenshots/01-stage-select.png' })
console.log('Stage select rendered OK')

await page.click('text=Tui → O Porriño')
await page.waitForSelector('text=Walked', { timeout: 10000 })
await page.waitForTimeout(1500) // let GPS fix + map settle
await page.screenshot({ path: 'scripts/screenshots/02-map.png' })
console.log('Map screen rendered OK')

await page.click('text=Day')
await page.waitForSelector('text=Which day is it?', { timeout: 10000 })
await page.screenshot({ path: 'scripts/screenshots/04-back-to-stages.png' })
console.log('Bottom nav round-trip OK')

console.log('\nConsole errors:', consoleErrors.length ? consoleErrors : 'none')

await browser.close()

if (consoleErrors.length > 0) {
  process.exit(1)
}
