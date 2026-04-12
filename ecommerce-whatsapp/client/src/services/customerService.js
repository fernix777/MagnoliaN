import { supabase } from '../config/supabase'

/**
 * Get all customers from customers table
 * Intended for Admin use
 */
export async function getCustomers() {
    try {
        console.log('🔄 Fetching customers from table...')
        
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('❌ Error fetching customers:', error)
            throw error
        }
        
        console.log('✅ Customers found:', data?.length)
        
        // Map data to match component expectations
        const formattedData = (data || []).map(customer => ({
            id: customer.id,
            email: customer.email,
            full_name: customer.full_name || 'Sin Nombre',
            phone: customer.phone || 'N/A',
            address: customer.address || 'N/A',
            city: customer.city || 'N/A',
            created_at: customer.created_at,
            source: customer.source
        }))

        return { data: formattedData, error: null }
    } catch (error) {
        console.error('Error fetching customers:', error)
        return { data: null, error }
    }
}

/**
 * Get customer details including orders
 */
export async function getCustomerDetails(userId) {
    try {
        // Get profile (might be null if user only exists in auth)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle() // Use maybeSingle to avoid error if not found
        
        if (profileError) console.warn('Profile fetch warning:', profileError)

        // Get orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (ordersError) throw ordersError

        return { data: { ...(profile || {}), orders }, error: null }
    } catch (error) {
        console.error('Error fetching customer details:', error)
        return { data: null, error }
    }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/actualizar-contrasena`,
        })
        
        if (error) throw error
        return { error: null }
    } catch (error) {
        console.error('Error sending password reset:', error)
        return { error }
    }
}
