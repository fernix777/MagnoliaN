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
  console.error('Faltan credenciales SUPABASE_URL/SUPABASE_SERVICE_KEY en server/.env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function productExists(id) {
  const { data, error } = await supabase.from('products').select('id').eq('id', id).single()
  if (error && error.code !== 'PGRST116') return false
  return !!data
}

async function upsertProductFromOrderHint(hint) {
  const {
    product_id,
    product_name,
    price
  } = hint

  const name = product_name || `Producto ${product_id ?? ''}`.trim()
  const slug = slugify(name)
  const base_price = Number(price || 0)

  const productData = {
    id: product_id ?? undefined,
    name,
    slug,
    description: '',
    base_price: base_price,
    stock: 100,
    category_id: null,
    featured: false,
    active: true,
    units_per_box: 0,
    boxes_per_bundle: 0,
    price_box: null,
    price_bundle: null,
    has_colors: false,
    sale_types: ['unidad']
  }

  if (product_id) {
    const exists = await productExists(product_id)
    if (exists) {
      return { id: product_id }
    }
  }

  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select('id')
    .single()

  if (error) {
    console.error('Error creando producto:', error.message)
    return null
  }

  return data
}

async function attachImages(productId) {
  const folder = `products/${productId}`
  const { data: files, error } = await supabase
    .storage
    .from('product-images')
    .list(folder, { limit: 100 })

  if (error) {
    console.log(`No se pudo listar imágenes para ${folder}:`, error.message)
    return
  }

  if (!files || files.length === 0) {
    console.log(`Sin imágenes en storage para product ${productId}`)
    return
  }

  const records = files
    .filter(f => f?.name)
    .map((f, idx) => {
      const pathInBucket = `${folder}/${f.name}`
      const { data: pub } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(pathInBucket)
      return {
        product_id: productId,
        image_url: pub?.publicUrl,
        display_order: idx,
        is_primary: idx === 0
      }
    })
    .filter(r => r.image_url)

  if (records.length === 0) {
    console.log(`No se generaron registros de imagen válidos para ${productId}`)
    return
  }

  const { error: insertErr } = await supabase
    .from('product_images')
    .insert(records)

  if (insertErr) {
    console.error('Error insertando imágenes:', insertErr.message)
  } else {
    console.log(`Imágenes vinculadas a producto ${productId}: ${records.length}`)
  }
}

async function recover() {
  console.log('Iniciando recuperación de productos desde order_items y Storage...')

  const { data: items, error } = await supabase
    .from('order_items')
    .select('product_id, product_name, price, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error leyendo order_items:', error.message)
    process.exit(1)
  }

  const byProductId = new Map()
  const byNameOnly = new Map()

  for (const it of items || []) {
    if (it.product_id) {
      if (!byProductId.has(it.product_id)) {
        byProductId.set(it.product_id, { product_id: it.product_id, product_name: it.product_name, price: it.price })
      }
    } else if (it.product_name) {
      const key = slugify(it.product_name)
      if (!byNameOnly.has(key)) {
        byNameOnly.set(key, { product_id: null, product_name: it.product_name, price: it.price })
      }
    }
  }

  // Primero, productos con ID conocido
  for (const [pid, hint] of byProductId.entries()) {
    const product = await upsertProductFromOrderHint(hint)
    if (product?.id) {
      await attachImages(product.id)
    }
  }

  // Luego, productos por nombre (sin ID)
  for (const [, hint] of byNameOnly.entries()) {
    await upsertProductFromOrderHint(hint)
    // Sin ID previo, no podemos inferir carpeta de imágenes en Storage
  }

  // Reporte final
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  const { count: imagesCount } = await supabase
    .from('product_images')
    .select('*', { count: 'exact', head: true })

  console.log(`Recuperación completa. Productos: ${productsCount ?? 0}, Imágenes: ${imagesCount ?? 0}`)
}

recover()
