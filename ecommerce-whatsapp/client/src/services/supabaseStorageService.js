/**
 * Servicio para gestión de imágenes en Supabase Storage
 * 
 * Reemplaza a Vercel Blob Storage para evitar límites de cuota
 * Ventajas:
 * - 5GB storage gratis
 * - Sin límite de uploads
 * - Integrado con Supabase
 */

import { supabase } from '../config/supabase'

/**
 * Sube una imagen a Supabase Storage
 * @param {File} file - Archivo a subir
 * @param {string} bucket - Bucket de destino (product-images, banners, categories)
 * @param {string} customName - Nombre personalizado (opcional)
 * @returns {Promise<{url: string, error: null} | {url: null, error: Error}>}
 */
export async function uploadImage(file, bucket = 'product-images', customName = null) {
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = customName || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        
        console.log(`📤 Subiendo ${file.name} a Supabase Storage bucket: ${bucket}`)
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type || 'image/jpeg'
            })
        
        if (error) {
            console.error('❌ Error uploading to Supabase:', error)
            return { url: null, error }
        }
        
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName)
        
        const publicUrl = urlData.publicUrl
        console.log(`✅ Imagen subida: ${publicUrl}`)
        
        return { url: publicUrl, error: null }
        
    } catch (error) {
        console.error('❌ Error en uploadImage:', error)
        return { url: null, error }
    }
}

/**
 * Sube una imagen con path específico (para products con subcarpeta por ID)
 * @param {File} file - Archivo a subir
 * @param {string} bucket - Bucket de destino
 * @param {string} path - Path dentro del bucket (ej: "products/123/imagen1.jpg")
 * @returns {Promise<{url: string, error: null}>}
 */
export async function uploadToPath(file, bucket, path) {
    try {
        console.log(`📤 Subiendo ${file.name} a ${bucket}/${path}`)
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type || 'image/jpeg'
            })
        
        if (error) {
            console.error('❌ Error uploading:', error)
            return { url: null, error }
        }
        
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
        
        return { url: urlData.publicUrl, error: null }
        
    } catch (error) {
        console.error('❌ Error en uploadToPath:', error)
        return { url: null, error }
    }
}

/**
 * Elimina una imagen de Supabase Storage
 * @param {string} url - URL de la imagen a eliminar
 * @returns {Promise<{success: boolean, error: Error | null}>}
 */
export async function deleteImage(url) {
    try {
        if (!url) return { success: true, error: null }
        
        const path = extractPathFromUrl(url)
        if (!path) return { success: true, error: null }
        
        console.log(`🗑️ Eliminando de Supabase Storage: ${path}`)
        
        // Extraer bucket del path
        const bucket = path.split('/')[0]
        const fileName = path.split('/').slice(1).join('/')
        
        const { error } = await supabase.storage
            .from(bucket)
            .remove([fileName])
        
        if (error) {
            console.error('❌ Error eliminando:', error)
            return { success: false, error }
        }
        
        console.log(`✅ Imagen eliminada: ${path}`)
        return { success: true, error: null }
        
    } catch (error) {
        console.error('❌ Error en deleteImage:', error)
        return { success: false, error }
    }
}

/**
 * Extrae el path relativo de una URL de Supabase Storage
 * @param {string} url - URL completa
 * @returns {string} - Path relativo (bucket/file)
 */
export function extractPathFromUrl(url) {
    try {
        if (!url) return null
        
        // URLs de Supabase: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        const match = url.match(/object\/public\/([^/]+)\/(.+)$/)
        if (match) {
            return `${match[1]}/${match[2]}`
        }
        
        return null
    } catch (error) {
        console.error('Error extrayendo path:', error)
        return null
    }
}

/**
 * Sube múltiples imágenes
 * @param {File[]} files - Array de archivos
 * @param {string} bucket - Bucket de destino
 * @param {string} prefix - Prefijo para nombres (ej: product ID)
 * @returns {Promise<{urls: string[], errors: Error[]}>}
 */
export async function uploadMultipleImages(files, bucket, prefix) {
    const urls = []
    const errors = []
    
    console.log(`📤 Subiendo ${files.length} imágenes a ${bucket} con prefix: ${prefix}`)
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = `${prefix}_${i + 1}_${Date.now()}.${file.name.split('.').pop()}`
        
        const result = await uploadToPath(file, bucket, fileName)
        
        if (result.url) {
            urls.push(result.url)
        } else {
            errors.push(result.error)
        }
    }
    
    console.log(`✅ Completado: ${urls.length} exitosas, ${errors.length} errores`)
    
    return { urls, errors }
}

/**
 * Verifica si una URL es de Supabase Storage
 * @param {string} url - URL a verificar
 * @returns {boolean}
 */
export function isSupabaseStorageUrl(url) {
    return url && url.includes('supabase.co/storage/v1/object/public/')
}

/**
 * Lista archivos en un bucket (para debug)
 * @param {string} bucket - Bucket a listar
 * @returns {Promise<{files: object[], error: Error | null}>}
 */
export async function listFiles(bucket) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list('', { limit: 1000 })
        
        if (error) throw error
        
        return { files: data || [], error: null }
    } catch (error) {
        console.error('❌ Error listando archivos:', error)
        return { files: [], error }
    }
}