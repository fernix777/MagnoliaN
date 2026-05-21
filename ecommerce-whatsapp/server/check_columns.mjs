import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  console.log('=== CHECKING COLUMNS OF products TABLE ===\n')

  // We can query information_schema.columns to see if height_cm and others exist
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching products:', error)
    return
  }

  if (data && data.length > 0) {
    const product = data[0]
    console.log('Sample product keys:', Object.keys(product))
    console.log('Does weight_g exist?', 'weight_g' in product)
    console.log('Does height_cm exist?', 'height_cm' in product)
    console.log('Does width_cm exist?', 'width_cm' in product)
    console.log('Does length_cm exist?', 'length_cm' in product)
  } else {
    console.log('No products found to inspect keys directly.')
  }

  // Let's run a query to information_schema.columns using RPC if available, or just check what columns we can fetch.
  // Wait, if height_cm is in the schema cache error, PostgREST doesn't see it.
}

main().catch(console.error)
