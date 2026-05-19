/**
 * Diagnóstico completo de Supabase Storage
 *
 * cd server && node src/scripts/diagnose-storage.mjs
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Busca .env en la carpeta server/ (2 niveles arriba desde src/scripts/)
dotenv.config({ path: path.resolve(__dirname, '../..', '.env') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en server/.env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function diagnose() {
  console.log('/========================================/')
  console.log('  DIAGNÓSTICO SUPABASE STORAGE')
  console.log('/========================================/')
  console.log('Proyecto:', SUPABASE_URL)
  console.log('')

  // 1. Buckets
  console.log('[1] BUCKETS EXISTENTES:')
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    if (error) {
      console.error('  ❌ Error listando buckets:', error.message)
    } else {
      const wanted = ['product-images', 'banners', 'category-images']
      buckets.forEach(b => {
        const ok = wanted.includes(b.name) ? '✅' : '  '
        console.log(`  ${ok} ${b.name}  (public=${b.public})`)
      })
      wanted.forEach(name => {
        const found = buckets.find(b => b.name === name)
        if (!found) console.log(`  ❌ FALTA bucket: ${name}`)
      })
    }
  } catch (e) {
    console.error('  ❌ Excepción:', e.message)
  }

  // 2. Archivos por bucket
  console.log('')
  console.log('[2] ARCHIVOS POR BUCKET:')
  const bucketsToCheck = ['product-images', 'banners', 'category-images']
  for (const bucket of bucketsToCheck) {
    const { data } = await supabase.storage.from(bucket).list('', { limit: 100 })
    console.log(`  ${bucket}: ${data?.length || 0} archivos en raíz`)
  }

  // 3. Estadísticas de tablas
  console.log('')
  console.log('[3] ESTADÍSTICAS DE BD:')
  const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
  console.log(`  Products:       ${prodCount ?? 0}`)
  const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true })
  console.log(`  Categories:     ${catCount ?? 0}`)
  const { count: imgCount } = await supabase.from('product_images').select('*', { count: 'exact', head: true })
  console.log(`  Product Images: ${imgCount ?? 0}`)
  const { count: bannCount } = await supabase.from('banners').select('*', { count: 'exact', head: true })
  console.log(`  Banners:        ${bannCount ?? 0}`)

  // 4. URLs de imágenes y su origen
  console.log('')
  console.log('[4] ORIGEN DE URLs DE IMÁGENES:')
  const { data: images } = await supabase.from('product_images').select('id, product_id, image_url')
  const vercelImages = (images || []).filter(img => img.image_url?.includes('blob.vercel-storage.com'))
  const supabaseImages = (images || []).filter(img => img.image_url?.includes('supabase.co/storage'))
  const otherImages = (images || []).filter(img => {
    const u = img.image_url || ''
    return !u.includes('blob.vercel-storage.com') && !u.includes('supabase.co/storage')
  })
  console.log(`  Total product_images:    ${images?.length || 0}`)
  console.log(`  → URLs Vercel Blob:      ${vercelImages.length}  🔴 Necesitan migración`)
  console.log(`  → URLs Supabase Storage: ${supabaseImages.length}  ✅`)
  console.log(`  → Otros / vacías:        ${otherImages.length}`)

  if (vercelImages.length > 0) {
    console.log('')
    console.log('  Ejemplos de URLs Vercel Blob (primeras 3):')
    vercelImages.slice(0, 3).forEach(img => {
      console.log(`    Img ${img.id} (prod ${img.product_id}): ${(img.image_url || '').substring(0, 80)}...`)
    })
  }

  // 5. Banners
  console.log('')
  console.log('[5] ORIGEN DE URLs DE BANNERS:')
  const { data: banners } = await supabase.from('banners').select('id, title, image_url')
  const vercelBanners = (banners || []).filter(b => b.image_url?.includes('blob.vercel-storage.com'))
  console.log(`  Total banners:            ${banners?.length || 0}`)
  console.log(`  → URLs Vercel Blob:       ${vercelBanners.length}  🔴 Necesitan migración`)
  if (vercelBanners.length > 0) {
    console.log('  Ejemplos:')
    vercelBanners.slice(0, 3).forEach(b => {
      console.log(`    Banner ${b.id} (${b.title}): ${(b.image_url || '').substring(0, 80)}...`)
    })
  }

  // 6. Categorías
  console.log('')
  console.log('[6] ORIGEN DE URLs DE CATEGORÍAS:')
  const { data: cats } = await supabase.from('categories').select('id, name, image_url')
  const vercelCats = (cats || []).filter(c => c.image_url?.includes('blob.vercel-storage.com'))
  console.log(`  Total categorías:         ${cats?.length || 0}`)
  console.log(`  → URLs Vercel Blob:       ${vercelCats.length}  🔴 Necesitan migración`)
  console.log(`  → Sin imagen:             ${(cats || []).filter(c => !c.image_url).length}`)

  // Resumen
  console.log('')
  console.log('/============= RESUMEN =============/')
  const needsMigration = vercelImages.length + vercelBanners.length + vercelCats.length
  if (needsMigration > 0) {
    console.log(`🔴 ${needsMigration} imágenes necesitan migrarse desde Vercel Blob`)
    console.log('')
    console.log('Ejecuta: cd client && node scripts/migrate-to-supabase-storage.js')
    console.log('')
  } else if (imgCount === 0) {
    console.log('🟡 No hay imágenes en BD todavía. Crea productos para probar.')
  } else {
    console.log('✅ Todas las imágenes apuntan a Supabase Storage')
  }
  console.log('/===================================/')
}

diagnose().catch(console.error)
