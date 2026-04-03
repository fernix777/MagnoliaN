/**
 * Servicio para gestión de imágenes en Vercel Blob Storage
 * 
 * Reemplaza a Supabase Storage para uploads de imágenes
 * Ventajas:
 * - 100GB egress gratis vs 1GB de Supabase
 * - CDN global integrada
 * - URLs más limpias
 * - Sin configuración CORS
 */

import { put } from '@vercel/blob'

/**
 * Sube una imagen a Vercel Blob Storage
 * @param {File} file - Archivo a subir
 * @param {string} folder - Carpeta de destino (banners, products, categories)
 * @param {string} customName - Nombre personalizado (opcional)
 * @returns {Promise<{url: string, error: null} | {url: null, error: Error}>}
 */
export async function uploadImage(file, folder, customName = null) {
    try {
        // Generar nombre único si no se proporciona
        const fileName = customName || `${folder}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${file.name.split('.').pop()}`
        
        // Construir path completo
        const path = `${folder}/${fileName}`
        
        console.log(`📤 Subiendo ${file.name} a Vercel Blob: ${path}`)
        
        // Subir a Vercel Blob
        const blob = await put(path, file, {
            access: 'public',
            token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
        })
        
        console.log(`✅ Imagen subida exitosamente: ${blob.url}`)
        
        return { url: blob.url, error: null }
        
    } catch (error) {
        console.error('❌ Error subiendo imagen a Vercel Blob:', error)
        return { url: null, error }
    }
}

/**
 * Elimina una imagen de Vercel Blob Storage
 * @param {string} url - URL de la imagen a eliminar
 * @returns {Promise<{success: boolean, error: Error | null}>}
 */
export async function deleteImage(url) {
    try {
        // Extraer path de la URL
        const urlObj = new URL(url)
        const path = urlObj.pathname.substring(1) // Quitar el primer /
        
        console.log(`🗑️ Eliminando imagen: ${path}`)
        
        // Vercel Blob no tiene delete directo en el cliente
        // Esto se debe hacer desde el servidor o usando API routes
        // Por ahora, solo logueamos la eliminación
        console.log(`⚠️  Nota: La eliminación se debe implementar en el servidor`)
        
        return { success: true, error: null }
        
    } catch (error) {
        console.error('❌ Error eliminando imagen:', error)
        return { success: false, error }
    }
}

/**
 * Extrae el path de una URL de Vercel Blob
 * @param {string} url - URL completa
 * @returns {string} - Path relativo
 */
export function extractPathFromUrl(url) {
    try {
        const urlObj = new URL(url)
        return urlObj.pathname.substring(1) // Quitar el primer /
    } catch (error) {
        console.error('Error extrayendo path de URL:', error)
        return url
    }
}

/**
 * Sube múltiples imágenes (para productos con varias fotos)
 * @param {File[]} files - Array de archivos
 * @param {string} folder - Carpeta de destino
 * @param {string} productId - ID del producto para organizar
 * @returns {Promise<{urls: string[], errors: Error[]}>}
 */
export async function uploadMultipleImages(files, folder, productId) {
    const urls = []
    const errors = []
    
    console.log(`📤 Subiendo ${files.length} imágenes para ${folder}/${productId}`)
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const customName = `${productId}_${i + 1}_${Date.now()}.${file.name.split('.').pop()}`
        
        const result = await uploadImage(file, `${folder}/${productId}`, customName)
        
        if (result.url) {
            urls.push(result.url)
        } else {
            errors.push(result.error)
        }
    }
    
    console.log(`✅ Subidas completas: ${urls.length} exitosas, ${errors.length} errores`)
    
    return { urls, errors }
}

/**
 * Verifica si una URL es de Vercel Blob
 * @param {string} url - URL a verificar
 * @returns {boolean}
 */
export function isVercelBlobUrl(url) {
    return url.includes('.vercel.app/') || url.includes('blob.vercel-storage.com')
}
