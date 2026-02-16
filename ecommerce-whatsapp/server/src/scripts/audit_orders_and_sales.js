import { createClient } from '@supabase/supabase-js'
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

async function countOrders() {
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count || 0
}

async function countOrderItems() {
  const { count, error } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count || 0
}

async function salesSummary(days = 30) {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString()
  const { data, error } = await supabase
    .from('order_items')
    .select('price, quantity, created_at')
    .gte('created_at', since)
  if (error) throw error
  let total = 0
  for (const it of data || []) {
    const p = Number(it.price || 0)
    const q = Number(it.quantity || 0)
    total += p * q
  }
  return { days, total, count: (data || []).length }
}

async function run() {
  try {
    const o = await countOrders()
    const oi = await countOrderItems()
    console.log(`Órdenes: ${o}, Items: ${oi}`)
    const sum = await salesSummary(30)
    console.log(`Ventas últimos ${sum.days} días: $${sum.total.toFixed(2)} (${sum.count} items)`)
  } catch (e) {
    console.error('Audit error:', e.message)
  }
}

run()
