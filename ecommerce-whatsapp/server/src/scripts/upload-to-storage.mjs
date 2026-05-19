/**
 * Crea buckets en Supabase Storage del proyecto dqewyrotzskpbymecntt
 * Luego sube las imágenes de uploads/ locales
 */
import { createClient } from '@supabase/supabase-js'
import { readdirSync, statSync, readFileSync } from 'fs'
import { join } from 'path'
import { pipeline } from 'stream/promises'

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const UPLOADS = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\uploads'

const BUCKETS = ['product-images', 'banners', 'category-images']

async function main() {
  // PASO 1: Crear buckets
  console.log('=== PASO 1: Crear buckets ===')
  for (const name of BUCKETS) {
    // Verificar si existe
    const { data: existing } = await supabase.storage.listBuckets()
    const found = (existing || []).find(b => b.name === name)

    if (found) {
      console.log(`  ✓ Bucket '${name}' ya existe`)
    } else {
      const { error } = await supabase.storage.createBucket(name, {
        public: true,
        fileSizeLimit: 10485760,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
      })
      if (error) {
        console.error(`  ❌ Error creando bucket '${name}':`, error.message)
      } else {
        console.log(`  ✓ Bucket '${name}' creado`)
      }
    }
  }

  // PASO 2: Subir imágenes
  console.log('\n=== PASO 2: Subir imágenes ===')

  // 2a. Banners
  console.log('\n--- Banners ---')
  const bannerDir = join(UPLOADS, 'banners')
  const bannerFiles = readdirSync(bannerDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  console.log(`  ${bannerFiles.length} archivos en uploads/banners/`)

  let bannerOk = 0, bannerFail = 0
  for (const file of bannerFiles) {
    const fullPath = join(bannerDir, file)
    const fileBuffer = readFileSync(fullPath)
    const { error } = await supabase.storage
      .from('banners')
      .upload(file, fileBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: getContentType(file)
      })

    if (error) {
      console.error(`  ❌ ${file}:`, error.message)
      bannerFail++
    } else {
      console.log(`  ✓ ${file}`)
      bannerOk++
    }
  }
  console.log(`  Resumen banners: ${bannerOk} ✓, ${bannerFail} ❌`)

  // 2b. Productos
  console.log('\n--- Productos ---')
  const prodDir = join(UPLOADS, 'productos')
  const prodFiles = readdirSync(prodDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  console.log(`  ${prodFiles.length} archivos en uploads/productos/`)

  let prodOk = 0, prodFail = 0, prodSkip = 0
  // Subir en lotes de 5 en paralelo
  const batchSize = 5
  for (let i = 0; i < prodFiles.length; i += batchSize) {
    const batch = prodFiles.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(async file => {
        try {
          const fullPath = join(prodDir, file)
          const fileBuffer = readFileSync(fullPath)
          const { error } = await supabase.storage
            .from('product-images')
            .upload(file, fileBuffer, {
              cacheControl: '3600',
              upsert: true,
              contentType: getContentType(file)
            })
          return { file, ok: !error, error: error?.message }
        } catch (e) {
          return { file, ok: false, error: e.message }
        }
      })
    )

    for (const r of results) {
      if (r.ok) {
        prodOk++
      } else {
        prodFail++
        if (r.error) console.log(`  ❌ ${r.file}: ${r.error}`)
      }
    }

    if ((i + batchSize) % 50 === 0 || i + batchSize >= prodFiles.length) {
      console.log(`  Progreso: ${Math.min(i + batchSize, prodFiles.length)}/${prodFiles.length} (✓${prodOk} ❌${prodFail})`)
    }
  }

  console.log(`  Resumen productos: ${prodOk} ✓, ${prodFail} ❌`)

  // PASO 3: Reporte final
  console.log('\n========================================')
  console.log('RESUMEN FINAL')
  console.log(`Banners subidos:  ${bannerOk}/${bannerFiles.length}`)
  console.log(`Productos subidos: ${prodOk}/${prodFiles.length}`)
  console.log('========================================')
  console.log('\nAhora ejecuta: node update-image-urls.mjs')
}

function getContentType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase()
  const types = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
  return types[ext] || 'image/jpeg'
}

main().catch(console.error)
