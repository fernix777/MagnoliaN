import { trackServerAddToCart } from '../facebookCAPI.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    console.log('🚀 Calling trackServerAddToCart...')
    const result = await trackServerAddToCart(product, user, eventSourceUrl || '', eventId)
    res.status(200).json({ success: !!result, data: result })
  } catch (error) {
    console.error('Error tracking add to cart (serverless):', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
