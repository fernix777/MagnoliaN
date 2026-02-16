import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY en server/.env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length === 0) return []
  const header = lines[0].split(',').map(h => h.trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i]
    if (!raw.trim()) continue
    // Simple CSV parsing (no quoted commas). For quoted fields, pre-clean file or use ; as separator
    const cols = raw.split(',').map(c => c.trim())
    const obj = {}
    header.forEach((h, idx) => {
      obj[h] = cols[idx] ?? ''
    })
    rows.push(obj)
  }
  return rows
}

async function importOrders(ordersCsvPath, itemsCsvPath) {
  if (!fs.existsSync(ordersCsvPath)) {
    console.error('No existe archivo:', ordersCsvPath)
    process.exit(1)
  }
  if (!fs.existsSync(itemsCsvPath)) {
    console.error('No existe archivo:', itemsCsvPath)
    process.exit(1)
  }

  const ordersCsv = fs.readFileSync(ordersCsvPath, 'utf8')
  const itemsCsv = fs.readFileSync(itemsCsvPath, 'utf8')
  const orders = parseCSV(ordersCsv)
  const items = parseCSV(itemsCsv)

  console.log(`Importando ${orders.length} órdenes y ${items.length} items...`)

  const orderIdMap = new Map()
  let created = 0

  for (const o of orders) {
    const idCsv = o.id ? Number(o.id) : undefined
    const payload = {
      user_id: o.user_id || null,
      customer_info: safeJson(o.customer_info) || buildCustomerInfoFromFlat(o),
      total: Number(o.total || 0),
      status: (o.status || 'pending'),
      payment_method: (o.payment_method || 'whatsapp'),
    }
    if (o.created_at) payload.created_at = o.created_at
    if (o.updated_at) payload.updated_at = o.updated_at

    // Try insert with id if provided
    let orderRes
    if (idCsv) {
      orderRes = await supabase.from('orders').insert([{ id: idCsv, ...payload }]).select().single()
      if (!orderRes.error) {
        orderIdMap.set(String(o.id), orderRes.data.id)
        created++
        continue
      }
    }
    // Insert without id
    orderRes = await supabase.from('orders').insert([payload]).select().single()
    if (orderRes.error) {
      console.error('Error creando orden:', orderRes.error.message)
      continue
    }
    const newId = orderRes.data.id
    created++
    if (o.id) orderIdMap.set(String(o.id), newId)
  }

  console.log(`Órdenes creadas: ${created}`)

  // Insert order_items
  const batch = []
  for (const it of items) {
    const srcOrderId = String(it.order_id || '').trim()
    const targetOrderId = srcOrderId ? (orderIdMap.get(srcOrderId) || Number(srcOrderId)) : null
    if (!targetOrderId) {
      console.warn('Item omitido: order_id no mapeado', it)
      continue
    }
    batch.push({
      order_id: targetOrderId,
      product_id: it.product_id ? Number(it.product_id) : null,
      quantity: Number(it.quantity || 1),
      price: Number(it.price || 0),
      product_name: it.product_name || it.name || '',
      variant_info: safeJson(it.variant_info) || null,
    })
  }

  if (batch.length > 0) {
    const { error } = await supabase.from('order_items').insert(batch)
    if (error) {
      console.error('Error insertando items:', error.message)
    } else {
      console.log(`Items insertados: ${batch.length}`)
    }
  } else {
    console.log('No hay items para insertar')
  }
}

function safeJson(str) {
  if (!str) return null
  try { return JSON.parse(str) } catch { return null }
}

function buildCustomerInfoFromFlat(o) {
  const info = {}
  const name = o.customer_name || o.name
  const phone = o.customer_phone || o.phone
  const addr = o.address || o.customer_address
  if (name) info.name = name
  if (phone) info.phone = phone
  if (addr) info.address = addr
  if (o.instructions) info.instructions = o.instructions
  return Object.keys(info).length ? info : { source: 'csv' }
}

async function main() {
  const [ordersCsvPath, itemsCsvPath] = process.argv.slice(2)
  if (!ordersCsvPath || !itemsCsvPath) {
    console.log('Uso:')
    console.log('  node src/scripts/import_orders_from_csv.js <ruta_orders.csv> <ruta_order_items.csv>')
    console.log('CSV de órdenes: id,user_id,total,status,payment_method,customer_info,created_at,updated_at,...')
    console.log('CSV de items: order_id,product_id,product_name,quantity,price,variant_info')
    process.exit(0)
  }
  await importOrders(ordersCsvPath, itemsCsvPath)
}

main()
