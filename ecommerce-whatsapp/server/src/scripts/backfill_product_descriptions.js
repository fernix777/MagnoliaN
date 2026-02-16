import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

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

function formatNumber(value) {
  const n = Number(value)
  if (!n || isNaN(n)) return null
  return n.toFixed(0)
}

function buildDescription(product) {
  const lines = []
  const title = product.name || 'Producto'
  lines.push(title)

  const features = []

  if (product.stock > 0) {
    features.push('Stock disponible')
  } else {
    features.push('Consultar stock antes de comprar')
  }

  const base = formatNumber(product.base_price)
  if (base) {
    features.push(`Precio por unidad: $${base}`)
  }

  if (product.price_box) {
    const box = formatNumber(product.price_box)
    if (box && product.units_per_box) {
      features.push(`Caja de ${product.units_per_box} unidades: $${box}`)
    } else if (box) {
      features.push(`Caja: $${box}`)
    }
  }

  if (product.price_bundle) {
    const bundle = formatNumber(product.price_bundle)
    if (bundle && product.boxes_per_bundle && product.units_per_box) {
      const totalUnits = product.boxes_per_bundle * product.units_per_box
      features.push(`Bulto de ${totalUnits} unidades: $${bundle}`)
    } else if (bundle) {
      features.push(`Bulto: $${bundle}`)
    }
  }

  if (Array.isArray(product.sale_types) && product.sale_types.length > 0) {
    features.push(`Tipos de venta: ${product.sale_types.join(', ')}`)
  }

  if (product.has_colors) {
    features.push('Disponible en varios colores')
  }

  return [
    ...lines,
    ...features.map(f => `* ${f}`)
  ].join('\n')
}

async function run() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, base_price, stock, units_per_box, boxes_per_bundle, price_box, price_bundle, has_colors, sale_types')
    .order('id', { ascending: true })

  if (error) {
    console.error('Error obteniendo productos:', error.message)
    process.exit(1)
  }

  let updated = 0

  for (const p of products || []) {
    const current = (p.description || '').trim()
    if (current) {
      continue
    }
    const desc = buildDescription(p)
    const { error: updErr } = await supabase
      .from('products')
      .update({ description: desc })
      .eq('id', p.id)
    if (updErr) {
      console.error(`Error actualizando descripción de producto ${p.id}:`, updErr.message)
      continue
    }
    updated++
  }

  console.log(`Descripciones generadas para ${updated} productos`)
}

run()

