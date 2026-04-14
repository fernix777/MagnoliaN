// Vercel Serverless Function: GET /api/feed.xml
// Genera el catálogo de productos en formato RSS/XML para Meta Ads
// Se actualiza en tiempo real desde Supabase - no es un archivo estático

const SITE_URL = 'https://www.magnolia-n.com'
const BRAND = 'Magnolia Novedades'

// Escapa caracteres especiales XML
function escapeXml(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

// Mapea categorías del negocio a categorías de Google (usadas por Meta)
function getGoogleCategory(categoryName) {
    const name = (categoryName || '').toUpperCase()
    if (name.includes('LED') || name.includes('LUZ') || name.includes('NEON') || name.includes('LUCES')) {
        return 'Electronics > Electronics Accessories > LED Lighting'
    }
    if (name.includes('REGALERIA') || name.includes('REGALO')) {
        return 'Arts &amp; Entertainment > Party &amp; Celebration > Gift Giving'
    }
    if (name.includes('LIBRERIA') || name.includes('LIBRERÍA')) {
        return 'Office Supplies'
    }
    if (name.includes('COTILLON') || name.includes('COTILLÓN')) {
        return 'Arts &amp; Entertainment > Party &amp; Celebration > Party Supplies'
    }
    if (name.includes('COMBO')) {
        return 'Arts &amp; Entertainment > Party &amp; Celebration'
    }
    return 'Arts &amp; Entertainment > Party &amp; Celebration'
}

export default async function handler(req, res) {
    // Solo GET
    if (req.method !== 'GET') {
        return res.status(405).end('Method Not Allowed')
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !serviceKey) {
        console.error('[feed.xml] Missing env vars')
        return res.status(500).end('Server configuration error')
    }

    const headers = {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
    }

    try {
        // 1. Obtener todos los productos activos
        const productsRes = await fetch(
            `${supabaseUrl}/rest/v1/products?active=eq.true&order=created_at.desc&select=*`,
            { headers }
        )

        if (!productsRes.ok) {
            throw new Error(`Error fetching products: ${productsRes.status}`)
        }

        const products = await productsRes.json()

        if (!products || products.length === 0) {
            // Feed vacío válido
            const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
    <channel>
        <title>${escapeXml(BRAND)} - Catálogo de Productos</title>
        <link>${SITE_URL}</link>
        <description>Catálogo de productos de ${escapeXml(BRAND)}</description>
        <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
    </channel>
</rss>`
            res.setHeader('Content-Type', 'application/xml; charset=utf-8')
            res.setHeader('Cache-Control', 'public, max-age=3600') // 1 hora de cache
            return res.status(200).end(emptyXml)
        }

        // 2. Obtener imágenes de todos los productos en una sola consulta
        const productIds = products.map(p => p.id).join(',')
        const imagesRes = await fetch(
            `${supabaseUrl}/rest/v1/product_images?product_id=in.(${productIds})&select=product_id,image_url,is_primary,display_order&order=display_order.asc`,
            { headers }
        )

        const images = imagesRes.ok ? await imagesRes.json() : []

        // 3. Obtener categorías para mapear nombres
        const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))]
        let categoriesMap = {}

        if (categoryIds.length > 0) {
            const catsRes = await fetch(
                `${supabaseUrl}/rest/v1/categories?id=in.(${categoryIds.join(',')})&select=id,name`,
                { headers }
            )
            if (catsRes.ok) {
                const cats = await catsRes.json()
                cats.forEach(c => { categoriesMap[c.id] = c.name })
            }
        }

        // 4. Agrupar imágenes por producto
        const imagesByProduct = {}
        images.forEach(img => {
            if (!imagesByProduct[img.product_id]) {
                imagesByProduct[img.product_id] = []
            }
            imagesByProduct[img.product_id].push(img)
        })

        // 5. Generar XML
        const now = new Date().toISOString()
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
    <channel>
        <title>${escapeXml(BRAND)} - Catálogo de Productos</title>
        <link>${SITE_URL}</link>
        <description>Catálogo de productos de ${escapeXml(BRAND)} - Decoración y regalos únicos en San Salvador de Jujuy, Argentina</description>
        <lastBuildDate>${now}</lastBuildDate>\n`

        for (const product of products) {
            const productImages = imagesByProduct[product.id] || []

            // Imagen principal: la marcada como is_primary, o la primera
            const primaryImg = productImages.find(img => img.is_primary) || productImages[0]
            const additionalImgs = productImages.filter(img => img !== primaryImg)

            // Si no tiene imagen, saltar (Meta requiere imagen)
            if (!primaryImg) continue

            const categoryName = categoriesMap[product.category_id] || ''
            const availability = product.stock > 0 ? 'in stock' : 'out of stock'
            const price = parseFloat(product.base_price || 0).toFixed(2)
            const productUrl = `${SITE_URL}/producto/${product.slug}`

            xml += `        <item>
            <g:id>${product.id}</g:id>
            <g:title>${escapeXml(product.name)}</g:title>
            <g:description>${escapeXml(product.description || product.name)}</g:description>
            <g:link>${productUrl}</g:link>
            <g:image_link>${escapeXml(primaryImg.image_url)}</g:image_link>\n`

            // Imágenes adicionales (máximo 9 adicionales para Meta)
            additionalImgs.slice(0, 9).forEach(img => {
                xml += `            <g:additional_image_link>${escapeXml(img.image_url)}</g:additional_image_link>\n`
            })

            xml += `            <g:availability>${availability}</g:availability>
            <g:price>${price} ARS</g:price>
            <g:condition>new</g:condition>
            <g:brand>${escapeXml(BRAND)}</g:brand>
            <g:mpn>${product.id}</g:mpn>`

            if (categoryName) {
                xml += `\n            <g:product_type>${escapeXml(categoryName)}</g:product_type>
            <g:google_product_category>${getGoogleCategory(categoryName)}</g:google_product_category>`
            }

            xml += `\n        </item>\n`
        }

        xml += `    </channel>
</rss>`

        // Headers de respuesta
        res.setHeader('Content-Type', 'application/xml; charset=utf-8')
        // Cache de 1 hora en CDN de Vercel - Meta rastrea cada 24h así que es suficiente
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
        res.setHeader('X-Feed-Generated', now)
        res.setHeader('X-Product-Count', String(products.length))

        return res.status(200).end(xml)

    } catch (error) {
        console.error('[feed.xml] Error generating feed:', error)
        return res.status(500).end(`Error generating feed: ${error.message}`)
    }
}
