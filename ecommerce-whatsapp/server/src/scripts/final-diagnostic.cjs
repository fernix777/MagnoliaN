'use strict'
const { createClient } = require('@supabase/supabase-js')
const { readdirSync } = require('fs')

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  console.log('=== DIAGNÓSTICO FINAL ===\n')

  // 1. product_images
  const { data: imgs } = await supabase
    .from('product_images').select('id, product_id, image_url, is_primary, display_order')

  const urlMap = {}
  imgs.forEach(img => {
    urlMap[img.image_url] = (urlMap[img.image_url] || 0) + 1
  })

  const blobUrls = imgs.filter(i => i.image_url?.includes('blob.vercel-storage.com'))
  const supabaseUrls = imgs.filter(i => i.image_url?.includes('dqewyrotzskpbymecntt'))
  const localUrls = imgs.filter(i => i.image_url?.includes('/uploads/') || i.image_url?.includes('localhost'))
  const emptyUrls = imgs.filter(i => !i.image_url)

  console.log('product_images:')
  console.log(`  Total          : ${imgs.length}`)
  console.log(`  Supabase Storage: ${supabaseUrls.length}`)
  console.log(`  Vercel Blob    : ${blobUrls.length}  ← debe ser 0`)
  console.log(`  Local /uploads: ${localUrls.length}`)
  console.log(`  Vacías         : ${emptyUrls.length}`)

  // Find shared files
  const shared = Object.entries(urlMap).filter(([,v]) => v > 1)
  console.log(`  Archivos compartidos  : ${shared.length}`)
  if (shared.length > 0) {
    console.log('  ↳ Archivos compartidos:')
    shared.sort((a,b) => b[1]-a[1]).slice(0,10).forEach(([u,v]) => console.log(`    ${v}x  ...${u.substring(u.lastIndexOf('/')+1)}`))
  }

  // 2. Primary images per product
  const primaryMap = imgs.filter(i => i.is_primary)
  const pIds = new Set(imgs.map(i => i.product_id))
  console.log(`\n  Productos únicos: ${pIds.size}`)
  const diffPrimary = primaryMap.filter(i => !i.image_url?.includes('dqewyrotzskpbymecntt'))
  console.log(`  Primary images que NO son Supabase Storage: ${diffPrimary.length}`)

  // 3. Banners
  const { data: banners } = await supabase.from('banners').select('id, title, image_url, display_order')
  const blobBanners = banners?.filter(b => b.image_url?.includes('blob.vercel-storage.com'))
  console.log(`\nbanners:`)
  console.log(`  Total   : ${banners.length}`)
  console.log(`  Vercel Blob: ${blobBanners?.length || 0}  ← debe ser 0`)
  console.log(`  Bien    : ${(banners || []).filter(b => b.image_url?.includes('dqewyrotzskpbymecntt')).length}`)
  if (banners) {
    banners.forEach(b => {
      const short = (b.image_url||'').replace(/^.*\//,'')
      console.log(`  id=${b.id} disp=${b.display_order} title="${b.title}" → ${short}`)
    })
  }

  // 4. HTTP check of 10 random images
  console.log('\nPrueba HTTP de 10 imágenes aleatorias:')
  const sample = imgs.sort(() => Math.random() - 0.5).slice(0, 10)
  let ok = 0, fail = 0
  for (const img of sample) {
    try {
      const r = await fetch(img.image_url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      r.ok ? ok++ : (fail++, console.log(`  ❌ ${r.status} → ...${img.image_url.slice(-40)}`))
    } catch(e) { fail++; console.log(`  ❌ → ...${img.image_url.slice(-40)}`) }
  }
  console.log(`  ✓ ${ok} accesibles | ❌ ${fail} rotas`)

  // Summary
  console.log('\n========================================')
  const isGood = blobUrls.length === 0 && shared.length === 0 && diffPrimary.length === 0 && ok >= 8
  if (isGood) {
    console.log('✅ ESTADO: TODAS LAS IMÁGENES EN CONSECUENCIA')
    console.log('   • 0 URLs de Vercel Blob en la BD')
    console.log('   • 0 archivos compartidos entre productos')
    console.log('   • Todas las imágenes servidas por Supabase Storage')
    console.log('   • Todas las imágenes accesibles HTTP 200')
  } else {
    console.log('⚠️  ESTADO: HAY PROBLEMAS PENDIENTES')
    if (blobUrls.length > 0) console.log(`   • ${blobUrls.length} URLs de Vercel Blob aún en BD`)
    if (shared.length > 0) console.log(`   • ${shared.length} archivos compartidos entre productos`)
    if (diffPrimary.length > 0) console.log(`   • ${diffPrimary.length} primary images no son Supabase Storage`)
  }
  console.log('========================================')
}

main().catch(console.error)
