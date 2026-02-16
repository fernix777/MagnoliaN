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

async function recoverProductImages() {
  console.log('Recuperando imágenes de productos desde Storage...')
  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug, name')
    .order('id', { ascending: true })
  if (error) {
    console.error('Error obteniendo productos:', error.message)
    return
  }

  // Descubrir subcarpetas bajo 'products' en el bucket 'product-images'
  const { data: productFolders, error: foldersErr } = await supabase
    .storage
    .from('product-images')
    .list('products', { limit: 1000 })
  if (foldersErr) {
    console.log('No se pudo listar product-images/products:', foldersErr.message)
  }

  let linked = 0
  for (const p of products) {
    // Intento 1: carpeta products/{id}
    const prefix = `products/${p.id}`
    let { data: files, error: listErr } = await supabase
      .storage
      .from('product-images')
      .list(prefix, { limit: 100 })
    if (listErr || !files || files.length === 0) {
      // Intento 2: buscar carpeta que contenga el id (por ejemplo products/{slug-o-id})
      const folderCandidate = (productFolders || []).find(f => {
        const n = (f.name || '').toLowerCase()
        const slug = (p.slug || '').toLowerCase()
        const byName = slugify(p.name || '')
        return n === String(p.id) || n.includes(String(p.id)) || (slug && n.includes(slug)) || (byName && n.includes(byName))
      })
      if (folderCandidate?.name) {
        const altPrefix = `products/${folderCandidate.name}`
        const alt = await supabase.storage.from('product-images').list(altPrefix, { limit: 100 })
        files = alt.data || []
      }
      // Intento 3: buscar en raíz del bucket archivos que incluyan el id
      if (!files || files.length === 0) {
        const { data: rootFiles } = await supabase.storage.from('product-images').list('', { limit: 1000 })
        const slug = (p.slug || '').toLowerCase()
        const byName = slugify(p.name || '')
        const matched = (rootFiles || []).filter(rf => {
          const n = (rf.name || '').toLowerCase()
          return n.includes(String(p.id)) || (slug && n.includes(slug)) || (byName && n.includes(byName))
        })
        if (matched.length > 0) {
          // Convertir a estructura compatible usando ruta directa a raíz
          files = matched.map(m => ({ name: m.name, root: true }))
        }
      }
      if (!files || files.length === 0) {
        continue
      }
    }
    // Obtener imágenes existentes para evitar duplicados y calcular display_order
    const { data: existing } = await supabase
      .from('product_images')
      .select('image_url, display_order, is_primary')
      .eq('product_id', p.id)
    const existingUrls = new Set((existing || []).map(e => (e.image_url || '').toLowerCase()))
    const startOrder = (existing || []).reduce((max, e) => Math.max(max, Number(e.display_order || 0)), -1) + 1
    // Build records
    const records = files
      .filter(f => f?.name)
      .map((f, idx) => {
        const pathInBucket = f.root ? `${f.name}` : `${prefix}/${f.name}`
        const { data: pub } = supabase
          .storage
          .from('product-images')
          .getPublicUrl(pathInBucket)
        return {
          product_id: p.id,
          image_url: pub?.publicUrl,
          display_order: startOrder + idx,
          is_primary: false
        }
      })
      .filter(r => r.image_url)
      .filter(r => !existingUrls.has((r.image_url || '').toLowerCase()))
    if (records.length > 0) {
      const { error: insertErr } = await supabase
        .from('product_images')
        .insert(records)
      if (insertErr) {
        console.error('Error insertando product_images:', insertErr.message)
      } else {
        linked += records.length
        console.log(`Producto ${p.id}: ${records.length} imágenes vinculadas`)
      }
    }
    const { data: allImages } = await supabase
      .from('product_images')
      .select('id, image_url, is_primary, display_order')
      .eq('product_id', p.id)
      .order('display_order', { ascending: true })
    const candidate = (allImages || []).find(img => (img.image_url || '').includes('/storage/v1/object/public/product-images/'))
    const currentPrimary = (allImages || []).find(img => img.is_primary)
    if (candidate && (!currentPrimary || currentPrimary.id !== candidate.id)) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', p.id)
      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', candidate.id)
      await supabase
        .from('products')
        .update({ image_url: candidate.image_url })
        .eq('id', p.id)
    }
  }
  console.log(`Total imágenes de productos vinculadas: ${linked}`)
}

