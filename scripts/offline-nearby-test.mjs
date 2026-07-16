import { chromium, devices } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext({
  ...devices['iPhone 13'],
  geolocation: { latitude: 42.42, longitude: -8.63 },
  permissions: ['geolocation'],
})
const page = await context.newPage()
const errors = []
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', (err) => errors.push(err.message))

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
await page.waitForFunction(() => navigator.serviceWorker.controller !== null, { timeout: 15000 }).catch(() =>
  console.log('WARNING: service worker did not take control within 15s'),
)
await page.waitForTimeout(1000)

await page.click('text=Redondela → Pontevedra')
await page.waitForSelector('text=Walked')
await page.getByRole('button', { name: 'More' }).click()
await page.waitForSelector('text=More places nearby')
await page.waitForTimeout(1000)
console.log('Loaded nearby places online OK')

await context.setOffline(true)
console.log('Now offline. Reloading...')
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('text=Walked', { timeout: 15000 })
await page.getByRole('button', { name: 'More' }).click()
await page.waitForSelector('text=More places nearby', { timeout: 10000 })
await page.waitForTimeout(1000)
await page.screenshot({ path: 'scripts/screenshots/nearby-offline.png', fullPage: true })

const imgOk = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img'))
  return imgs.map((img) => ({ src: img.src, complete: img.complete, naturalWidth: img.naturalWidth }))
})
console.log('Images while offline:', JSON.stringify(imgOk))

console.log('\nConsole errors:', errors.length ? errors : 'none')
await browser.close()
if (errors.length) process.exit(1)
