import { supabase } from '../config/supabase'
import { uploadImage, deleteImage } from './vercelBlobService'

/**
 * Obtener todos los banners (para admin)
 */
export async function getBanners() {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error fetching banners:', error)
        return { data: null, error }
    }
}

/**
 * Obtener banners activos (para clientes)
 */
export async function getActiveBanners() {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .eq('active', true)
            .order('display_order', { ascending: true })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error fetching active banners:', error)
        return { data: null, error }
    }
}

/**
 * Crear un nuevo banner
 * @param {Object} bannerData 
 * @param {File} imageFile 
 */
export async function createBanner(bannerData, imageFile) {
    try {
        let image_url = bannerData.image_url

        // Si hay archivo, subirlo primero
        if (imageFile) {
            console.log('📤 Subiendo banner a Vercel Blob...')
            const uploadResult = await uploadImage(imageFile, 'banners')
            
            if (uploadResult.error) {
                console.error('❌ Error subiendo banner:', uploadResult.error)
                throw uploadResult.error
            }
            
            image_url = uploadResult.url
            console.log('✅ Banner subido exitosamente:', image_url)
        }

        const { data, error } = await supabase
            .from('banners')
            .insert([{ ...bannerData, image_url }])
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error creating banner:', error)
        return { data: null, error }
    }
}

/**
 * Actualizar un banner
 */
export async function updateBanner(id, updates) {
    try {
        const { data, error } = await supabase
            .from('banners')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error updating banner:', error)
        return { data: null, error }
    }
}

/**
 * Eliminar un banner
 */
export async function deleteBanner(id, imageUrl) {
    try {
        // 1. Eliminar registro de BD
        const { error: dbError } = await supabase
            .from('banners')
            .delete()
            .eq('id', id)

        if (dbError) throw dbError

        // 2. Intentar eliminar imagen del storage si es nuestra
        if (imageUrl && imageUrl.includes('banners/')) {
            try {
                // Extraer path relativo: si url es ".../banners/archivo.jpg", queremos "archivo.jpg"
                // O si es ".../storage/v1/object/public/banners/archivo.jpg"
                const pathParts = imageUrl.split('/banners/')
                if (pathParts.length > 1) {
                    const path = pathParts[1]
                    await supabase.storage
                        .from('banners')
                        .remove([path])
                }
            } catch (storageError) {
                console.warn('Error deleting banner image from storage:', storageError)
                // No lanzamos error para no bloquear la UI si ya se borró de BD
            }
        }

        return { error: null }
    } catch (error) {
        console.error('Error deleting banner:', error)
        return { error }
    }
}
