import { supabase } from '../config/supabase'

/**
 * Servicio para la tienda pública (clientes)
 */

/**
 * Obtiene todos los productos activos para el feed (usado para Meta)
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function getTopSellingProductsPerCategory() {
    try {
        console.log('[DEBUG] Intentando obtener productos...')
        
        // 1. Obtener productos con categorías (especificando relación para evitar ambigüedad PGRST201)
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*, category:categories!products_category_id_fkey(id, name)')
            .eq('active', true)
            .order('created_at', { ascending: false })
            .limit(50)
        
        if (productsError) {
            console.error('[DEBUG] Error obteniendo productos:', productsError)
            throw productsError
        }
        
        if (!products || products.length === 0) {
            return { data: [], error: null }
        }
        
        // 2. Obtener IDs de productos
        const productIds = products.map(p => p.id)
        
        // 3. Obtener imágenes de esos productos
        const { data: images, error: imagesError } = await supabase
            .from('product_images')
            .select('*')
            .in('product_id', productIds)
        
        if (imagesError) {
            console.error('[DEBUG] Error obteniendo imágenes:', imagesError)
        }
        
        // 4. Combinar productos con sus imágenes
        const productsWithImages = products.map(product => {
            const productImages = (images || []).filter(img => img.product_id === product.id)
            const primaryImage = productImages.find(img => img.is_primary) || productImages[0]
            
            return {
                ...product,
                image_url: primaryImage?.image_url || null,
                images: productImages
            }
        })
        
        console.log('[DEBUG] Productos con imágenes:', { 
            productCount: productsWithImages.length,
            withImages: productsWithImages.filter(p => p.image_url).length
        })

        return { data: productsWithImages, error: null }
    } catch (error) {
        console.error('Error fetching all products for feed:', error)
        return { data: [], error }
    }
}

// Helper para cargar imágenes y variantes de productos
async function loadProductImages(products) {
    if (!products || products.length === 0) return products
    
    const productIds = products.map(p => p.id)
    
    // Cargar imágenes y variantes en paralelo
    const [{ data: images, error: imagesError }, { data: variants, error: variantsError }] = await Promise.all([
        supabase.from('product_images').select('*').in('product_id', productIds),
        supabase.from('product_variants').select('*').in('product_id', productIds)
    ])
    
    if (imagesError) {
        console.error('[DEBUG] Error cargando imágenes:', imagesError)
    }
    if (variantsError) {
        console.error('[DEBUG] Error cargando variantes:', variantsError)
    }
    
    return products.map(product => {
        const productImages = (images || []).filter(img => img.product_id === product.id)
        const productVariants = (variants || []).filter(v => v.product_id === product.id)
        const primaryImage = productImages.find(img => img.is_primary) || productImages[0]
        
        return {
            ...product,
            image_url: primaryImage?.image_url || null,
            images: productImages,
            variants: productVariants
        }
    })
}

/**
 * Obtiene productos destacados
 * @param {number} limit - Número máximo de productos
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function getFeaturedProducts(limit = 8) {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*, category:categories!products_category_id_fkey(id, name)')
            .eq('active', true)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        // Cargar imágenes
        const productsWithImages = await loadProductImages(products)

        return { data: productsWithImages, error: null }
    } catch (error) {
        console.error('Error fetching featured products:', error)
        return { data: null, error }
    }
}

/**
 * Obtiene categorías activas con conteo de productos
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function getActiveCategories() {
    try {
        console.log('[DEBUG] Intentando obtener categorías...')
        
        // Consulta simple sin relaciones
        let { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('active', true)
            .order('display_order', { ascending: true })

        // Fallback: si la columna 'active' no existe, traer todas las categorías
        if (error) {
            console.warn('[DEBUG] Columna active no existe en categories, usando fallback sin filtro:', error.message)
            const fallback = await supabase
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true })
            data = fallback.data
            error = fallback.error
        }

        console.log('[DEBUG] Categorías:', { 
            dataLength: data?.length, 
            error: error?.message 
        })

        if (error) {
            console.error('[DEBUG] Error categorías:', error)
            throw error
        }

        return { data: data || [], error: null }
    } catch (error) {
        console.error('Error fetching categories:', error)
        return { data: [], error }
    }
}

/**
 * Obtiene productos por categoría
 * @param {string} categorySlug - Slug de la categoría
 * @param {Object} options - Opciones de filtrado
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function getProductsByCategory(categorySlug, options = {}) {
    try {
        // 1. Obtener la categoría
        let { data: category, error: categoryError } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .eq('active', true)
            .single()

        // Fallback: si la columna 'active' no existe
        if (categoryError) {
            const fallbackCat = await supabase
                .from('categories')
                .select('id')
                .eq('slug', categorySlug)
                .single()
            category = fallbackCat.data
            categoryError = fallbackCat.error
        }

        if (!category) {
            return { data: [], error: null }
        }

        // 2. Obtener productos vinculados a esta categoría (vía tabla puente o campo directo)
        // Usamos una consulta que traiga los productos que tengan este category_id en cualquiera de los dos lugares
        const { data: pCatData, error: pCatError } = await supabase
            .from('product_categories')
            .select('product_id')
            .eq('category_id', category.id)

        const linkedProductIds = (pCatData || []).map(pc => pc.product_id)
        
        // También incluimos los que tengan el category_id directo en la tabla products (compatibilidad)
        // Construimos un query OR o buscamos por lista de IDs
        let query = supabase
            .from('products')
            .select('*')
            .eq('active', true)

        if (linkedProductIds.length > 0) {
            query = query.or(`category_id.eq.${category.id},id.in.(${linkedProductIds.join(',')})`)
        } else {
            query = query.eq('category_id', category.id)
        }

        query = query.order('created_at', { ascending: false })

        if (options.limit) {
            query = query.limit(options.limit)
        }

        const { data: products, error } = await query

        if (error) throw error

        // Cargar imágenes
        const productsWithImages = await loadProductImages(products)

        return { data: productsWithImages, error: null }
    } catch (error) {
        console.error('Error fetching products by category:', error)
        return { data: null, error }
    }
}

/**
 * Busca productos por texto
 * @param {string} searchQuery - Texto de búsqueda
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function searchProducts(searchQuery) {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('active', true)
            .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Cargar imágenes
        const productsWithImages = await loadProductImages(products)

        return { data: productsWithImages, error: null }
    } catch (error) {
        console.error('Error searching products:', error)
        return { data: null, error }
    }
}

/**
 * Obtiene un producto por slug
 * @param {string} slug - Slug del producto
 * @returns {Promise<{data: Object, error: null} | {data: null, error: Error}>}
 */
