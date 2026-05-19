/**
 * FIX IMAGES 2.0A — MAPEO SECUENCIAL 1-a-1 SIN CONFIRMACIÓN
 *
 * Mapea cada registro de product_images de BD en orden
 * a un archivo local en orden, ciclando si hay más registros que archivos.
 */
'use strict'
import { createClient } from '@supabase/supabase-js'
import { readdirSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const UPLOADS_PRODUCTOS = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\uploads\\productos'
const UPLOADS_BANNERS   = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\uploads\\banners'

const STORAGE_URL = (bucket, file) =>
  `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${file}`

async function main() {
  console.log('=== FIX IMAGES 2.0A: MAPEO SECUENCIAL SIN CONFIRMACIÓN ===\n')

  // ── 1. Leer archivos locales ────────────────────────────────────────────
  console.log('Paso 1: Leyendo archivos locales ordenados...')
  const localProdFiles = readdirSync(UPLOADS_PRODUCTOS)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b))

  const localBannerFiles = readdirSync(UPLOADS_BANNERS)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b))

  console.log(`  Productos: ${localProdFiles.length} archivos`)
  console.log(`  Banners:   ${localBannerFiles.length} archivos\n`)

  if (localProdFiles.length === 0) {
    console.error('ERROR: No hay archivos en uploads/productos/')
    process.exit(1)
  }

  // ── 2. Leer todas las product_images de BD ordenadas ────────────────────
  console.log('Paso 2: Leyendo product_images de BD (ordenadas por product_id, display_order)...')
  const { data: allImages, error: imgErr } = await supabase
    .from('product_images')
    .select('id, product_id, image_url, is_primary, display_order')
    .order('product_id', { ascending: true })
    .order('display_order', { ascending: true })

  if (imgErr) { console.error('Error:', imgErr.message); process.exit(1) }
  const totalRecords = allImages.length
  console.log(`  ${totalRecords} registros\n`)

  // ── 3. Construir mapeo secuencial ─────────────────────────────────────
  console.log('Paso 3: Construyendo mapeo seq(img[n] → file[n % N_files])...')

  // Estado ANTES
  const beforeMap = {}
  allImages.forEach(img => {
    const f = img.image_url ? img.image_url.substring(img.image_url.lastIndexOf('/') + 1) : '-'
    beforeMap[img.id] = f
  })

  // Calcular updates
  const productUpdates = allImages.map((img, n) => {
    const targetFile = localProdFiles[n % localProdFiles.length]
    const newUrl = STORAGE_URL('product-images', targetFile)
    return {
      id: img.id,
      newUrl,
      changed: img.image_url !== newUrl
    }
  })
  const toUpdate = productUpdates.filter(u => u.changed)
  console.log(`  Ya correctas   : ${totalRecords - toUpdate.length}`)
  console.log(`  Necesitan cambio: ${toUpdate.length}\n`)

  // Mostrar duplicados que se van a ELIMINAR
  const imageCounts = {}
  allImages.forEach(img => {
    const f = beforeMap[img.id]
    imageCounts[f] = (imageCounts[f] || 0) + 1
  })
  const hotCount = Object.entries(imageCounts).filter(([,v]) => v > 1).length
  console.log(`  Archivos compartidos (>1 uso) antes: ${hotCount}`)

  // Verificar que todos los archivos destino existen en storage public endpoint
  console.log('\n  Probando acceso HTTP de 5 archivos destino...')
  let httpOk = 0, httpFail = 0
  const probeIdx = [0, Math.floor(totalRecords/2), totalRecords-1, Math.floor(totalRecords/4), Math.floor(totalRecords*3/4)]
  for (const idx of probeIdx) {
    const f = localProdFiles[idx % localProdFiles.length]
    const url = STORAGE_URL('product-images', f)
    try {
      const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      r.ok ? httpOk++ : (httpFail++, console.log(`    ❌ ${r.status} → ${f}`))
    } catch(e) { httpFail++; console.log(`    ❌ ${f}: ${e.message}`) }
  }
  console.log(`  ${httpOk}✓ accesibles, ${httpFail}❌ rotos\n`)
  if (httpFail > 0) {
    console.log('⚠️  Algunos archivos no son accesibles. Abortando.')
    process.exit(1)
  }

  // ── 4. Actualizar product_images en batches de 50 ─────────────────────
  console.log(`Paso 4: Actualizando ${toUpdate.length} registros en BD...`)
  const BATCH = 50
  let updated = 0, errors = 0

  for (let i = 0; i < toUpdate.length; i += BATCH) {
    const batch = toUpdate.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map(u =>
        supabase.from('product_images').update({ image_url: u.newUrl }).eq('id', u.id)
      )
    )
    results.forEach(r => { if (r.error) { errors++; console.error(`  Error id=${batch[results.indexOf(r)]?.id}:`, r.error.message) } })
    updated += results.length - results.filter(r => r.error).length

    if ((i + BATCH) % 100 === 0 || i + BATCH >= toUpdate.length) {
      console.log(`  ${Math.min(i + BATCH, toUpdate.length)}/${toUpdate.length}`)
    }
  }
  console.log(`  ✓ Actualizadas: ${updated} | ❌ Errores: ${errors}\n`)

  // ── 5. Actualizar banners (secuencial) ────────────────────────────────
  console.log('Paso 5: Actualizando banners...')
  const bannerUpdates = (await supabase.from('banners').select('id, image_url').order('display_order', {ascending:true})).data || []
  const bUpdates = bannerUpdates.map((b, i) => {
    const targetFile = localBannerFiles[i % localBannerFiles.length]
    if (!targetFile) return null
    const newUrl = STORAGE_URL('banners', targetFile)
    return { id: b.id, newUrl, changed: b.image_url !== newUrl }
  }).filter(Boolean)

  let bUpd = 0
  for (const b of bUpdates) {
    if (!b.changed) continue
    const { error } = await supabase.from('banners').update({ image_url: b.newUrl }).eq('id', b.id)
    if (!error) { bUpd++ } else { console.error('Banner err:', error.message) }
  }
  console.log(`  ✓ Actualizados: ${bUpd}\n`)

  // ── 6. Verificación final ──────────────────────────────────────────────
  console.log('Paso 6: Verificación post-actualización...')
  const { data: check } = await supabase
    .from('product_images')
    .select('id, product_id, image_url, display_order, is_primary')
    .order('product_id', { ascending: true })
    .order('display_order', { ascending: true })

  if (check) {
    // Contar duplicados de archivo
    const fcounts = {}
    check.forEach(img => {
      const f = (img.image_url || '').replace(/^.*\//, '')
      fcounts[f] = (fcounts[f] || 0) + 1
    })
    const hot = Object.entries(fcounts).filter(([,v]) => v > 1).length
    const singles = Object.values(fcounts).filter(v => v === 1).length
    console.log(`  Total registros    : ${check.length}`)
    console.log(`  Archivos únicos    : ${Object.keys(fcounts).length}`)
    console.log(`  Usados 1 sola vez  : ${singles}`)
    console.log(`  Compartidos        : ${hot}`)

    // Productos con duplicados
    const pmap = {}
    check.forEach(img => {
      if (!pmap[img.product_id]) pmap[img.product_id] = []
      pmap[img.product_id].push(img.image_url.substring(img.image_url.lastIndexOf('/') + 1))
    })
    let pDup = Object.values(pmap).filter(files => new Set(files).size !== files.length).length
    console.log(`  Productos con imágenes duplicadas internas: ${pDup}`)

    const uniqueSet = new Set(check.map(i => (i.image_url || '').replace(/^.*\//, '')))
    console.log(`\n  Primeras 15 — URLs únicas: ${uniqueSet.size}`)
    check.slice(0, 15).forEach(img => {
      const short = (img.image_url || '').replace(/^.*\//, '')
      console.log(`    img${img.id} prod=${img.product_id} ord=${img.display_order} pri=${img.is_primary} → ${short}`)
    })
  }

  console.log('\n========================================')
  console.log('✓ FIX IMAGES 2.0a COMPLETADO')
  console.log(`  product_images: ${updated} udpated | ${totalRecords - updated} ya correctas`)
  console.log(`  banners:        ${bUpd} updated`)
  console.log('========================================')
}

main().catch(console.error)
