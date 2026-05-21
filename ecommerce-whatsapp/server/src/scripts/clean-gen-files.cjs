'use strict'

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'
const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const BUCKET = 'category-images'

const toDelete = [
  'category_COTILLON_1779161109602_orig.jpg',
  'category_REGALERIA_1779161109602_orig.jpg',
  'category_COTILLON_1775487408864_img.jpg',
  'category_REGALERIA_1775487408864_img.jpg',
  'category_COTILLON_LED_1775487408864_img.jpg',
  'category_LIBRERIA_1775487408864_img.jpg',
  'category_LUCES_1775487408864_img.jpg',
  'category_STOCK_JUJUY_1775487408864_img.jpg',
  'category_COMBOS_DE_COTILLON_LED_1775487408864_img.jpg',
]

async function main() {
  console.log('=== Eliminando archivos generados del bucket ===\n')
  for (const f of toDelete) {
    const r = await fetch(
      new URL(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(f)}`),
      { method: 'DELETE', headers: { Authorization: `Bearer ${SERVICE_KEY}` } }
    )
    console.log(`${r.status === 200 || r.status === 204 ? '✓' : '✗'} ${r.status} ${f}`)
  }

  // Listar bucket final
  console.log('\nBucket final:')
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data } = await supabase.storage.from(BUCKET).list('', { limit: 100 })
  (data || []).forEach(f => console.log(`  ${f.name}`))
  console.log(`\nTotal: ${(data || []).length} archivos`)
}
main().catch(console.error)
