// Vercel Serverless Function: POST /api/orders
// Crea una orden en Supabase usando la service_role key (evita restricciones RLS para usuarios anónimos)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { customer, items, total, paymentMethod, user_id } = req.body || {}

    if (!customer || !items || !total) {
        return res.status(400).json({ error: 'Faltan datos de la orden' })
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !serviceKey) {
        console.error('[API Orders] Missing env vars:', { supabaseUrl: !!supabaseUrl, serviceKey: !!serviceKey })
        return res.status(500).json({ error: 'Supabase environment variables not configured' })
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
}
