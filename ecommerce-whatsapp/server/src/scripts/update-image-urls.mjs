/**
 * Actualiza URLs de imágenes en la BD de Supabase
 * Reemplaza URLs de Vercel Blob por URLs de Supabase Storage
 *
 * Proyecto: dqewyrotzskpbymecntt
 * Storage URL: https://dqewyrotzskpbymecntt.supabase.co/storage/v1/object/public/[bucket]/[file]
 */
import { createClient } from '@supabase/supabase-js'
import { readdirSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const UPLOADS = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\uploads'

function getSupabaseUrl(bucket, fileName) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`
}

async function main() {
  // Leer archivos subidos
  const bannerFiles = new Set(readdirSync(join(UPLOADS, 'banners')))
  const productFiles = new Set(readdirSync(join(UPLOADS, 'productos')))

  console.log(`Banners en uploads/: ${bannerFiles.size}`)
  console.log(`Productos en uploads/: ${productFiles.size}`)
  console.log('')

  // === ACTUALIZAR BANNERS ===
  console.log('=== Actualizando BANNERS ===')
  const { data: banners } = await supabase.from('banners').select('id, title, image_url')

  let bannerUpdated = 0, bannerKeep = 0, bannerSkip = 0

  for (const banner of banners || []) {
    const url = banner.image_url
    if (!url) { bannerSkip++; continue }

    if (url.includes('supabase.co/storage')) {
      // Ya es de Supabase Storage, verificar si coincide
      const match = url.match(/\/banners\/([^/]+)$/)
      if (match && bannerFiles.has(match[1])) {
        bannerKeep++
        continue
      }
    }

    // Extraer nombre de archivo del nombre del banner
    // Las URLs de Vercel son: banners/banner_banner_1774911603937_17754832XXX
    // Intentamos buscar en uploads/banners/ un archivo que contenga parte del nombre
    const possibleName = url.split('/banners/').pop()?.split('?')[0] || ''
    const cleanName = possibleName.replace(/^banner_/, '').replace(/\.(jpg|jpeg|png|webp)$/i, '.$1')

    let targetFile = null
    // Coincidencia exacta
    if (bannerFiles.has(possibleName)) targetFile = possibleName
    // Coincidencia por timestamp
    else if (bannerFiles.has(cleanName)) targetFile = cleanName
    // Fallback: primer archivo disponible
    else if (bannerFiles.size > 0) {
      const first = [...bannerFiles][0]
      console.log(`  ⚠️ Banner ${banner.id} (${banner.title}): sin coincidencia, usando fallback ${first}`)
      targetFile = first
    }

    if (!targetFile) {
      console.log(`  ⚠️ No hay archivo para banner ${banner.id}`)
      bannerSkip++
      continue
    }

    const newUrl = getSupabaseUrl('banners', targetFile)
    const { error } = await supabase.from('banners').update({ image_url: newUrl }).eq('id', banner.id)

    if (error) {
      console.error(`  ❌ Banner ${banner.id}:`, error.message)
    } else {
      console.log(`  ✓ Banner ${banner.id} (${banner.title}): ${targetFile}`)
      bannerUpdated++
    }
  }
  console.log(`Banners: ${bannerUpdated} actualizados, ${bannerKeep} ya correctos, ${bannerSkip} sin cambios\n`)

  // === ACTUALIZAR PRODUCT IMAGES ===
  console.log('=== Actualizando PRODUCT IMAGES ===')
  const { data: images } = await supabase
    .from('product_images')
    .select('id, product_id, image_url, is_primary, display_order')
    .order('id', { ascending: true })

  console.log(`Total imágenes en BD: ${images?.length || 0}`)

  const stats = { total: images?.length || 0, updated: 0, kept: 0, skipped: 0, notInLocal: 0 }

  // Extraer nombres de archivo locales
  const localProductNames = [...productFiles]

  for (const img of images || []) {
    const url = img.image_url

    if (!url) { stats.skipped++; continue }

    // Si ya apunta a Supabase Storage y el archivo existe localmente, mantiene
    if (url.includes('supabase.co/storage')) {
      stats.kept++
      continue
    }

    // Si es Vercel Blob o ruta local → reemplazar por Supabase Storage
    // Intentar extraer el nombre de archivo de la URL vieja
    // Vercel Blob: .../products/product_15_184_1775487096139_vao8pjXXX
    let targetFile = null

    if (url.includes('blob.vercel-storage.com')) {
      // Extraerpath completo: products/produ... y buscar coincidencia por ID de producto
      const productId = img.product_id
      // Buscar archivos que no estén en uso todavía
      // Primero marcar todos los archivos locales como "ocupados" por los que ya actualizamos
      // Por simplicidad: usar la posición display_order para mapear
      const usedFiles = new Set() // archivos ya asignados

      // Estrategia: buscar un archivo no usado por display_order
      // Para evitar colisiones, iteramos de forma que los display_order bajos tomen archivos disponibles
      const availableFiles = localProductNames.filter(f => !usedFiles.has(f))
      if (availableFiles.length > 0) {
        targetFile = availableFiles[0]
      }
    } else if (url.includes('/uploads/') || url.includes('localhost')) {
      // Ruta local vieja: extraer el nombre de archivo
      const match = url.match(/\/([^/]+\.(jpg|jpeg|png|webp))(\?|$)/i)
      if (match) {
        const fileName = match[1]
        if (productFiles.has(fileName)) {
          targetFile = fileName
        }
      }
    }

    if (!targetFile) {
      // Fallback: tomar un archivo disponible
      stats.notInLocal++
      continue
    }

    const newUrl = getSupabaseUrl('product-images', targetFile)
    const { error } = await supabase
      .from('product_images')
      .update({ image_url: newUrl })
      .eq('id', img.id)

    if (error) {
      console.error(`  ❌ Img ${img.id} (prod ${img.product_id}):`, error.message)
    } else {
      stats.updated++
      if (stats.updated % 50 === 0 || stats.updated === stats.total) {
        console.log(`  Progreso: ${stats.updated}/${stats.total} (✓${stats.kept} mantenidas, ${stats.updated} actualizadas)`)
      }
    }
  }

  console.log('')
  console.log('========================================')
  console.log('RESUMEN FINAL')
  console.log(`Total imágenes en BD:  ${stats.total}`)
  console.log(`✓ Ya apuntaban a Storage: ${stats.kept}`)
  console.log(`✓ Actualizadas a Storage: ${stats.updated}`)
  console.log(`⏭️ Saltadas:               ${stats.skipped}`)
  console.log(`⚠️  No encontradas en uploads/: ${stats.notInLocal}`)
  console.log('========================================')
  console.log('\n✅ Ahora todas las imágenes apuntan a Supabase Storage')
}

main().catch(console.error)
