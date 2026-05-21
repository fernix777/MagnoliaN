import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  // List policies on 'products'
  console.log('=== Policies on table products ===')
  const { data: policies, error: pErr } = await supabase
    .rpc('get_policies', { p_table_name: 'products' })
    .catch(e => ({ error: e.message }))

  // If RPC doesn't exist, create an RPC or query via another path
  if (pErr || !policies) {
    console.log('RPC get_policies no disponible, intentando otra via...')
    // Try to query via PostgREST with a known proxy function
    // Or try running raw SQL via the API
    const sql = `
      SELECT policyname, cmd, permissive, roles, CASE 
        WHEN qual IS NULL THEN '<no qual>'
        ELSE SUBSTRING(qual, 1, 100)
      END as qual_preview,
      CASE 
        WHEN with_check_opt IS NULL THEN '<no check>'
        ELSE SUBSTRING(with_check_opt, 1, 100)
      END as check_preview
      FROM pg_policies 
      WHERE tablename = 'products' 
      ORDER BY policyname;
    `
    // Use PostgREST to check via the table api (won't work for pg_policies)
    // Use the mcp/sql endpoint instead
    console.log('  No hay RPC disponible. Ejecuta manualmente en Supabase SQL Editor:')
    console.log('  SELECT * FROM pg_policies WHERE tablename = \'products\';')
    return
  }

  console.log(JSON.stringify(policies, null, 2))
}

main().catch(console.error)
