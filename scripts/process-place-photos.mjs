import sharp from 'sharp'
import { readdirSync } from 'fs'
import { fileURLToPath } from 'url'

const srcDir = fileURLToPath(new URL('../src/data/raw/place-photos', import.meta.url))
const outDir = fileURLToPath(new URL('../public/nearby-photos', import.meta.url))

for (const file of readdirSync(srcDir)) {
  if (!file.endsWith('.jpg')) continue
  await sharp(`${srcDir}/${file}`)
    .resize(800, 600, { fit: 'cover' })
    .jpeg({ quality: 78 })
    .toFile(`${outDir}/${file}`)
  console.log('Processed', file)
}
