// Vercel Serverless Function: POST /api/products
// Crea un producto con variantes e imágenes usando la service_role key
import { uploadToPath } from '../../src/services/supabaseStorageService'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { name, description, base_price, stock, active, featured, categories, variants, images } = req.body || {}

    if (!name || !base_price) {
        return res.status(400).json({ error: 'Faltan datos del producto' })
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY

    if (!supabaseUrl || !serviceKey) {
        console.error('[API Products] Missing env vars:', { supabaseUrl: !!supabaseUrl, serviceKey: !!serviceKey })
        return res.status(500).json({ error: 'Supabase environment variables not configured' })
    }

    const headers = {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=representation'
    }

    try {
        // 1. Crear el producto
        const productSlug = name.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')

        const productRes = await fetch(`${supabaseUrl}/rest/v1/products`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name,
                description: description || '',
                base_price: Number(base_price),
                stock: Number(stock) || 0,
                active: active ?? true,
                featured: featured ?? false,
                slug: productSlug,
                category_id: categories?.[0]?.category_id || null
            })
        })

        if (!productRes.ok) {
            const err = await productRes.json()
            console.error('Error creating product:', err)
            return res.status(500).json({ error: err.message || 'Error al crear el producto' })
        }

        const [product] = await productRes.json()

        // 2. Crear variantes si existen
        if (variants && variants.length > 0) {
            const variantsToInsert = variants.map(v => ({
                product_id: product.id,
                variant_type: v.variant_type || 'color',
                variant_value: v.variant_value || v.name,
                sku: v.sku || null,
                price_modifier: Number(v.price_modifier) || 0,
                stock: Number(v.stock) || 0,
                active: v.active !== undefined ? v.active : true
            }))

            const variantsRes = await fetch(`${supabaseUrl}/rest/v1/product_variants`, {
                method: 'POST',
                headers,
                body: JSON.stringify(variantsToInsert)
            })

            if (!variantsRes.ok) {
                console.error('Error creating variants:', await variantsRes.json())
            }
        }

        // 3. Subir y crear imágenes si existen
        if (images && images.length > 0) {
            const uploadedUrls = []
            
            for (let i = 0; i < images.length; i++) {
                const image = images[i]
                // Si es una URL base64, convertir a buffer
                if (image.startsWith('data:')) {
                    // Extraer el tipo y datos
                    const matches = image.match(/^data:(image\/[a-z]+});base64,(.+)$/)
                    if (matches) {
                        const [, mimeType, base64Data] = matches
                        const buffer = Buffer.from(base64Data, 'base64')
                        const fileName = `${product.id}_${i + 1}.${mimeType.split('/')[1]}`
                        
                        // Subir usando fetch directo a Supabase Storage
                        const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${fileName}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceKey}`,
                                'Content-Type': mimeType
                            },
                            body: buffer
                        })
                        
                        if (uploadRes.ok) {
                            uploadedUrls.push(`${supabaseUrl}/storage/v1/object/public/product-images/${fileName}`)
                        }
                    }
                } else if (image.url) {
                    // Ya es una URL subida
                    uploadedUrls.push(image.url)
                }
            }

            // Crear registros de imágenes
            if (uploadedUrls.length > 0) {
                const imageRecords = uploadedUrls.map((url, index) => ({
                    product_id: product.id,
                    image_url: url,
                    display_order: index,
                    is_primary: index === 0
                }))

                const imagesRes = await fetch(`${supabaseUrl}/rest/v1/product_images`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(imageRecords)
                })

                if (!imagesRes.ok) {
                    console.error('Error creating images:', await imagesRes.json())
                }
            }
        }

        return res.status(201).json({ data: product })

    } catch (error) {
        console.error('Error in createProduct:', error)
        return res.status(500).json({ error: error.message })
    }
}