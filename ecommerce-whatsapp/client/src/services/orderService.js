import { supabase } from '../config/supabase'

/**
 * Crea una nueva orden
 * @param {Object} orderData - Datos de la orden
 * @returns {Promise<{data: Object, error: null} | {data: null, error: Error}>}
 */
export async function createOrder(orderData) {
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        })

        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({}))
            throw new Error(errorResult.error || 'Failed to create order via backend')
        }

        const result = await response.json()
        return { data: result.data, error: null }
    } catch (error) {
        console.error('Error creating order proxy:', error)
        return { data: null, error }
    }
}

/**
 * Obtiene todas las órdenes (para admin)
 * @param {Object} options - Filtros y paginación
 * @returns {Promise<{data: Array, count: number, error: null} | {data: null, count: 0, error: Error}>}
 */
export async function getOrders(options = {}) {
    try {
        // Usar endpoint backend para asegurar que obtenemos items (service key)
        const params = new URLSearchParams()
        if (options.status) params.set('status', options.status)
        if (options.limit) params.set('limit', options.limit)
        if (options.offset) params.set('offset', options.offset)

        const resp = await fetch(`/api/orders?${params.toString()}`)
        if (!resp.ok) throw new Error('Error fetching orders from backend')
        const result = await resp.json()
        return { data: result.data || [], count: (result.data || []).length, error: null }
    } catch (error) {
        console.error('Error fetching orders:', error)
        return { data: null, count: 0, error }
    }
}

/**
 * Obtiene una orden por ID
 * @param {number} id - ID de la orden
 */
export async function getOrderById(id) {
    try {
        const resp = await fetch(`/api/orders/${id}`)
        if (!resp.ok) throw new Error('Error fetching order from backend')
        const result = await resp.json()
        return { data: result.data || null, error: null }
    } catch (error) {
        console.error('Error fetching order:', error)
        return { data: null, error }
    }
}

/**
 * Actualiza el estado de una orden
 * @param {number} id - ID de la orden
 * @param {string} status - Nuevo estado
 */
export async function updateOrderStatus(id, status) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error updating order status:', error)
        return { data: null, error }
    }
}

/**
 * Obtiene estadísticas de ventas
 * @param {AbortSignal} [signal] - Señal de aborto opcional
 */
export async function getSalesStats(signal) {
    try {
        // Obtener total de ventas (suma de total de órdenes completadas)
        const { data: orders, error } = await supabase
            .from('orders')
            .select('total')
            .eq('status', 'completed')
            .abortSignal(signal)

        if (error) throw error

        const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0)
        
        // Conteo de órdenes
        const { count: ordersCount, error: countError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .abortSignal(signal)
            
        if (countError) throw countError

        return { 
            totalSales, 
            ordersCount,
            error: null 
        }
    } catch (error) {
        // Ignorar errores de aborto
        if (
            error.code === 20 || 
            error.name === 'AbortError' || 
            error.message?.includes('AbortError') ||
            error.message?.includes('aborted')
        ) {
            return { totalSales: 0, ordersCount: 0, error: null } // Return neutral data on abort
        }
        console.error('Error fetching sales stats:', error)
        return { totalSales: 0, ordersCount: 0, error }
    }
}
