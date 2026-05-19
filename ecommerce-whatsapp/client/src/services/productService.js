import { supabase } from '../config/supabase'
import { uploadImage, deleteImage, uploadMultipleImages } from './supabaseStorageService'

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
        // Ignorar errores de aborto (suceden cuando el usuario escribe rápido en el buscador)
        if (
            error.code === 20 || 
            error.name === 'AbortError' || 
            error.message?.includes('AbortError') ||
            error.message?.includes('aborted')
        ) {
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

        // Cargar todas las categorías asignadas desde la tabla puente
        const { data: productCategories } = await supabase
            .from('product_categories')
            .select('category_id, subcategory_id')
            .eq('product_id', id)

        // Cargar categoría principal (para compatibilidad)
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
                category: category || null,
                product_categories: productCategories || []
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

        // Separar variantes, categorías y campos de envío (no existentes en la BD actual) de los datos del producto
        const { 
            variants, 
            categories: productCategories, 
            weight_g, 
            height_cm, 
            width_cm, 
            length_cm, 
            ...productFields 
        } = productData

        let finalSlug = slug
        let product, productError

        // Intentar insertar (con lógica de reintento para el slug si es necesario)
        const maxRetries = 3
        let retries = 0

        while (retries < maxRetries) {
            const { data, error } = await supabase
                .from('products')
                .insert([{
                    ...productFields,
                    slug: finalSlug
                }])
                .select()
                .single()

            if (error) {
                if (error.code === '23505' && error.message.includes('slug')) {
                    console.log(`[DEBUG] Slug collision: ${finalSlug}. Retrying...`)
                    finalSlug = `${slug}-${Math.random().toString(36).substr(2, 5)}`
                    retries++
                    continue
                }
                console.error('[createProduct] INSERT FAILED:', {
                    code  : error.code,
                    message: error.message,
                    details: error.details,
                    hint  : error.hint,
                })
                throw error
            }

            product = data
            break
        }

        if (!product) throw new Error('No se pudo crear el producto después de varios reintentos de slug')

        // Guardar categorías adicionales si existen (Deduplicadas)
        if (productCategories && productCategories.length > 0) {
            // Filtrar IDs duplicados para evitar error de PK
            const uniqueCategories = productCategories.filter((v, index, self) =>
                index === self.findIndex(t => t.category_id === v.category_id)
            )

            const categoriesToInsert = uniqueCategories.map(c => ({
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
            console.log(`[DEBUG] Subiendo ${imageFiles.length} imágenes para producto ${product.id}`)
            
            const { urls, errors } = await uploadMultipleImages(
                imageFiles,
                'product-images',
                `${product.id}`
            )

            console.log(`[DEBUG] URLs subidas: ${urls.length}, Errores: ${errors.length}`)
            console.log('[DEBUG] URLs:', urls)
            
            if (errors.length > 0) {
                console.error('[DEBUG] Errores al subir:', errors)
            }

            // Crear registros de imágenes (urls es un array de strings)
            const imageRecords = urls.map((url, index) => ({
                product_id: product.id,
                image_url: url,
                display_order: index,
                is_primary: index === 0
            }))

            console.log('[DEBUG] Registros a insertar:', imageRecords)

            if (imageRecords.length > 0) {
                const { data: insertedImages, error: imagesError } = await supabase
                    .from('product_images')
                    .insert(imageRecords)
                    .select()

                if (imagesError) {
                    console.error('[DEBUG] Error saving images:', imagesError)
                    throw new Error(`Error al guardar imágenes: ${imagesError.message}`)
                } else {
                    console.log('[DEBUG] Imágenes guardadas exitosamente:', insertedImages)
                }
            }
        } else {
            console.log('[DEBUG] No hay imágenes para subir')
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
        // Separar variantes, categorías y campos de envío (no existentes en la BD actual) de los datos del producto
        const { 
            variants, 
            categories: productCategories, 
            weight_g, 
            height_cm, 
            width_cm, 
            length_cm, 
            ...productFields 
        } = productData

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

            // 2. Insertar nuevas categorías (Deduplicadas)
            if (productCategories.length > 0) {
                // Filtrar IDs duplicados para evitar error de PK
                const uniqueCategories = productCategories.filter((v, index, self) =>
                    index === self.findIndex(t => Number(t.category_id) === Number(v.category_id))
                )

                const categoriesToInsert = uniqueCategories.map(c => ({
                    product_id: numericId,
                    category_id: Number(c.category_id),
                    subcategory_id: c.subcategory_id ? Number(c.subcategory_id) : null
                }))

                const { error: insertCatError } = await supabase
                    .from('product_categories')
                    .insert(categoriesToInsert)

                if (insertCatError) console.error('Error inserting new product categories:', insertCatError)
            }
        }

        // Actualizar variantes (Estrategia: Eliminar todas y crear nuevas)
        if (variants !== undefined) {
            // 0. Verificar variantes existentes antes de eliminar
            const { data: existingVariants, error: checkError } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', numericId)
            
            console.log('[DEBUG] Variantes existentes antes de eliminar:', existingVariants?.length || 0)
            if (checkError) console.error('[DEBUG] Error verificando variantes:', checkError)

            // 1. Eliminar variantes existentes PRIMERO
            console.log('[DEBUG] Eliminando variantes para producto:', numericId)
            const { data: deletedVariants, error: deleteError } = await supabase
                .from('product_variants')
                .delete()
                .eq('product_id', numericId)
                .select()

            if (deleteError) {
                console.error('[DEBUG] Error deleting old variants:', deleteError)
            } else {
                console.log('[DEBUG] Variantes eliminadas:', deletedVariants?.length || 0)
            }

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

                // FILTRAR DUPLICADOS: mantener solo la primera ocurrencia de cada variant_value
                const uniqueVariants = variantsToInsert.filter((v, index, self) =>
                    index === self.findIndex(t => t.variant_value === v.variant_value)
                )

                console.log('[DEBUG] Variantes originales:', variants.length)
                console.log('[DEBUG] Variantes únicas:', uniqueVariants.length)
                console.log('[DEBUG] Variantes a insertar:', uniqueVariants)

                // Insertar variantes una a una para manejar errores individualmente
                for (const variant of uniqueVariants) {
                    console.log('[DEBUG] Insertando variante:', variant)
                    const { data: insertedVariant, error: variantError } = await supabase
                        .from('product_variants')
                        .insert(variant)
                        .select()
                        .single()
                    
                    if (variantError) {
                        console.error('[DEBUG] Error insertando variante:', variantError)
                        if (variantError.code !== '23505') {
                            console.error('Error grave al insertar variante:', variantError)
                        } else {
                            console.log('[DEBUG] Ignorando duplicado de variante')
                        }
                    } else {
                        console.log('[DEBUG] Variante insertada:', insertedVariant)
                    }
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
        // Intentar eliminación directa vía Supabase cliente (anon key)
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        // Si hay error de FK/RLS (409 o código 23503), usado el endpoint serverless
        // que tiene service_role key y puede bypassear las RLS policies.
        // La FK order_items.product_id tiene ON DELETE SET NULL en el schema,
        // así que Supabase pone product_id=null automáticamente.
        if (error) {
            const isConstraintError =
                error.code === '23503' ||
                error.code === '409' ||
                error.status === 409 ||
                (error.details || '').includes('foreign key') ||
                (error.message || '').includes('foreign key') ||
                (error.message || '').includes('violates')

            if (isConstraintError) {
                console.log('[deleteProduct] Usando endpoint serverless para bypassear RLS...')
                return await deleteProductViaAPI(id)
            }
            throw error
        }

        return { success: true, error: null }
    } catch (error) {
        console.error('Error deleting product:', error)
        return { success: false, error }
    }
}

/**
 * Elimina producto usando la API serverless /api/products/:id (service_role key)
 * Necesario cuando el cliente anon no puede bypassear RLS para el ON DELETE SET NULL
 */
async function deleteProductViaAPI(id) {
    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.error || `Error ${response.status} al eliminar producto`)
        }

        const result = await response.json()

        // Limpiar imágenes de Vercel Blob si las devuelve el servidor
        if (result.imageUrls?.length > 0) {
            for (const url of result.imageUrls) {
                await deleteImage(url)
            }
        }

        return { success: true, error: null }
    } catch (error) {
        console.error('[deleteProductViaAPI] Error:', error)
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
            `${productId}`
        )

        // Crear registros (urls es array de strings)
        const imageRecords = urls.map((url, index) => ({
            product_id: productId,
            image_url: url,
            display_order: startOrder + index,
            is_primary: false
        }))

        console.log('[DEBUG] Registros de imágenes a insertar:', imageRecords)

        // Insertar una imagen a la vez para manejar errores individualmente
        const insertedImages = []
        for (const record of imageRecords) {
            console.log('[DEBUG] Insertando imagen:', record)
            const { data: imgData, error: imgError } = await supabase
                .from('product_images')
                .insert(record)
                .select()
                .single()
            
            if (imgError) {
                console.error('[DEBUG] Error insertando imagen individual:', imgError)
                // Si es error de duplicado, ignorar y continuar
                if (imgError.code !== '23505') {
                    throw imgError
                }
                console.log('[DEBUG] Ignorando duplicado, continuando...')
            } else {
                console.log('[DEBUG] Imagen insertada:', imgData)
                insertedImages.push(imgData)
            }
        }

        return { data: insertedImages, error: null }
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

        // Eliminar registro de BD primero
        const { error } = await supabase
            .from('product_images')
            .delete()
            .eq('id', imageId)

        if (error) throw error

        // Luego limpiar del storage (vercelBlobService recibe URL directamente)
        if (image?.image_url) {
            await deleteImage(image.image_url)
        }

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
