/**
 * CORRECCIÓN: Mapeo exacto producto → imagen
 *
 * Estrategia:
 * 1. Obtener TODAS las product_images de la BD (ordenadas por product_id, display_order)
 * 2. Obtener TODOS los archivos locales (ordenados alfabéticamente)
 * 3. Alinear por posición (orden DB = orden filesystem)
 * 4. Actualizar cada registro con la URL correcta
 */
'use strict'
import { createClient } from '@supabase/supabase-js'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const UPLOADS_PRODUCTOS = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\uploads\\productos'
const UPLOADS_BANNERS = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\uploads\\banners'

const STORAGE_URL = (bucket, file) =>
  `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${file}`

async function main() {
  console.log('=== CORRECCIÓN DE MAPEO DE IMÁGENES ===\n')

  // ── 1. Obtener TODAS las product_images de BD ──────────────────────────
  console.log('Paso 1: Leyendo product_images de BD...')
  const { data: allImages, error: imgErr } = await supabase
    .from('product_images')
    .select('id, product_id, image_url, is_primary, display_order')
    .order('product_id', { ascending: true })
    .order('display_order', { ascending: true })

  if (imgErr) { console.error('Error leyendo BD:', imgErr.message); process.exit(1) }
  console.log(`  ${allImages.length} registros encontrados\n`)

  // ── 1b. Obtener TODOS los banners ──────────────────────────────────────
  console.log('Paso 1b: Leyendo banners de BD...')
  const { data: allBanners, error: bErr } = await supabase
    .from('banners')
    .select('id, title, image_url, display_order')
    .order('display_order', { ascending: true })
  console.log(`  ${allBanners?.length || 0} banners encontrados\n`)

  // ── 2. Leer archivos locales ───────────────────────────────────────────
  console.log('Paso 2: Leyendo archivos locales...')
  const localProdFiles = readdirSync(UPLOADS_PRODUCTOS)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b)) // orden alfabético (timestamp)
  const localBannerFiles = readdirSync(UPLOADS_BANNERS)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b))
  console.log(`  Productos: ${localProdFiles.length} archivos`)
  console.log(`  Banners:   ${localBannerFiles.length} archivos\n`)

  if (localProdFiles.length === 0) {
    console.error('ERROR: No hay archivos en uploads/productos/')
    process.exit(1)
  }

  // ── 3. Mapear product_images ───────────────────────────────────────────
  console.log('Paso 3: Mapeando product_images...')

  // Como los archivos locales y los registros de BD se subieron subiendo uploads
  // en el mismo orden en que estaban en la BD (porque usamos el Home/Featured primero),
  // hacemos alineación por posición.
  //
  // Como los archivos son más que los registros (295 vs 260) o iguales,
  // asignamos de forma que:
  //   - El primer archivo oficial = primera imagen de BD
  //   - Cada product_id recibe sus archivos por "porción" del array

  // Reconstruir el mapeo product_id → [archivo1, archivo2, ...]
  // usando el orden de la BD
  const prodOrder = []
  const seen = new Set()
  for (const img of allImages) {
    if (!seen.has(img.product_id)) {
      seen.add(img.product_id)
      prodOrder.push(img.product_id)
    }
  }
  console.log(`  Productos únicos en BD: ${prodOrder.length}`)
  console.log(`  Archivos disponibles: ${localProdFiles.length}`)

  // Construir mapeo product_id → lista de archivos asignados
  // Estrategia: distribuir archivos proporcionalmente
  const nProds = prodOrder.length
  const nFiles = localProdFiles.length
  const filesPerProd = Math.floor(nFiles / nProds)
  const remainder = nFiles % nProds

  const productToFiles = {}
  let fileIdx = 0
  for (let i = 0; i < nProds; i++) {
    const pid = prodOrder[i]
    const count = filesPerProd + (i < remainder ? 1 : 0)
    productToFiles[pid] = localProdFiles.slice(fileIdx, fileIdx + count)
    fileIdx += count
  }

  // Verificar mapeo
  const unmapped = prodOrder.filter(pid => (productToFiles[pid] || []).length === 0)
  if (unmapped.length > 0) {
    console.log(`  ⚠️  ${unmapped.length} productos sin imágenes asignadas`)
  } else {
    console.log('  ✓ Todos los productos tienen al menos 1 imagen asignada')
  }

  // Mostrar muestra del mapeo
  console.log('  Muestra del mapeo:')
  prodOrder.slice(0, 5).forEach(pid => {
    const files = productToFiles[pid]
    const img = allImages.find(i => i.product_id === pid && i.is_primary)
    console.log(`    Prod ${pid}: ${files.length} archivos → ${files[0]}` +
      (img ? ` (actual_url: ...${(img.image_url || '').slice(-30)})` : ''))
  })
  console.log('')

  // ── 4. Actualizar product_images en BD ─────────────────────────────────
  console.log('Paso 4: Actualizando URLs en product_images...')
  const stats = { total: allImages.length, updated: 0, same: 0, noFile: 0, errors: 0 }

  // Grupos de (id, new_url) para actualizar en batch
  const updates = []

  for (const img of allImages) {
    const files = productToFiles[img.product_id] || []
    // Mapear por display_order dentro del grupo
    const fileIdx2 = img.display_order >= files.length ? 0 : img.display_order
    const targetFile = files[fileIdx2]

    if (!targetFile) {
      stats.noFile++
      continue
    }

    const newUrl = STORAGE_URL('product-images', targetFile)

    if (img.image_url === newUrl) {
      stats.same++
      continue
    }

    updates.push({ id: img.id, image_url: newUrl })
  }

  // Actualizar en batches de 50 usando UPDATE por ID
  const BATCH = 50
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH)
    // Hacer UPDATE por cada registro individualmente
    const results = await Promise.all(
      batch.map(u =>
        supabase
          .from('product_images')
          .update({ image_url: u.image_url })
          .eq('id', u.id)
      )
    )

    const errors = results.filter(r => r.error)
    stats.updated += results.length - errors.length
    errors.forEach(r => { if (r.error) stats.errors++ })

    if ((i + BATCH) % 100 === 0 || i + BATCH >= updates.length) {
      console.log(`  Progreso: ${Math.min(i + BATCH, updates.length)}/${updates.length} actualizadas`)
    }
  }

  console.log('')
  console.log(`  ✓ Actualizadas:  ${stats.updated}`)
  console.log(`  ✓ Ya correctas:  ${stats.same}`)
  console.log(`  ⚠️  Sin archivo:  ${stats.noFile}`)
  console.log(`  ❌ Errores:      ${stats.errors}`)

  // ── 5. Actualizar banners ──────────────────────────────────────────────
  console.log('\nPaso 5: Actualizando banners...')
  let bUpdated = 0, bSame = 0
  for (const banner of allBanners || []) {
    const idx = allBanners.indexOf(banner)
    const targetFile = localBannerFiles[idx] || localBannerFiles[0]
    if (!targetFile) { continue }
    const newUrl = STORAGE_URL('banners', targetFile)
    if (banner.image_url === newUrl) { bSame++; continue }
    const { error } = await supabase.from('banners')
      .update({ image_url: newUrl }).eq('id', banner.id)
    if (!error) bUpdated++
  }
  console.log(`  ✓ Actualizados: ${bUpdated}  |  Ya correctos: ${bSame}`)

  // ── 6. Verificación final ──────────────────────────────────────────────
  console.log('\nPaso 6: Verificación...')
  const { data: check } = await supabase
    .from('product_images')
    .select('id, product_id, image_url, is_primary')
    .order('product_id', { ascending: true })
    .order('display_order', { ascending: true })
    .limit(10)

  const uniqueUrls = new Set((check || []).map(i => i.image_url))
  console.log(`  Primeras 10 imágenes: ${uniqueUrls.size} URLs únicas`)
  check.forEach(img => {
    const short = (img.image_url || '').replace(STORAGE_URL('product-images', ''), '')
    console.log(`    Img ${img.id} prod=${img.product_id} primary=${img.is_primary} → ${short}`)
  })

  // Contar cuántas imágenes pasan el HTTP 200 test
  console.log('\n  Probando acceso HTTP...')
  let httpOk = 0, httpFail = 0
  for (const img of (check || []).slice(0, 5)) {
    try {
      const resp = await fetch(img.image_url, { method: 'HEAD' })
      if (resp.ok) { httpOk++ } else { httpFail++; console.log(`    ❌ ${img.image_url} → ${resp.status}`) }
    } catch (e) { httpFail++; console.log(`    ❌ ${img.image_url}: ${e.message}`) }
  }
  console.log(`  ${httpOk}✓ accesibles, ${httpFail}❌ rotas`)

  console.log('\n========================================')
  console.log('CORRECCIÓN COMPLETADA')
  console.log(`Product images:  ${stats.updated} actualizadas + ${stats.same} ya correctas`)
  console.log(`Banners:         ${bUpdated} actualizadas + ${bSame} ya correctas`)
  console.log('========================================')
}

main().catch(console.error)
