// Vercel Serverless Function: /api/orders
// GET: Obtiene órdenes (para admin)
// POST: Crea una orden en Supabase usando la service_role key (evita restricciones RLS para usuarios anónimos)
export default async function handler(req, res) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !serviceKey) {
        console.error('[API Orders] Missing env vars:', { supabaseUrl: !!supabaseUrl, serviceKey: !!serviceKey })
        return res.status(500).json({ error: 'Supabase environment variables not configured' })
    }

    // GET: Obtener órdenes (con filtros opcionarios)
    if (req.method === 'GET') {
        return handleGetOrders(req, res, supabaseUrl, serviceKey)
    }

    // POST: Crear orden
    if (req.method === 'POST') {
        return handlePostOrder(req, res, supabaseUrl, serviceKey)
    }

    return res.status(405).json({ error: 'Method not allowed' })
}

/**
 * Obtiene órdenes con soporte para filtros y paginación
 */
async function handleGetOrders(req, res, supabaseUrl, serviceKey) {
    try {
        const { status, limit, offset } = req.query

        const headers = {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
        }

        // Construir URL con filtros
        let url = `${supabaseUrl}/rest/v1/orders?select=*,items:order_items(*)`

        // Agregar ordenamiento
        url += '&order=created_at.desc'

        // Agregar filtros
        if (status) {
            url += `&status=eq.${encodeURIComponent(status)}`
        }

        if (limit) {
            url += `&limit=${Number(limit)}`
        }

        if (offset) {
            url += `&offset=${Number(offset)}`
        }

        console.log(`[API Orders] GET from Supabase: ${url.replace(serviceKey, '***')}`)

        const response = await fetch(url, {
            method: 'GET',
            headers
        })

        if (!response.ok) {
            const err = await response.text()
            console.error('[API Orders] Error fetching from Supabase:', response.status, err)
            return res.status(response.status).json({ error: err || 'Error fetching orders' })
        }

        const data = await response.json()
        return res.status(200).json({ data })
    } catch (error) {
        console.error('[API Orders] Unexpected error in GET:', error)
        return res.status(500).json({ error: error.message || 'Internal server error' })
    }
}

/**
 * Crea una nueva orden
 */
async function handlePostOrder(req, res, supabaseUrl, serviceKey) {
    try {
        const { customer, items, total, paymentMethod, user_id } = req.body || {}

        if (!customer || !items || !total) {
            return res.status(400).json({ error: 'Faltan datos de la orden' })
        }

        const headers = {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'return=representation'
        }

        // 1. Crear la orden principal
        const orderRes = await fetch(`${supabaseUrl}/rest/v1/orders`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=representation' },
            body: JSON.stringify({
                user_id: user_id || null,
                customer_info: customer,
                total,
                status: 'pending',
                payment_method: paymentMethod
            })
        })

        if (!orderRes.ok) {
            const err = await orderRes.json()
            console.error('Error creating order (serverless):', err)
            return res.status(500).json({ error: err.message || 'Error al crear la orden' })
        }

        const [order] = await orderRes.json()

        // 2. Crear los items de la orden
        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
            product_name: item.name,
            variant_info: item.variant || null,
            selected_color: item.selectedColor || null,
            selected_condition: item.selectedCondition || null,
            purchase_type: item.purchaseType || 'paquete'
        }))

        const itemsRes = await fetch(`${supabaseUrl}/rest/v1/order_items`, {
            method: 'POST',
            headers,
            body: JSON.stringify(orderItems)
        })

        if (!itemsRes.ok) {
            const err = await itemsRes.json()
            console.error('Error creating order items (serverless):', err)
            // La orden ya fue creada; devolvemos éxito aunque los items fallaron, la orden igual avanza
        }

        return res.status(201).json({ data: order })
    } catch (error) {
        console.error('[API Orders] Unexpected error in POST:', error)
        return res.status(500).json({ error: error.message || 'Internal server error' })
    }
}

