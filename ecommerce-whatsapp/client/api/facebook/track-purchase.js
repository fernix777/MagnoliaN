import { trackServerPurchase } from '../facebookCAPI.js'

export default async function handler(req, res) {
  console.log('🔍 track-purchase called:', { method: req.method, body: req.body })
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method)
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { order, eventSourceUrl, eventId } = req.body || {}
    console.log('📦 Parsed payload:', { order, eventSourceUrl })

    if (!order) {
      console.log('❌ Missing order payload')
      res.status(400).json({ success: false, error: 'Missing order payload' })
      return
    }

    console.log('🚀 Calling trackServerPurchase...')
    const result = await trackServerPurchase(order, eventSourceUrl || '', eventId)
    console.log('✅ trackServerPurchase result:', result)

    res.status(200).json({ success: !!result, data: result })
  } catch (error) {
    console.error('❌ Error tracking purchase (serverless):', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
