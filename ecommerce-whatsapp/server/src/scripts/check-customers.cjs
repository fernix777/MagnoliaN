'use strict'
const { createClient } = require('@supabase/supabase-js')
const { readFileSync } = require('fs')

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'
const ANON_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDA0NDAsImV4cCI6MjA5NDY3NjQ0MH0.23oKKutBsAHJG8Pz-FkP53ArsKVjY_Kq9wm9K4oGpyE'

const admin = createClient(SUPABASE_URL, SERVICE_KEY)
const anon = createClient(SUPABASE_URL, ANON_KEY)

const CSV1 = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\Supabase Snippet Fetch Profile Contact Details.csv'
const CSV2 = 'C:\\Users\\Tienda Ssh\\Downloads\\MagnoliaN-main\\MagnoliaN-fresh\\ecommerce-whatsapp\\Supabase Snippet Fetch Profile Contact Details (1).csv'

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

function normalizePhone(p) {
  if (!p) return null
  return p.replace(/\D/g, '')
}

function normalizeEmail(e) {
  if (!e) return null
  return e.toLowerCase().trim()
}

async function main() {
  console.log('=== DIAGNÓSTICO CLIENTES CSV → BD ===\n')

  // 1. Parse CSVs
  const csv1Raw = readFileSync(CSV1, 'utf-8')
  const csv2Raw = readFileSync(CSV2, 'utf-8')
  const csv1 = parseCSV(csv1Raw)
  const csv2 = parseCSV(csv2Raw)

  console.log(`CSV 1 (Fetch Profile): ${csv1.length} filas — columnas: ${Object.keys(csv1[0]||{}).join(', ')}`)
  console.log(`CSV 2 (List Contact):  ${csv2.length} filas — columnas: ${Object.keys(csv2[0]||{}).join(', ')}\n`)

  // Build unified client list
  // CSV1: email, full_name, phone, created_at, last_sign_in_at
  // CSV2: email, full_name, phone, address, city

  // Merge: CSV2 has more fields (address, city); CSV1 has auth dates
  const allEmails = {}
  csv1.forEach(row => {
    const email = normalizeEmail(row.email)
    if (!email) return
    allEmails[email] = { ...row, _source: 'csv1' }
  })
  csv2.forEach(row => {
    const email = normalizeEmail(row.email)
    if (!email) return
    if (allEmails[email]) {
      // Merge: prefer csv2 fields where csv1 is null
      allEmails[email] = { ...allEmails[email], ...row, _source: 'merged' }
    } else {
      allEmails[email] = { ...row, _source: 'csv2' }
    }
  })

  const totalClients = Object.keys(allEmails).length
  console.log(`Clientes únicos combinados: ${totalClients}\n`)

  // 2. Get current auth users from Supabase
  console.log('Consultando usuarios actuales en Supabase Auth...')
  const { data: authUsers, error: authErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (authErr) { console.error('Error auth:', authErr.message); process.exit(1) }
  console.log(`  Usuarios en Auth: ${authUsers.users.length}\n`)

  // Get customers from customers table
  console.log('Consultando tabla `customers` de Supabase...')
  const { data: dbCustomers, error: custErr } = await admin
    .from('customers').select('id, email, full_name, phone, address, city, created_at')
  if (custErr) { console.error('Error customers:', custErr.message) }
  console.log(`  Records in 'customers' table: ${dbCustomers?.length || 0}\n`)

  // Build sets
  const authEmailSet = new Set(authUsers.users.map(u => normalizeEmail(u.email)).filter(Boolean))
  const custEmailSet = new Set((dbCustomers || []).map(c => normalizeEmail(c.email)).filter(Boolean))

  // 3. Classify
  const both   = []  // in Auth AND customers
  const authOnly = [] // in Auth only
  const custOnly = [] // in customers only
  const neither = []  // nowhere

  for (const [email, row] of Object.entries(allEmails)) {
    const inAuth = authEmailSet.has(email)
    const inCust = custEmailSet.has(email)
    if (inAuth && inCust) both.push({ email, ...row })
    else if (inAuth) authOnly.push({ email, ...row })
    else if (inCust) custOnly.push({ email, ...row })
    else neither.push({ email, ...row })
  }

  console.log('CLASIFICACIÓN:')
  console.log(`  ✅ En Auth + customers  : ${both.length}`)
  console.log(`  🔑 Solo en Auth          : ${authOnly.length}`)
  console.log(`  📋 Solo en customers    : ${custOnly.length}`)
  console.log(`  ❓ En ninguna parte     : ${neither.length}\n`)

  // Show neither (need migration)
  if (neither.length > 0) {
    console.log('=== CLIENTES POR MIGRAR ===')
    neither.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.email} | phone=${c.phone || 'N/A'} | address=${c.address || (c.address_raw || '')} | city=${c.city || ''}`)
    })
    console.log(`\nTotal a migrar: ${neither.length}`)
  }

  if (custOnly.length > 0) {
    console.log('\n=== SOLO EN CUSTOMERS (sin Auth) ===')
    custOnly.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.email} | phone=${c.phone || 'N/A'}`)
    })
  }

  console.log('\n=== MUESTRA DE BOTH (primeros 5) ===')
  both.slice(0, 5).forEach(c => console.log(`  ${c.email} | phone=${c.phone}`))
}

main().catch(console.error)
