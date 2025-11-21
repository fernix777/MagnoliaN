import { supabase } from '../config/supabase'
import { uploadImage, deleteImage, extractPathFromUrl, uploadMultipleImages } from './uploadService'

/**
 * Servicio para gestión de productos
 */

/**
 * Obtiene productos con filtros
 * @param {Object} filters - Filtros de búsqueda
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function getProducts(filters = {}) {
    try {
        let query = supabase
            .from('products')
            .select(`
        *,
        category:categories(id, name),
        subcategory:subcategories(id, name),
        images:product_images(*),
        variants:product_variants(*)
      `)
            .order('created_at', { ascending: false })

        // Filtros
        if (filters.active !== undefined) {
            query = query.eq('active', filters.active)
        }

        if (filters.featured !== undefined) {
            query = query.eq('featured', filters.featured)
        }

        if (filters.category_id) {
            query = query.eq('category_id', filters.category_id)
        }

        if (filters.subcategory_id) {
            query = query.eq('subcategory_id', filters.subcategory_id)
        }

        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
        }

        // Paginación
        if (filters.limit) {
            query = query.limit(filters.limit)
        }

        if (filters.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
        }

        const { data, error } = await query

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error fetching products:', error)
        return { data: null, error }
    }
}

/**
 * Obtiene un producto por ID
 * @param {number} id - ID del producto
 * @returns {Promise<{data: Object, error: null} | {data: null, error: Error}>}
 */
export async function getProductById(id) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        category:categories(id, name),
        subcategory:subcategories(id, name),
        images:product_images(*),
        variants:product_variants(*)
      `)
            .eq('id', id)
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error fetching product:', error)
        return { data: null, error }
    }
}

/**
 * Crea un nuevo producto
 * @param {Object} productData - Datos del producto
 * @param {File[]} imageFiles - Archivos de imágenes
 * @returns {Promise<{data: Object, error: null} | {data: null, error: Error}>}
 */
export async function createProduct(productData, imageFiles = []) {
    try {
        // Generar slug
        const slug = productData.slug || generateSlug(productData.name)

        // Crear producto
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert([{
                ...productData,
                slug
            }])
            .select()
            .single()

        if (productError) throw productError

        // Subir imágenes si hay
        if (imageFiles.length > 0) {
            const uploadResults = await uploadMultipleImages(
                imageFiles,
                'product-images',
                `products/${product.id}`
            )

            // Crear registros de imágenes
            const imageRecords = uploadResults
                .filter(result => !result.error)
                .map((result, index) => ({
                    product_id: product.id,
                    image_url: result.url,
                    display_order: index,
                    is_primary: index === 0
                }))

            if (imageRecords.length > 0) {
                const { error: imagesError } = await supabase
                    .from('product_images')
                    .insert(imageRecords)

                if (imagesError) console.error('Error saving images:', imagesError)
            }
        }

        // Obtener producto completo con imágenes
        return await getProductById(product.id)
    } catch (error) {
        console.error('Error creating product:', error)
        return { data: null, error }
    }
}

/**
 * Actualiza un producto
 * @param {number} id - ID del producto
 * @param {Object} productData - Datos actualizados
 * @returns {Promise<{data: Object, error: null} | {data: null, error: Error}>}
 */
export async function updateProduct(id, productData) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error updating product:', error)
        return { data: null, error }
    }
}

/**
 * Elimina un producto
 * @param {number} id - ID del producto
 * @returns {Promise<{success: boolean, error: null} | {success: false, error: Error}>}
 */
export async function deleteProduct(id) {
    try {
        // Obtener imágenes del producto
        const { data: images } = await supabase
            .from('product_images')
            .select('image_url')
            .eq('product_id', id)

        // Eliminar imágenes del storage
        if (images && images.length > 0) {
            for (const image of images) {
                const path = extractPathFromUrl(image.image_url, 'product-images')
                if (path) {
                    await deleteImage('product-images', path)
                }
            }
        }

        // Eliminar producto (las imágenes y variantes se eliminan por CASCADE)
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) throw error

        return { success: true, error: null }
    } catch (error) {
        console.error('Error deleting product:', error)
        return { success: false, error }
    }
}

/**
 * Agrega imágenes a un producto
 * @param {number} productId - ID del producto
 * @param {File[]} imageFiles - Archivos de imágenes
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function addProductImages(productId, imageFiles) {
    try {
        // Obtener el número actual de imágenes para el display_order
        const { data: existingImages } = await supabase
            .from('product_images')
            .select('display_order')
            .eq('product_id', productId)
            .order('display_order', { ascending: false })
            .limit(1)

        const startOrder = existingImages && existingImages.length > 0
            ? existingImages[0].display_order + 1
            : 0

        // Subir imágenes
        const uploadResults = await uploadMultipleImages(
            imageFiles,
            'product-images',
            `products/${productId}`
        )

        // Crear registros
        const imageRecords = uploadResults
            .filter(result => !result.error)
            .map((result, index) => ({
                product_id: productId,
                image_url: result.url,
                display_order: startOrder + index,
                is_primary: false
            }))

        const { data, error } = await supabase
            .from('product_images')
            .insert(imageRecords)
            .select()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error adding product images:', error)
        return { data: null, error }
    }
}

/**
 * Elimina una imagen de producto
 * @param {number} imageId - ID de la imagen
 * @returns {Promise<{success: boolean, error: null} | {success: false, error: Error}>}
 */
export async function deleteProductImage(imageId) {
    try {
        // Obtener imagen
        const { data: image } = await supabase
            .from('product_images')
            .select('image_url')
            .eq('id', imageId)
            .single()

        if (image) {
            // Eliminar del storage
            const path = extractPathFromUrl(image.image_url, 'product-images')
            if (path) {
                await deleteImage('product-images', path)
            }
        }

        // Eliminar registro
        const { error } = await supabase
            .from('product_images')
            .delete()
            .eq('id', imageId)

        if (error) throw error

        return { success: true, error: null }
    } catch (error) {
        console.error('Error deleting product image:', error)
        return { success: false, error }
    }
}

/**
 * Actualiza el orden de las imágenes
 * @param {Array} imageOrders - Array de {id, display_order}
 * @returns {Promise<{success: boolean, error: null} | {success: false, error: Error}>}
 */
export async function updateImageOrders(imageOrders) {
    try {
        const updates = imageOrders.map(({ id, display_order }) =>
            supabase
                .from('product_images')
                .update({ display_order })
                .eq('id', id)
        )

        await Promise.all(updates)

        return { success: true, error: null }
    } catch (error) {
        console.error('Error updating image orders:', error)
        return { success: false, error }
    }
}

/**
 * Marca una imagen como principal
 * @param {number} productId - ID del producto
 * @param {number} imageId - ID de la imagen a marcar como principal
 * @returns {Promise<{success: boolean, error: null} | {success: false, error: Error}>}
 */
export async function setPrimaryImage(productId, imageId) {
    try {
        // Desmarcar todas las imágenes del producto
        await supabase
            .from('product_images')
            .update({ is_primary: false })
            .eq('product_id', productId)

        // Marcar la nueva imagen principal
        const { error } = await supabase
            .from('product_images')
            .update({ is_primary: true })
            .eq('id', imageId)

        if (error) throw error

        return { success: true, error: null }
    } catch (error) {
        console.error('Error setting primary image:', error)
        return { success: false, error }
    }
}

/**
 * Genera un slug a partir de un texto
 * @param {string} text - Texto para convertir en slug
 * @returns {string} - Slug generado
 */
function generateSlug(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}
