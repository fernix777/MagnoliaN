import { trackServerAddToCart } from '../facebookCAPI.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { product, quantity, user, eventSourceUrl } = req.body || {}

    if (!product || !quantity) {
      res.status(400).json({ success: false, error: 'Missing product or quantity' })
      return
    }

    const result = await trackServerAddToCart(product, quantity, user, eventSourceUrl || '')
    res.status(200).json({ success: !!result, data: result })
  } catch (error) {
    console.error('Error tracking add to cart (serverless):', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
