import { chromium, devices } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext({
  ...devices['iPhone 13'],
  geolocation: { latitude: 42.0486, longitude: -8.6437 },
  permissions: ['geolocation'],
})
const page = await context.newPage()
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('[console-error]', msg.text())
})
page.on('pageerror', (err) => console.log('[pageerror]', err.message))

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })

// Let the service worker finish installing + precaching the app shell.
await page.waitForFunction(() => navigator.serviceWorker.controller !== null, { timeout: 15000 }).catch(() =>
  console.log('WARNING: service worker did not take control within 15s'),
)
await page.waitForTimeout(1000)

await page.click('text=Tui → O Porriño')
await page.waitForSelector('text=Walked')
await page.waitForTimeout(1000)

await page.click('text=Save map for offline')
await page.waitForSelector('text=saved for offline use', { timeout: 60000 })
console.log('Tile download completed while online')

await context.setOffline(true)
console.log('Now offline. Reloading app...')
await page.reload({ waitUntil: 'domcontentloaded' })

await page
  .waitForSelector('text=Walked', { timeout: 15000 })
  .then(() => console.log('App shell + active stage loaded OK while offline'))
  .catch(() => console.log('FAILED: app did not reach the map screen while offline'))

await page.waitForTimeout(3000)
await page.screenshot({ path: 'scripts/screenshots/08-offline-prod-reload.png' })

await browser.close()
