import { supabase } from '../config/supabase'

/**
 * Servicio para gestión de imágenes en Supabase Storage
 */

/**
 * Sube una imagen a Supabase Storage
 * @param {File} file - Archivo de imagen
 * @param {string} bucket - Nombre del bucket ('product-images', 'category-images', 'logos')
 * @param {string} folder - Carpeta dentro del bucket (opcional)
 * @returns {Promise<{url: string, path: string, error: null} | {url: null, path: null, error: Error}>}
 */
export async function uploadImage(file, bucket, folder = '') {
    try {
        // Validar archivo
        if (!file) {
            throw new Error('No se proporcionó ningún archivo')
        }

        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
            throw new Error('Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP')
        }

        // Validar tamaño (5MB max)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            throw new Error('El archivo es demasiado grande. Tamaño máximo: 5MB')
        }

        // Generar nombre único
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const extension = file.name.split('.').pop()
        const fileName = `${timestamp}-${randomString}.${extension}`

        // Construir path completo
        const filePath = folder ? `${folder}/${fileName}` : fileName

        // Subir archivo
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) throw error

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)

        return {
            url: publicUrl,
            path: filePath,
            error: null
        }
    } catch (error) {
        console.error('Error uploading image:', error)
        return {
            url: null,
            path: null,
            error
        }
    }
}

/**
 * Elimina una imagen de Supabase Storage
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Path del archivo en el bucket
 * @returns {Promise<{success: boolean, error: null} | {success: false, error: Error}>}
 */
export async function deleteImage(bucket, path) {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path])

        if (error) throw error

        return {
            success: true,
            error: null
        }
    } catch (error) {
        console.error('Error deleting image:', error)
        return {
            success: false,
            error
        }
    }
}

/**
 * Sube múltiples imágenes
 * @param {File[]} files - Array de archivos
 * @param {string} bucket - Nombre del bucket
 * @param {string} folder - Carpeta dentro del bucket (opcional)
 * @returns {Promise<Array>}
 */
export async function uploadMultipleImages(files, bucket, folder = '') {
    const uploadPromises = files.map(file => uploadImage(file, bucket, folder))
    return Promise.all(uploadPromises)
}

/**
 * Extrae el path de una URL pública de Supabase
 * @param {string} url - URL pública de Supabase
 * @param {string} bucket - Nombre del bucket
 * @returns {string} - Path del archivo
 */
export function extractPathFromUrl(url, bucket) {
    try {
        const bucketPath = `/storage/v1/object/public/${bucket}/`
        const index = url.indexOf(bucketPath)
        if (index === -1) return null
        return url.substring(index + bucketPath.length)
    } catch (error) {
        console.error('Error extracting path:', error)
        return null
    }
}
