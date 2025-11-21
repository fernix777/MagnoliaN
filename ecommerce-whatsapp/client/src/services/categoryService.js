import { supabase } from '../config/supabase'
import { uploadImage, deleteImage, extractPathFromUrl } from './uploadService'

/**
 * Servicio para gestión de categorías
 */

/**
 * Obtiene todas las categorías
 * @param {Object} options - Opciones de filtrado
 * @returns {Promise<{data: Array, error: null} | {data: null, error: Error}>}
 */
export async function getCategories(options = {}) {
    try {
        let query = supabase
            .from('categories')
            .select('*, subcategories(*)')
            .order('display_order', { ascending: true })

        // Filtrar por activo/inactivo
        if (options.active !== undefined) {
            query = query.eq('active', options.active)
        }

        const { data, error } = await query

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error fetching categories:', error)
        return { data: null, error }
    }
}

/**
 * Obtiene una categoría por ID
 * @param {number} id - ID de la categoría
 * @returns {Promise<{data: Object, error: null} | {data: null, error: Error}>}
 */
export async function getCategoryById(id) {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*, subcategories(*)')
            .eq('id', id)
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error fetching category:', error)
        return { data: null, error }
    }
}

/**
 * Crea una nueva categoría
 * @param {Object} categoryData - Datos de la categoría
 * @param {File} imageFile - Archivo de imagen (opcional)
 * @returns {Promise<{data: Object, error: null} | {data: null, error: Error}>}
 */
export async function createCategory(categoryData, imageFile = null) {
    try {
        let imageUrl = null

        // Subir imagen si se proporcionó
        if (imageFile) {
            const uploadResult = await uploadImage(imageFile, 'category-images', 'categories')
            if (uploadResult.error) throw uploadResult.error
            imageUrl = uploadResult.url
        }

        // Generar slug si no se proporcionó
        const slug = categoryData.slug || generateSlug(categoryData.name)

        // Limpiar datos - solo campos válidos de la tabla
        const cleanData = {
            name: categoryData.name,
            slug: slug,
            description: categoryData.description || null,
            image_url: imageUrl,
            display_order: Number(categoryData.display_order) || 0,
            active: categoryData.active ?? true
        }

        console.log('Creating category with data:', cleanData)

        const { data, error } = await supabase
            .from('categories')
            .insert([cleanData])
            .select()
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error creating category:', error)
        return { data: null, error }
    }
}

/**
 * Actualiza una categoría
 * @param {number} id - ID de la categoría
 * @param {Object} categoryData - Datos actualizados
 * @param {File} imageFile - Nuevo archivo de imagen (opcional)
 * @returns {Promise<{data: Object, error: null} | {data: null, error: Error}>}
 */
export async function updateCategory(id, categoryData, imageFile = null) {
    try {
        let imageUrl = categoryData.image_url

        // Si hay nueva imagen, subir y eliminar la anterior
        if (imageFile) {
            // Eliminar imagen anterior si existe
            if (categoryData.image_url) {
                const oldPath = extractPathFromUrl(categoryData.image_url, 'category-images')
                if (oldPath) {
                    await deleteImage('category-images', oldPath)
                }
            }

            // Subir nueva imagen
            const uploadResult = await uploadImage(imageFile, 'category-images', 'categories')
            if (uploadResult.error) throw uploadResult.error
            imageUrl = uploadResult.url
        }

        // Limpiar datos - solo campos válidos de la tabla
        const cleanData = {
            name: categoryData.name,
            description: categoryData.description || null,
            image_url: imageUrl,
            display_order: Number(categoryData.display_order) || 0,
            active: categoryData.active ?? true
        }

        const { data, error } = await supabase
            .from('categories')
            .update(cleanData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error updating category:', error)
        return { data: null, error }
    }
}

/**
 * Elimina una categoría
 * @param {number} id - ID de la categoría
 * @returns {Promise<{success: boolean, error: null} | {success: false, error: Error}>}
 */
export async function deleteCategory(id) {
    try {
        // Obtener categoría para eliminar imagen
        const { data: category } = await getCategoryById(id)

        // Eliminar imagen si existe
        if (category?.image_url) {
            const path = extractPathFromUrl(category.image_url, 'category-images')
            if (path) {
                await deleteImage('category-images', path)
            }
        }

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)

        if (error) throw error

        return { success: true, error: null }
    } catch (error) {
        console.error('Error deleting category:', error)
        return { success: false, error }
    }
}

/**
 * Crea una subcategoría
 * @param {Object} subcategoryData - Datos de la subcategoría
 * @returns {Promise<{data: Object, error: null} | {data: null, error: Error}>}
 */
export async function createSubcategory(subcategoryData) {
    try {
        const slug = subcategoryData.slug || generateSlug(subcategoryData.name)

        const { data, error } = await supabase
            .from('subcategories')
            .insert([{
                ...subcategoryData,
                slug
            }])
            .select()
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error creating subcategory:', error)
        return { data: null, error }
    }
}

/**
 * Actualiza una subcategoría
 * @param {number} id - ID de la subcategoría
 * @param {Object} subcategoryData - Datos actualizados
 * @returns {Promise<{data: Object, error: null} | {data: null, error: Error}>}
 */
export async function updateSubcategory(id, subcategoryData) {
    try {
        const { data, error } = await supabase
            .from('subcategories')
            .update(subcategoryData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        console.error('Error updating subcategory:', error)
        return { data: null, error }
    }
}

/**
 * Elimina una subcategoría
 * @param {number} id - ID de la subcategoría
 * @returns {Promise<{success: boolean, error: null} | {success: false, error: Error}>}
 */
export async function deleteSubcategory(id) {
    try {
        const { error } = await supabase
            .from('subcategories')
            .delete()
            .eq('id', id)

        if (error) throw error

        return { success: true, error: null }
    } catch (error) {
        console.error('Error deleting subcategory:', error)
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
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guiones
        .replace(/^-+|-+$/g, '') // Eliminar guiones al inicio y final
}
