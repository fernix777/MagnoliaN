import { supabase } from '../config/supabase'

/**
 * Servicio para gestión de variantes de productos
 */

/**
 * Obtiene todas las variantes de un producto
 * @param {number} productId - ID del producto
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function getVariantsByProduct(productId) {
    try {
        const { data, error } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .order('color', { ascending: true })
            .order('size', { ascending: true })

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error fetching variants:', error)
        return { data: null, error }
    }
}

/**
 * Crea una nueva variante
 * @param {Object} variantData - Datos de la variante
 * @returns {Promise<{data: Object, error: null} | {data: null, error: Error}>}
 */
export async function createVariant(variantData) {
    try {
        const { data, error } = await supabase
            .from('product_variants')
            .insert([variantData])
            .select()
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error creating variant:', error)
        return { data: null, error }
    }
}

/**
 * Actualiza una variante
 * @param {number} id - ID de la variante
 * @param {Object} variantData - Datos actualizados
 * @returns {Promise<{data: Object, error: null} | {data: null, error: Error}>}
 */
export async function updateVariant(id, variantData) {
    try {
        const { data, error } = await supabase
            .from('product_variants')
            .update(variantData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error updating variant:', error)
        return { data: null, error }
    }
}

/**
 * Elimina una variante
 * @param {number} id - ID de la variante
 * @returns {Promise<{success: boolean, error: null} | {success: false, error: Error}>}
 */
export async function deleteVariant(id) {
    try {
        const { error } = await supabase
            .from('product_variants')
            .delete()
            .eq('id', id)

        if (error) throw error

        return { success: true, error: null }
    } catch (error) {
        console.error('Error deleting variant:', error)
        return { success: false, error }
    }
}

/**
 * Crea múltiples variantes a la vez
 * @param {Array} variantsData - Array de datos de variantes
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function createMultipleVariants(variantsData) {
    try {
        const { data, error } = await supabase
            .from('product_variants')
            .insert(variantsData)
            .select()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error creating multiple variants:', error)
        return { data: null, error }
    }
}
