// Vercel Serverless Function: POST /api/delete-blob
// Elimina un archivo de Vercel Blob Storage usando el token de servidor
import { del } from '@vercel/blob'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { url } = req.body

    if (!url) {
        return res.status(400).json({ error: 'URL de archivo requerida' })
    }

    const token = process.env.VITE_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
        console.error('[delete-blob] BLOB_READ_WRITE_TOKEN no configurado')
        return res.status(500).json({ error: 'Configuración de storage incompleta' })
    }

    try {
        console.log(`🗑️ Eliminando blob: ${url}`)
        await del(url, { token })
        
        return res.status(200).json({ success: true })
    } catch (error) {
        console.error('[delete-blob] Error:', error)
        return res.status(500).json({ error: error.message })
    }
}
