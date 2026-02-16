import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
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

function extract(field, itemXml) {
  const re = new RegExp(`<g:${field}>([\\s\\S]*?)<\\/g:${field}>`, 'i')
  const m = itemXml.match(re)
  return m ? m[1].trim() : null
}

function parseItems(xml) {
  const items = []
  const parts = xml.split('<item>').slice(1)
  for (const part of parts) {
    const itemXml = part.split('</item>')[0]
    const id = extract('id', itemXml)
    const title = extract('title', itemXml)
    const priceStr = extract('price', itemXml)
    const availability = extract('availability', itemXml)
    const link = extract('link', itemXml)
    const productType = extract('product_type', itemXml)
    const imageLink = extract('image_link', itemXml)
    let price = 0
    if (priceStr) {
      const num = priceStr.replace(' ARS', '').replace(',', '').trim()
      price = Number(num)
    }
    items.push({
      id: id ? Number(id) : undefined,
      title,
      price,
      availability,
      link,
      productType,
      imageLink
    })
  }
  return items
}

async function getOrCreateCategory(name) {
  if (!name) return null
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('name', name)
    .maybeSingle()
  if (existing?.id) return existing.id
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug: slugify(name), active: true })
    .select('id')
    .single()
  if (error) {
    console.error('Error creando categoría', name, error.message)
    return null
  }
  return data.id
}

async function upsertProductFromFeed(it) {
  const name = it.title || `Producto ${it.id ?? ''}`.trim()
  let slug = null
  if (it.link && it.link.includes('/producto/')) {
    slug = it.link.split('/producto/')[1]?.split(/[/?#]/)[0]
  }
  if (!slug) slug = slugify(name)
  const stock = it.availability === 'in stock' ? 100 : 0
  // Si ya existe por id o slug, devolver id
  if (it.id) {
    const { data: byId } = await supabase.from('products').select('id').eq('id', it.id).maybeSingle()
    if (byId?.id) return byId.id
  } else if (slug) {
    const { data: bySlug } = await supabase.from('products').select('id').eq('slug', slug).maybeSingle()
    if (bySlug?.id) return bySlug.id
  }
  const productData = {
    id: it.id ?? undefined,
    name,
    slug,
    description: '',
    base_price: Number(it.price || 0),
    stock,
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
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select('id')
    .single()
  if (error) {
    console.error('Error creando producto desde feed:', name, error.message)
    return null
  }
  return data.id
}

async function attachFeedImage(productId, imageUrl) {
  if (!imageUrl) return
  // Evitar duplicado si ya existe imagen principal
  const { data: existing } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .limit(1)
  if (existing && existing.length > 0) return
  const record = {
    product_id: productId,
    image_url: imageUrl,
    display_order: 0,
    is_primary: true
  }
  const { error } = await supabase
    .from('product_images')
    .insert(record)
  if (error) {
    console.error('Error insertando imagen feed:', error.message)
  }
}

async function linkCategory(productId, categoryId) {
  if (!productId || !categoryId) return
  const { data: existing } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('product_id', productId)
    .eq('category_id', categoryId)
    .limit(1)
  if (existing && existing.length > 0) return
  const { error } = await supabase
    .from('product_categories')
    .insert({ product_id: productId, category_id: categoryId, subcategory_id: null })
  if (error) {
    console.error('Error vinculando categoría:', error.message)
  }
}

async function run() {
  const feedPath = path.resolve(__dirname, '../../../client/dist/feed.xml')
  const xml = fs.readFileSync(feedPath, 'utf8')
  const items = parseItems(xml)
  console.log(`Importando ${items.length} productos desde feed`)
  let created = 0
  for (const it of items) {
    const id = await upsertProductFromFeed(it)
    if (id) {
      created++
      await attachFeedImage(id, it.imageLink)
      const catId = await getOrCreateCategory(it.productType)
      await linkCategory(id, catId)
    }
  }
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  console.log(`Importación finalizada. Nuevos productos: ${created}. Total en BD: ${productsCount ?? 'desconocido'}`)
}

run()
