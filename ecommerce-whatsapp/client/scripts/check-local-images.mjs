/**
 * Compara URLs de Vercel Blob con archivos locales en uploads/
 */
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

const UPLOADS_DIR = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\uploads'

const bannersDir = join(UPLOADS_DIR, 'banners')
const productosDir = join(UPLOADS_DIR, 'productos')

const bannerFiles = readdirSync(bannersDir)
const productoFiles = readdirSync(productosDir)

console.log(`Banners locales: ${bannerFiles.length}`)
console.log(`Productos locales: ${productoFiles.length}`)
console.log('')

// Mostrar banners
console.log('=== BANNERS LOCALES ===')
bannerFiles.forEach(f => console.log(' ', f))

// Mostrar primeros/últimos productos
console.log('')
console.log('=== PRIMEROS 10 PRODUCTOS LOCALES ===')
productoFiles.slice(0, 10).forEach(f => console.log(' ', f))
console.log('')
console.log('=== ÚLTIMOS 10 PRODUCTOS LOCALES ===')
productoFiles.slice(-10).forEach(f => console.log(' ', f))

// Ver si hay imágenes sueltas en uploads/raíz
const rootFiles = readdirSync(UPLOADS_DIR).filter(f => {
  const ext = f.split('.').pop().toLowerCase()
  return ['jpg','jpeg','png','webp'].includes(ext)
})
console.log('')
console.log(`Imágenes en raíz de uploads/: ${rootFiles.length}`)
rootFiles.forEach(f => console.log(' ', f))
