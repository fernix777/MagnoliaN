// Vercel Serverless Function: DELETE /api/products/:id
// Elimina un producto usando service_role key para bypassear RLS
// La FK order_items.product_id tiene ON DELETE SET NULL, por lo que
// Supabase pone product_id=null en order_items automáticamente al eliminar.
// Los datos históricos (product_name, price) se preservan en order_items.

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { id } = req.query

    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID de producto inválido' })
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !serviceKey) {
        return res.status(500).json({ error: 'Configuración de servidor incompleta' })
    }

    const headers = {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=representation'
    }

    try {
        // 1. Obtener imágenes antes de eliminar (para limpiar storage)
        const imagesRes = await fetch(
            `${supabaseUrl}/rest/v1/product_images?product_id=eq.${id}&select=image_url`,
            { headers }
        )
        const images = imagesRes.ok ? await imagesRes.json() : []

        // 2. Eliminar el producto (ON DELETE SET NULL en order_items funciona con service key)
        const deleteRes = await fetch(
            `${supabaseUrl}/rest/v1/products?id=eq.${id}`,
            { method: 'DELETE', headers }
        )

        if (!deleteRes.ok) {
            const errText = await deleteRes.text()
            console.error('[DELETE product] Error:', deleteRes.status, errText)
            return res.status(deleteRes.status).json({
                error: `Error al eliminar producto: ${errText}`
            })
        }

        // 3. Devolver las URLs de imágenes para que el cliente limpie Vercel Blob
        //    (no podemos borrar Vercel Blob desde el servidor sin el token)
        return res.status(200).json({
            success: true,
            imageUrls: images.map(img => img.image_url).filter(Boolean)
        })

    } catch (error) {
        console.error('[DELETE product] Unexpected error:', error)
        return res.status(500).json({ error: error.message })
    }
}
