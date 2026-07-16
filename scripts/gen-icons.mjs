import sharp from 'sharp'
import { fileURLToPath } from 'url'

const src = fileURLToPath(new URL('../public/icons/icon-source.svg', import.meta.url))

await sharp(src).resize(192, 192).png().toFile(fileURLToPath(new URL('../public/icons/icon-192.png', import.meta.url)))
await sharp(src).resize(512, 512).png().toFile(fileURLToPath(new URL('../public/icons/icon-512.png', import.meta.url)))
await sharp(src)
  .resize(512, 512)
  .png()
  .toFile(fileURLToPath(new URL('../public/icons/icon-512-maskable.png', import.meta.url)))

console.log('Icons generated.')
