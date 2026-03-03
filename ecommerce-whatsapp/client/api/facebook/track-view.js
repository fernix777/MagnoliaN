import { trackServerViewContent } from '../facebookCAPI.js'

export default async function handler(req, res) {
  console.log('🔍 track-view called:', { method: req.method, body: req.body })
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method)
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { product, user, eventSourceUrl, eventId } = req.body || {}
    console.log('📦 Parsed payload:', { product, user, eventSourceUrl, eventId })

    if (!product) {
      console.log('❌ Missing product')
      res.status(400).json({ success: false, error: 'Missing product' })
      return
    }

    console.log('🚀 Calling trackServerViewContent...')
    const result = await trackServerViewContent(product, user, eventSourceUrl || '', eventId)
    console.log('✅ trackServerViewContent result:', result)
    res.status(200).json({ success: !!result, data: result })
  } catch (error) {
    console.error('❌ Error tracking view content (serverless):', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
