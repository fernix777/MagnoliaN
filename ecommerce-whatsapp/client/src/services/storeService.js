import { supabase } from '../config/supabase'

/**
 * Servicio para la tienda pública (clientes)
 */

/**
 * Obtiene los 3 productos más vendidos (o destacados) de cada categoría
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function getTopSellingProductsPerCategory() {
    try {
        // 1. Obtener todas las categorías activas
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('id, name, slug')
            .eq('active', true)
            .order('display_order', { ascending: true })

        if (catError) throw catError

        if (!categories || categories.length === 0) {
            return { data: [], error: null }
        }

        // 2. Para cada categoría, obtener los 3 mejores productos
        const productsPromises = categories.map(async (category) => {
            const { data: products } = await supabase
                .from('products')
                .select(`
                    *,
                    category:categories(id, name, slug),
                    images:product_images(*),
                    product_categories!inner(category_id)
                `)
                .eq('active', true)
                .eq('product_categories.category_id', category.id)
                .order('featured', { ascending: false }) // Priorizar destacados
                .order('created_at', { ascending: false }) // Luego los más nuevos
                .limit(3)
            
            return products || []
        })

        const results = await Promise.all(productsPromises)
        
        // 3. Aplanar el array de arrays y eliminar duplicados (si un producto está en múltiples categorías)
        const allProducts = results.flat()
        const uniqueProducts = Array.from(new Map(allProducts.map(item => [item.id, item])).values())

        return { data: uniqueProducts, error: null }
    } catch (error) {
        console.error('Error fetching top selling products:', error)
        return { data: null, error }
    }
}

/**
 * Obtiene productos destacados
 * @param {number} limit - Número máximo de productos
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function getFeaturedProducts(limit = 8) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(*)
      `)
            .eq('active', true)
            .eq('featured', true)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        return { data, error: null }
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
        const { data, error } = await supabase
            .from('categories')
            .select(`
        *,
        products:products(count)
      `)
            .eq('active', true)
            .order('display_order', { ascending: true })

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error fetching categories:', error)
        return { data: null, error }
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
        // Primero obtener la categoría
        const { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .eq('active', true)
            .single()

        if (!category) {
            return { data: [], error: null }
        }

        let query = supabase
            .from('products')
            .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(*),
        product_categories!inner(category_id)
      `)
            .eq('active', true)
            .eq('product_categories.category_id', category.id)
            .order('created_at', { ascending: false })

        if (options.limit) {
            query = query.limit(options.limit)
        }

        const { data, error } = await query

        if (error) throw error

        return { data, error: null }
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
        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(*)
      `)
            .eq('active', true)
            .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { data, error: null }
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
        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        category:categories(id, name, slug),
        subcategory:subcategories(id, name, slug),
        images:product_images(*),
        variants:product_variants(*)
      `)
            .eq('slug', slug)
            .eq('active', true)
            .single()

        if (error) throw error

        return { data, error: null }
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
            .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(*)
      `)
            .eq('active', true)
            .order('created_at', { ascending: false })

        if (options.limit) {
            query = query.limit(options.limit)
        }

        if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
        }

        const { data, error } = await query

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error fetching all products:', error)
        return { data: null, error }
    }
}
