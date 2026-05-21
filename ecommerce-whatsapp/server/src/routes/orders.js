import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

router.post('/', async (req, res) => {
    try {
        const { customer, items = [], total = 0, paymentMethod, user_id } = req.body

        if (!customer || !items.length) {
            return res.status(400).json({
                error: 'Faltan campos requeridos: customer y items'
            })
        }

        // Filtrar items que tienen un product_id válido que existe en la DB
        const validProductIds = new Set(
            (await supabase.from('products').select('id').eq('active', true)).data?.map(p => p.id) || []
        )

        const validItems = items.filter(item => {
            const pid = item.product_id || item.id
            return pid && validProductIds.has(Number(pid))
        })

        if (validItems.length === 0) {
            return res.status(400).json({
                error: 'Ningún producto del carrito existe en la base de datos'
            })
        }

        const totalProductsNotFound = items.length - validItems.length
        if (totalProductsNotFound > 0) {
            console.warn(`[orders] ${totalProductsNotFound} productos del carrito no existen en DB y serán omitidos`)
        }

        // 1. Crear la orden principal
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                user_id: user_id || null,
                customer_info: customer,
                total: total,
                status: 'pending',
                payment_method: paymentMethod
            }])
            .select()
            .single()

        if (orderError) throw orderError

        // 2. Crear los items de la orden
        const orderItems = validItems.map(item => {
            const rawId = item.product_id || item.id
            return {
                order_id: order.id,
                product_id: Number(rawId),
                quantity: item.quantity,
                price: item.price,
                product_name: item.name,
                variant_info: item.variant || null,
                selected_color: item.selectedColor || null,
                selected_condition: item.selectedCondition || null,
                purchase_type: item.purchaseType || item.purchase_type || 'paquete'
            }
        })

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

        if (itemsError) throw itemsError

        // Recuperar la orden con sus items para devolver al cliente
        const { data: fullOrder, error: fetchError } = await supabase
            .from('orders')
            .select(`*, items:order_items(*)`)
            .eq('id', order.id)
            .single()

        if (fetchError) throw fetchError

        res.status(201).json({ data: fullOrder })
    } catch (error) {
        console.error('Error creating order in backend:', error)
        res.status(500).json({ error: error.message || 'Error internal server' })
    }
})

// Obtener lista de órdenes (con items) - usado por el admin
router.get('/', async (req, res) => {
    try {
        const { status, limit, offset } = req.query

        let query = supabase
            .from('orders')
            .select(`*, items:order_items(*)`)
            .order('created_at', { ascending: false })

        if (status) query = query.eq('status', status)
        if (limit) query = query.limit(Number(limit))
        if (offset) query = query.range(Number(offset), Number(offset) + (Number(limit) || 10) - 1)

        const { data, error } = await query
        if (error) throw error

        res.json({ data })
    } catch (error) {
        console.error('Error fetching orders in backend:', error)
        res.status(500).json({ error: error.message || 'Error internal server' })
    }
})

// Obtener una orden por ID (con items)
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id)
        const { data, error } = await supabase
            .from('orders')
            .select(`*, items:order_items(*)`)
            .eq('id', id)
            .single()

        if (error) throw error
        res.json({ data })
    } catch (error) {
        console.error('Error fetching order by id in backend:', error)
        res.status(500).json({ error: error.message || 'Error internal server' })
    }
})

export default router
