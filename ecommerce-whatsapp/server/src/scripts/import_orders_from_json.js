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

function parseJsonFile(filePath) {
  const txt = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(txt)
}

function toNumber(v) {
  if (v === null || v === undefined) return 0
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function buildCustomerInfo(row) {
  let info = null
  if (row.customer_info) {
    try { info = JSON.parse(row.customer_info) } catch {}
  }
  if (!info) {
    info = {
      firstName: row.customer_name?.split(' ')?.[0] || '',
      lastName: row.customer_name?.split(' ')?.slice(1)?.join(' ') || '',
      email: row.customer_email || '',
      phone: row.customer_phone || '',
      address: row.shipping_address || '',
      city: row.shipping_city || '',
      state: row.shipping_state || '',
      zipCode: row.shipping_zip || '',
      country: row.shipping_country || 'AR',
      instructions: row.special_instructions || ''
    }
  }
  if (row.order_id) info.order_code = row.order_id
  return info
}

function parseItems(row) {
  let items = []
  if (row.items) {
    try {
      const parsed = JSON.parse(row.items)
      if (Array.isArray(parsed)) items = parsed
    } catch {}
  }
  return items
}

async function importFromJson(jsonPath) {
  if (!fs.existsSync(jsonPath)) {
    console.error('No existe archivo:', jsonPath)
    process.exit(1)
  }
  const rows = parseJsonFile(jsonPath)
  if (!Array.isArray(rows)) {
    console.error('El JSON debe ser un array de órdenes')
    process.exit(1)
  }
  let ordersCreated = 0
  let itemsCreated = 0
  for (const row of rows) {
    const payload = {
      user_id: row.user_id || null,
      customer_info: buildCustomerInfo(row),
      total: toNumber(row.total),
      status: 'pending',
      payment_method: row.payment_method || 'whatsapp'
    }
    const ins = await supabase.from('orders').insert([payload]).select().single()
    if (ins.error) {
      console.error('Error creando orden:', ins.error.message)
      continue
    }
    const orderId = ins.data.id
    ordersCreated++
    const items = parseItems(row)
    if (items.length) {
      const toInsert = items.map(it => ({
        order_id: orderId,
        product_id: it.id || null,
        quantity: toNumber(it.quantity || 1),
        price: toNumber(it.price),
        product_name: it.name || '',
        variant_info: null
      }))
      const insItems = await supabase.from('order_items').insert(toInsert)
      if (insItems.error) {
        console.error('Error creando items:', insItems.error.message)
      } else {
        itemsCreated += toInsert.length
      }
    }
  }
  console.log(`Órdenes importadas: ${ordersCreated}, items importados: ${itemsCreated}`)
}

async function main() {
  const [argPath] = process.argv.slice(2)
  const defaultPath = 'e:\\Magnolia12\\ecommerce_orders_rows (1).json'
  const jsonPath = argPath || defaultPath
  await importFromJson(jsonPath)
}

main()
