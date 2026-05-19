/**
 * Análisis completo de diferencias entre uploads/ locales y BD de Supabase
 * Proyecto: dqewyrotzskpbymecntt
 */
import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const UPLOADS = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\uploads'

async function analyze() {
  console.log('=== ANÁLISIS UPLOADS/ vs BD ===\n')

  // 1. Leer archivos locales
  const localBanners = new Set(readdirSync(join(UPLOADS, 'banners')))
  const localProductos = new Set(readdirSync(join(UPLOADS, 'productos')))
  const localRoot = new Set(readdirSync(UPLOADS).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)))

  console.log(`[LOCAL] Banners: ${localBanners.size}`)
  console.log(`[LOCAL] Productos: ${localProductos.size}`)
  console.log(`[LOCAL] Raíz: ${localRoot.size}`)
  console.log('')

  // 2. Obtener TODAS las imágenes de producto de BD
  const { data: dbImages, error: imgErr } = await supabase
    .from('product_images')
    .select('id, product_id, image_url, is_primary')
    .order('id', { ascending: true })

  if (imgErr) {
    console.error('Error leyendo product_images:', imgErr.message)
    return
  }
  console.log(`[BD] product_images: ${dbImages.length}`)

  // 3. Obtener TODOS los banners de BD
  const { data: dbBanners } = await supabase
    .from('banners')
    .select('id, title, image_url')

  console.log(`[BD] banners: ${dbBanners.length}`)
  console.log('')

  // 4. Clasificar BD por origen
  const dbImagesVercel = dbImages.filter(i => i.image_url?.includes('blob.vercel-storage.com'))
  const dbImagesLocal = dbImages.filter(i => i.image_url?.includes('/uploads/') || i.image_url?.includes('localhost'))
  const dbImagesSupabase = dbImages.filter(i => i.image_url?.includes('supabase.co/storage'))
  const dbImagesEmpty = dbImages.filter(i => !i.image_url)

  console.log('[BD product_images por origen]:')
  console.log(`  Vercel Blob: ${dbImagesVercel.length}`)
  console.log(`  Rutas locales (/uploads/): ${dbImagesLocal.length}`)
  console.log(`  Supabase Storage: ${dbImagesSupabase.length}`)
  console.log(`  Vacías/null: ${dbImagesEmpty.length}`)
  console.log('')

  // 5. Si hay rutas locales en BD, extraer nombres de archivo
  const localRefsInDb = new Set()
  dbImagesLocal.forEach(img => {
    const url = img.image_url
    // Extraer el nombre de archivo de la URL
    const match = url.match(/\/([^/]+\.(jpg|jpeg|png|webp))(\?|$)/i)
    if (match) localRefsInDb.add(match[1].toLowerCase())
  })

  console.log(`[BD] Rutas locales referenciadas: ${localRefsInDb.size}`)
  if (localRefsInDb.size > 0) {
    [...localRefsInDb].slice(0, 5).forEach(f => console.log('  ', f))
  }
  console.log('')

  // 6. Comparar uploads/ productos con BD (por nombre de archivo)
  const productosEnBd = new Set()
  dbImages.forEach(img => {
    const url = img.image_url || ''
    const nameMatch = url.match(/producto?s?\/([^/]+\.(jpg|jpeg|png|webp))(\?|$)/i) ||
                     url.match(/(\d{13}-[a-z0-9]+\.(jpg|jpeg|png|webp))(\?|$)/i)
    if (nameMatch) productosEnBd.add(nameMatch[1].toLowerCase())
  })

  const localesQueEstanEnBd = [...localProductos].filter(f => productosEnBd.has(f.toLowerCase()))
  const localesQueNOEstanEnBd = [...localProductos].filter(f => !productosEnBd.has(f.toLowerCase()))

  console.log('=== PRODUCTOS SUBIDOS HOY (uploads/productos/) ===')
  console.log(`Total en uploads/: ${localProductos.size}`)
  console.log(`Ya referenciados en BD: ${localesQueEstanEnBd.length}`)
  console.log(`NUEVOS (no en BD todavía): ${localesQueNOEstanEnBd.length}`)
  console.log('Ejemplos de nuevos:', localesQueNOEstanEnBd.slice(0, 5))
  console.log('')

  // 7. Banners locales vs BD
  const bannersEnBd = new Set()
  dbBanners.forEach(b => {
    const url = b.image_url || ''
    const nameMatch = url.match(/(\d{13}-[a-z0-9]+\.(jpg|jpeg|png|webp))(\?|$)/i)
    if (nameMatch) bannersEnBd.add(nameMatch[1].toLowerCase())
  })

  const bannersQueEstanEnBd = [...localBanners].filter(f => bannersEnBd.has(f.toLowerCase()))
  const bannersQueNOEstanEnBd = [...localBanners].filter(f => !bannersEnBd.has(f.toLowerCase()))

  console.log('=== BANNERS SUBIDOS HOY (uploads/banners/) ===')
  console.log(`Total en uploads/: ${localBanners.size}`)
  console.log(`Ya referenciados en BD: ${bannersQueEstanEnBd.length}`)
  console.log(`NUEVOS (no en BD todavía): ${bannersQueNOEstanEnBd.length}`)
  console.log('Ejemplos de nuevos:', bannersQueNOEstanEnBd.slice(0, 5))
  console.log('')

  // RESUMEN
  console.log('========================================')
  console.log('RESUMEN DE ACCIÓN REQUERIDA:')
  console.log('========================================')
  console.log(`Imágenes nuevas de productos: ${localesQueNOEstanEnBd.length}`)
  console.log(`Banners nuevos: ${bannersQueNOEstanEnBd.length}`)
  console.log(`Imágenes Vercel Blob obsoletas: ${dbImagesVercel.length}`)
  console.log(`Imágenes con rutas locales huérfanas: ${dbImagesLocal.length}`)
  console.log(`Total imágenes en BD: ${dbImages.length}`)
  console.log('----------------------------------------')
  if (localesQueNOEstanEnBd.length > 0 || bannersQueNOEstanEnBd.length > 0) {
    console.log('>>> Hay imágenes NUEVAS que no están en BD — se pueden subir a Storage')
  }
  console.log('========================================')
}

analyze().catch(console.error)
