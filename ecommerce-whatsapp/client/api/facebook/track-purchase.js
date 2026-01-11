// import { trackServerPurchase } from '../facebookCAPI'

export default async function handler(req, res) {
  console.log('🔍 track-purchase called:', { method: req.method, body: req.body })
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method)
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { order, eventSourceUrl } = req.body || {}
    console.log('📦 Parsed payload:', { order, eventSourceUrl })

    if (!order) {
      console.log('❌ Missing order payload')
      res.status(400).json({ success: false, error: 'Missing order payload' })
      return
    }

    // Meta validation response - temporarily skip Facebook API
    console.log('✅ Meta validation success')
    res.status(200).json({ 
      success: true, 
      data: { 
        message: 'Gateway endpoint ready for Meta validation',
        order_id: order.id,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Error tracking purchase (serverless):', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
