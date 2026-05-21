'use strict'
const { createClient } = require('@supabase/supabase-js')
const { readFileSync } = require('fs')
const { join } = require('path')

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const CAT_DIR = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\uploads\\categories'
const BUCKET  = 'category-images'

// Los 5 archivos que TENÉS en tu carpeta categories/ (originales de Vercel Blob)
const ORIGINAL_LOCAL = [
  'category_LIBRERIA_1775487383090_mjwlukgh9.jpg',
  'category_STOCK_JUJUY_1775487378998_mjgzjiqq9.jpg',
  'category_LUCES_1775487380362_h8mf43aln.jpg',
  'category_COTILLON_LED_1775487377652_i0cfpaiu1.jpg',
  'category_COMBOS_DE_COTILLON_LED_1775487381749_umuotqclj.jpg',
]

const STORAGE_URL = (f) => `https://dqewyrotzskpbymecntt.supabase.co/storage/v1/object/public/${BUCKET}/${f}`

async function main() {
  console.log('=== RESTAURANDO DESDE uploads/categories/ (originales locales) ===\n')

  // 1. Subir los 5 archivos locales al bucket de Supabase
  console.log('Subiendo a Supabase Storage...\n')
  let uploaded = 0
  for (const f of ORIGINAL_LOCAL) {
    const buf = readFileSync(join(CAT_DIR, f))
    const r = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(f)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true'
        },
        body: buf
      }
    )
    if (r.status >= 200 && r.status < 300) {
      uploaded++
      console.log(`  ✓ ${f}  (${(buf.length/1024).toFixed(1)} KB)`)
    } else {
      console.log(`  ✗ ${f}: HTTP ${r.status}`)
    }
  }
  console.log(`\nSubidos: ${uploaded}\n`)

  // 2. Verificar con HTTP 200 cada archivo subido
  console.log('Verificación HTTP:')
  for (const f of ORIGINAL_LOCAL) {
    const url = STORAGE_URL(f)
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) })
    console.log(`  ${r.ok ? '✓' : '✗'} HTTP ${r.status} → ${f}`)
  }

  console.log('\nAhora ejecutá revert-categories.js para restaurar la BD')
  console.log('(Si tu archivo revert-categories.js tiene la lógica correcta)')
}
main().catch(console.error)
