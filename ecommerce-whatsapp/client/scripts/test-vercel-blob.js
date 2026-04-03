/**
 * Script para probar Vercel Blob Storage
 */

import { uploadImage } from '../src/services/vercelBlobService.js'

async function testVercelBlob() {
    console.log('🧪 Probando Vercel Blob Storage...')
    
    // Verificar variable de entorno
    const token = import.meta.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
        console.log('❌ BLOB_READ_WRITE_TOKEN no está configurada')
        console.log('📝 Configúrala en Vercel → Settings → Environment Variables')
        return
    }
    
    console.log('✅ Token encontrado:', token.substring(0, 20) + '...')
    
    // Crear archivo de prueba
    const testContent = 'Test file content'
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })
    
    try {
        console.log('📤 Subiendo archivo de prueba...')
        
        const result = await uploadImage(testFile, 'test', 'test-upload')
        
        if (result.error) {
            console.log('❌ Error en upload:', result.error)
            return
        }
        
        console.log('✅ Upload exitoso!')
        console.log('🔗 URL:', result.url)
        
        // Probar acceso a la URL
        const response = await fetch(result.url)
        if (response.ok) {
            console.log('✅ Archivo accesible públicamente')
        } else {
            console.log('❌ Error accediendo al archivo:', response.status)
        }
        
    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

testVercelBlob()