export async function getProductBySlug(slug) {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('slug', slug)
            .eq('active', true)
            .single()

        if (error) throw error

        // Cargar imágenes y variantes del producto
        const [{ data: images, error: imagesError }, { data: variants, error: variantsError }] = await Promise.all([
            supabase.from('product_images').select('*').eq('product_id', product.id),
            supabase.from('product_variants').select('*').eq('product_id', product.id)
        ])

        if (imagesError) {
            console.error('[DEBUG] Error cargando imágenes:', imagesError)
        }
        if (variantsError) {
            console.error('[DEBUG] Error cargando variantes:', variantsError)
        }

        const productImages = images || []
        const primaryImage = productImages.find(img => img.is_primary) || productImages[0]

        return { 
            data: {
                ...product,
                image_url: primaryImage?.image_url || null,
                images: productImages,
                variants: variants || []
            }, 
            error: null 
        }
    } catch (error) {
        console.error('Error fetching product:', error)
        return { data: null, error }
    }
}

/**
 * Obtiene todos los productos activos
 * @param {Object} options - Opciones de filtrado
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function getAllProducts(options = {}) {
    try {
        let query = supabase
            .from('products')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false })

        if (options.limit) {
            query = query.limit(options.limit)
        }

        if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
        }

        const { data: products, error } = await query

        if (error) throw error

        // Cargar imágenes
        const productsWithImages = await loadProductImages(products)

        return { data: productsWithImages, error: null }
    } catch (error) {
        console.error('Error fetching all products:', error)
        return { data: null, error }
    }
}
