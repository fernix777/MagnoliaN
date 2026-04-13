import { supabase } from '../config/supabase'
import { uploadImage, deleteImage, extractPathFromUrl, uploadMultipleImages } from './vercelBlobService'

/**
 * Servicio para gestión de productos
 */

/**
 * Obtiene productos con filtros
 * @param {Object} filters - Filtros de búsqueda
 * @param {AbortSignal} [signal] - Señal de aborto opcional
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
// Helper para cargar datos relacionados de productos
async function loadProductRelations(products) {
    if (!products || products.length === 0) return products
    
    const productIds = products.map(p => p.id)
    
    // Cargar imágenes
    const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .in('product_id', productIds)
    
    // Cargar variantes
    const { data: variants } = await supabase
        .from('product_variants')
        .select('*')
        .in('product_id', productIds)
    
    // Cargar categorías
    const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))]
    const { data: categories } = categoryIds.length > 0 ? await supabase
        .from('categories')
        .select('id, name')
        .in('id', categoryIds)
    : { data: [] }
    
    // Combinar datos
    return products.map(product => {
        const productImages = (images || []).filter(img => img.product_id === product.id)
        const productVariants = (variants || []).filter(v => v.product_id === product.id)
        const category = (categories || []).find(c => c.id === product.category_id)
        
        return {
            ...product,
            images: productImages,
            variants: productVariants,
            category: category || null
        }
    })
}

export async function getProducts(filters = {}, signal) {
    try {
        let query = supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })
            .abortSignal(signal)

        // Filtros
        if (filters.active !== undefined) {
            query = query.eq('active', filters.active)
        }

        if (filters.category_id) {
            query = query.eq('category_id', filters.category_id)
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

        const { data: products, error } = await query

        if (error) throw error

        // Cargar relaciones
        const productsWithRelations = await loadProductRelations(products)

        return { data: productsWithRelations, error: null }
    } catch (error) {
        if (error.code === 20 || error.name === 'AbortError') {
            return { data: [], error: null }
        }
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
        // Obtener producto simple
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error

        // Cargar imágenes
        const { data: images } = await supabase
            .from('product_images')
            .select('*')
            .eq('product_id', id)

        // Cargar variantes
        const { data: variants } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', id)

        // Cargar categoría
        const { data: category } = product.category_id ? await supabase
            .from('categories')
            .select('id, name')
            .eq('id', product.category_id)
            .single()
        : { data: null }

        return { 
            data: {
                ...product,
                images: images || [],
                variants: variants || [],
                category: category || null
            }, 
            error: null 
        }
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

        // Separar variantes y categorías de los datos del producto
        const { variants, categories: productCategories, ...productFields } = productData

        // Crear producto
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert([{
                ...productFields,
                slug
            }])
            .select()
            .single()

        if (productError) throw productError

        // Guardar categorías adicionales si existen
        if (productCategories && productCategories.length > 0) {
            const categoriesToInsert = productCategories.map(c => ({
                product_id: product.id,
                category_id: c.category_id,
                subcategory_id: c.subcategory_id || null
            }))

            const { error: catError } = await supabase
                .from('product_categories')
                .insert(categoriesToInsert)

            if (catError) console.error('Error saving product categories:', catError)
        }

        // Guardar variantes si existen
        if (variants && variants.length > 0) {
            const variantsToInsert = variants.map(v => ({
                product_id: product.id,
                variant_type: v.variant_type || 'color',
                variant_value: v.variant_value || v.name,
                sku: v.sku || null,
                price_modifier: Number(v.price_modifier) || 0,
                stock: Number(v.stock) || 0,
                active: v.active !== undefined ? v.active : true
            }))

            const { error: variantsError } = await supabase
                .from('product_variants')
                .insert(variantsToInsert)

            if (variantsError) {
                console.error('Error saving variants:', variantsError)
                // No lanzamos error, continuamos sin variantes
            }
        }

        // Subir imágenes si hay
        if (imageFiles.length > 0) {
            const { urls, errors } = await uploadMultipleImages(
                imageFiles,
                'product-images',
                `products/${product.id}`
            )

            // Crear registros de imágenes (urls es un array de strings)
            const imageRecords = urls.map((url, index) => ({
                product_id: product.id,
                image_url: url,
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

        // Obtener producto completo con imágenes y variantes
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
        // Separar variantes y categorías de los datos del producto
        const { variants, categories: productCategories, ...productFields } = productData

        // Asegurar que el ID es número (BIGINT)
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id

        const { data, error } = await supabase
            .from('products')
            .update(productFields)
            .eq('id', numericId)
            .select()

        if (error) throw error
        
        // Tomar el primer resultado si hay múltiples (no debería pasar con eq)
        const product = Array.isArray(data) ? data[0] : data

        // Actualizar categorías (Eliminar y crear nuevas)
        if (productCategories !== undefined) {
            // 1. Eliminar categorías existentes en la tabla pivote
            const { error: deleteCatError } = await supabase
                .from('product_categories')
                .delete()
                .eq('product_id', numericId)
            
            if (deleteCatError) console.error('Error deleting old product categories:', deleteCatError)

            // 2. Insertar nuevas categorías
            if (productCategories.length > 0) {
                const categoriesToInsert = productCategories.map(c => ({
                    product_id: numericId,
                    category_id: c.category_id,
                    subcategory_id: c.subcategory_id || null
                }))

                const { error: insertCatError } = await supabase
                    .from('product_categories')
                    .insert(categoriesToInsert)

                if (insertCatError) console.error('Error inserting new product categories:', insertCatError)
            }
        }

        // Actualizar variantes (Estrategia: Eliminar todas y crear nuevas)
        if (variants !== undefined) {
            // 1. Eliminar variantes existentes
            const { error: deleteError } = await supabase
                .from('product_variants')
                .delete()
                .eq('product_id', numericId)

            if (deleteError) console.error('Error deleting old variants:', deleteError)

            // 2. Insertar nuevas variantes (sin ID para evitar conflictos de PK)
            if (variants.length > 0) {
                // Usar desestructuración para quitar explícitamente el campo 'id'
                const variantsToInsert = variants.map(({ id, ...v }) => ({
                    product_id: numericId,
                    variant_type: v.variant_type || 'color',
                    variant_value: v.variant_value || v.name,
                    sku: v.sku || null,
                    price_modifier: Number(v.price_modifier) || 0,
                    stock: Number(v.stock) || 0,
                    active: v.active !== undefined ? v.active : true
                }))

                const { error: variantsError } = await supabase
                    .from('product_variants')
                    .insert(variantsToInsert)

                if (variantsError) {
                    console.error('Error updating variants:', variantsError)
                    // No lanzamos error, continuamos sin variantes
                }
            }
        }

        return { data: product, error: null }
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
        const { urls } = await uploadMultipleImages(
            imageFiles,
            'product-images',
            `products/${productId}`
        )

        // Crear registros (urls es array de strings)
        const imageRecords = urls.map((url, index) => ({
            product_id: productId,
            image_url: url,
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

/**
 * Obtiene productos destacados (los más agregados al carrito o comprados)
 * @param {number} limit - Número de productos a obtener
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function getFeaturedProducts(limit = 8) {
    try {
        // Obtener productos activos
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        // Cargar relaciones
        const productsWithRelations = await loadProductRelations(products)

        return { data: productsWithRelations, error: null }
    } catch (error) {
        console.error('Error fetching featured products:', error)
        return { data: null, error }
    }
}