async function recoverCategoryImages() {
  console.log('Recuperando imágenes de categorías desde Storage...')
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, image_url')
    .order('id', { ascending: true })
  if (error) {
    console.error('Error obteniendo categorías:', error.message)
    return
  }
  const { data: files, error: listErr } = await supabase
    .storage
    .from('category-images')
    .list('categories', { limit: 1000 })
  if (listErr) {
    console.log('No se pudo listar category-images/categories:', listErr.message)
  }
  const { data: rootFiles } = await supabase
    .storage
    .from('category-images')
    .list('', { limit: 1000 })
  const allFiles = [...(files || []), ...(rootFiles || [])]
  console.log(`Archivos en category-images: categorias=${(files||[]).length}, raiz=${(rootFiles||[]).length}`)
  console.log('Ejemplos:', (allFiles || []).slice(0, 5).map(f => f.name).join(', '))
  const availableQueue = [...(files || []), ...(rootFiles || [])].map(f => f.name)
  let updated = 0
  for (const cat of categories) {
    const slug = cat.slug || slugify(cat.name)
    // Try to match file by slug or name fragment
    const exact = (allFiles || []).find(f => (f.name || '').toLowerCase() === `${slug}.jpg`)
      || (allFiles || []).find(f => (f.name || '').toLowerCase() === `${slug}.png`)
      || (allFiles || []).find(f => (f.name || '').toLowerCase() === `${slug}.webp`)
    const match = exact || (allFiles || []).find(f => {
      const n = (f.name || '').toLowerCase()
      return n.includes(slug) || n.includes(slugify(cat.name)) || n.includes(String(cat.id))
    })
    let selected = match
    if (!selected && availableQueue.length > 0) {
      const next = availableQueue.shift()
      selected = { name: next }
    }
    if (!selected) {
      const { data: prods } = await supabase
        .from('products')
        .select('id, category_id, images:product_images(*) , product_categories(category_id)')
        .or(`category_id.eq.${cat.id},product_categories.category_id.eq.${cat.id}`)
        .limit(10)
      const pick = (prods || []).find(p => (p.images || []).length > 0)
      if (!pick) continue
      const primary = (pick.images || []).find(i => i.is_primary) || (pick.images || [])[0]
      if (!primary?.image_url) continue
      const { error: updErr2 } = await supabase
        .from('categories')
        .update({ image_url: primary.image_url })
        .eq('id', cat.id)
      if (!updErr2) {
        updated++
        console.log(`Categoría ${cat.id} (${cat.name}): imagen tomada de producto ${pick.id}`)
      }
      continue
    }
    const inCategories = (files || []).some(f => f.name === selected.name)
    const pathInBucket = inCategories ? `categories/${selected.name}` : `${selected.name}`
    const { data: pub } = supabase
      .storage
      .from('category-images')
      .getPublicUrl(pathInBucket)
    if (!pub?.publicUrl) continue
    const { error: updErr } = await supabase
      .from('categories')
      .update({ image_url: pub.publicUrl })
      .eq('id', cat.id)
    if (updErr) {
      console.error(`Error actualizando categoría ${cat.id}:`, updErr.message)
      continue
    }
    updated++
    console.log(`Categoría ${cat.id} (${cat.name}): imagen vinculada -> ${selected.name}`)
  }
  console.log(`Total categorías actualizadas con imagen: ${updated}`)
}

async function run() {
  await recoverProductImages()
  await recoverCategoryImages()
  const { count: piCount } = await supabase
    .from('product_images')
    .select('*', { count: 'exact', head: true })
  const { data: cats } = await supabase
    .from('categories')
    .select('id, image_url')
  const catsWithImage = (cats || []).filter(c => c.image_url).length
  console.log(`Resumen: product_images=${piCount ?? 0}, categorías con imagen=${catsWithImage}`)
}

run()
