'use strict'
const { createClient } = require('@supabase/supabase-js')
const { readFileSync, writeFileSync } = require('fs')

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const CSV1 = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\Supabase Snippet Fetch Profile Contact Details.csv'
const CSV2 = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\Supabase Snippet Fetch Profile Contact Details (1).csv'
const OUT  = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\importar_clientes_manual.sql'

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const vals = line.split(',')
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim().replace(/^"|"$/g, '') })
    return obj
  })
}

function escSQL(val) {
  // Returns SQL-safe literal (proper NULL for empty/null)
  if (val === null || val === undefined || val === '') return 'NULL'
  return "'" + String(val).replace(/'/g, "''") + "'"
}

function normalizeEmail(e) { return (e || '').toLowerCase().trim() }

async function main() {
  console.log('=== GENERANDO SQL CORREGIDO (111 clientes) ===\n')

  const csv1 = parseCSV(readFileSync(CSV1, 'utf-8'))
  const csv2 = parseCSV(readFileSync(CSV2, 'utf-8'))

  // Merge: unify by email, prefer csv2 for address/city
  const merged = {}
  csv1.forEach(row => {
    const email = normalizeEmail(row.email)
    if (!email) return
    merged[email] = { ...row, _source: 'csv1' }
  })
  csv2.forEach(row => {
    const email = normalizeEmail(row.email)
    if (!email) return
    if (merged[email]) {
      merged[email] = { ...merged[email], address: row.address || merged[email].address, city: row.city || merged[email].city, _source: 'merged' }
    } else {
      merged[email] = { ...row, _source: 'csv2' }
    }
  })

  const clients = Object.entries(merged)
    .filter(([email, _]) => email)
    .map(([email, row]) => ({
      email,
      full_name: (row.full_name && row.full_name !== 'null') ? row.full_name : null,
      phone:     (row.phone     && row.phone     !== 'null') ? row.phone     : null,
      address:   (row.address   && row.address   !== 'null') ? row.address   : null,
      city:      (row.city      && row.city      !== 'null') ? row.city      : null,
    }))

  console.log(`Clientes únicos: ${clients.length}`)

  const L = []
  L.push('-- ============================================')
  L.push('-- IMPORTAR CLIENTES DESDE CSV — 111 registros')
  L.push(`-- Generado: ${new Date().toISOString()}`)
  L.push('-- ============================================\n')

  // ── 1. CREATE TABLE ──────────────────────────────────────────────────────
  L.push('-- 1. Tabla customers')
  L.push(`CREATE TABLE IF NOT EXISTS customers (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    full_name   VARCHAR(255),
    phone       VARCHAR(50),
    address     TEXT,
    city        VARCHAR(100),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    source      VARCHAR(50) DEFAULT 'csv_import'
  );\n`)

  L.push('CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);\n')

  L.push('ALTER TABLE customers ENABLE ROW LEVEL SECURITY;\n')

  // DROP POLICY primero, luego CREATE — sin IF NOT EXISTS en CREATE POLICY
  L.push(`DROP POLICY IF EXISTS "Admin customers access" ON customers;`)

  L.push(`CREATE POLICY "Admin customers access" ON customers
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
          AND auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    );
  ALTER POLICY "Admin customers access" ON customers TO authenticated;
  ALTER POLICY "Admin customers access" ON customers USING (auth.uid() IS NOT NULL);
\n`)

  // ── 2. INSERT batches ────────────────────────────────────────────────────
  L.push('-- 2. Insertar clientes\n')

  const BATCH = 50
  let batchNum = 1
  for (let i = 0; i < clients.length; i += BATCH) {
    const batch = clients.slice(i, i + BATCH)
    const first = i + 1
    const last  = Math.min(i + BATCH, clients.length)

    L.push(`-- Batch ${batchNum} (clientes ${first}-${last})`)
    const rows = batch.map(c =>
      `(${escSQL(c.email)}, ${escSQL(c.full_name)}, ${escSQL(c.phone)}, ${escSQL(c.address)}, ${escSQL(c.city)}, NOW())`
    ).join(',\n    ')
    L.push(`INSERT INTO customers (email, full_name, phone, address, city, source) VALUES\n    ${rows}\nON CONFLICT (email) DO UPDATE SET
      email      = EXCLUDED.email,
      full_name  = EXCLUDED.full_name,
      phone      = EXCLUDED.phone,
      address    = EXCLUDED.address,
      city       = EXCLUDED.city,
      source     = EXCLUDED.source,
      updated_at = NOW();\n`)
    batchNum++
  }

  // ── 3. Verificación ──────────────────────────────────────────────────────
  L.push('-- 3. Verificación')
  L.push('SELECT COUNT(*) AS total_clientes FROM customers;')
  L.push('SELECT email, full_name, phone, address, city, created_at')
  L.push('FROM customers ORDER BY created_at DESC LIMIT 15;')

  const sql = L.join('\n')
  writeFileSync(OUT, sql, 'utf-8')

  const lines = sql.split(/\r?\n/).length
  console.log(`✓ Escrito: ${OUT} (${sql.length} chars / ${lines} líneas)\n`)
}

main().catch(console.error)
