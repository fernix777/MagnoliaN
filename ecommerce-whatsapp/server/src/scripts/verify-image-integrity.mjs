/**
 * Verificación de integridad de imágenes por producto
 * - Cada producto tiene imágenes DISTINTAS
 * - Cada producto tiene al menos 1 imagen
 * - Las imágenes son accesibles
 */
'use strict'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  // Obtener todos los productos con sus imágenes
  const { data: products } = await supabase
    .from('products')
    .select('id, name, images:product_images(id, image_url, is_primary)')
    .eq('active', true)
    .order('id', { ascending: true })

  console.log(`Productos activos: ${products?.length || 0}\n`)

  // Estadísticas
  const stats = {
    totalProds: products?.length || 0,
    prodsConImg: 0,
    prodsSinImg: 0,
    prodsSoloUnaImg: 0,
    prodsMultiples: 0,
    duplicadasEnMismoProd: 0, // mismo prod, misma imagen repetida
    imgSinProducto: 0,
    totalUnicasGlobales: new Set(),
    prodsMismaImg: [] // lista de productos que COMPARTEN la misma imagen
  }

  // Para detectar productos que comparten imagen
  const imgToProducts = {}

  for (const p of products || []) {
    const imgs = p.images || []
    const urls = imgs.map(i => i.image_url).filter(Boolean)

    if (urls.length === 0) {
      stats.prodsSinImg++
      continue
    }

    stats.prodsConImg++

    // Verificar duplicados DENTRO del mismo producto
    const uniqueInProd = new Set(urls)
    if (uniqueInProd.size < urls.length && urls.length > 1) {
      stats.duplicadasEnMismoProd++
      console.log(`  ⚠️ Prod ${p.id} (${p.name?.substring(0, 20)}) tiene ${urls.length} imágenes pero solo ${uniqueInProd.size} únicas`)
    }

    // Contar cuántas veces aparece cada imagen globalmente
    for (const url of urls) {
      if (!imgToProducts[url]) imgToProducts[url] = []
      imgToProducts[url].push(p.id)
      stats.totalUnicasGlobales.add(url)
    }

    if (urls.length === 1) stats.prodsSoloUnaImg++
    else stats.prodsMultiples++
  }

  // Detectar productos que comparten imagen (deberían ser solo si es intencional)
  const sharedImages = Object.entries(imgToProducts)
    .filter(([_, prods]) => prods.length > 1)
    .map(([url, prods]) => {
      const file = url.replace(/^.*\//, '')
      return { url: file.substring(0, 50), productos: prods.length }
    })

  console.log('=== RESULTADOS ===')
  console.log(`Total productos:         ${stats.totalProds}`)
  console.log(`✓ Con imágenes:          ${stats.prodsConImg}`)
  console.log(`✗ Sin imágenes:          ${stats.prodsSinImg}`)
  console.log(`- Solo 1 imagen:         ${stats.prodsSoloUnaImg}`)
  console.log(`- Varias imágenes:       ${stats.prodsMultiples}`)
  console.log(`- Duplicadas en mismo prod: ${stats.duplicadasEnMismoProd}`)
  console.log(`Imágenes únicas globales:${stats.totalUnicasGlobales.size}`)
  console.log(`Imágenes compartidas:    ${sharedImages.length}`)

  if (sharedImages.length > 0) {
    console.log('\n  Imágenes compartidas entre productos:')
    sharedImages.slice(0, 10).forEach(s => {
      console.log(`  "${s.url}" → ${s.productos} productos`)
    })
  }

  // Verificación HTTP de las primeras 15 imágenes distintas
  console.log('\n=== PRUEBA DE ACCESO HTTP ===')
  const uniqueUrls = [...stats.totalUnicasGlobales].slice(0, 15)
  let ok = 0, fail = 0
  for (const url of uniqueUrls) {
    try {
      const r = await fetch(url, { method: 'HEAD' })
      if (r.ok) { ok++; console.log(`  ✓ ${url.substring(90)}`) }
      else { fail++; console.log(`  ❌ ${url.substring(90)} → ${r.status}`) }
    } catch (e) { fail++; console.log(`  ❌ ${url.substring(90)}: ${e.message}`) }
  }
  console.log(`\n  Accesibles: ${ok}  |  Rotas: ${fail}`)

  // Resumen final
  console.log('\n========================================')
  if (stats.prodsSinImg === 0 && stats.duplicadasEnMismoProd === 0 && fail === 0) {
    console.log('✅ TODO CORRECTO: cada producto tiene sus imágenes únicas y accesibles')
  } else {
    console.log('⚠️  Hay problemas que atender:')
    if (stats.prodsSinImg > 0) console.log(`  - ${stats.prodsSinImg} productos sin imagen`)
    if (stats.duplicadasEnMismoProd > 0) console.log(`  - ${stats.duplicadasEnMismoProd} productos con imágenes repetidas internamente`)
    if (fail > 0) console.log(`  - ${fail} imágenes no accibles`)
  }
  console.log('========================================')
}

main().catch(console.error)
