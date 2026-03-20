import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

router.post('/', async (req, res) => {
    try {
        const { customer, items, total, paymentMethod, user_id } = req.body

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

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

        if (itemsError) throw itemsError

        res.status(201).json({ data: order })
    } catch (error) {
        console.error('Error creating order in backend:', error)
        res.status(500).json({ error: error.message || 'Error internal server' })
    }
})

export default router
