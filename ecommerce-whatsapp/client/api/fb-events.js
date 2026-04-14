import { 
  trackServerPageView, 
  trackServerViewContent, 
  trackServerAddToCart, 
  trackServerInitiateCheckout, 
  trackServerPurchase 
} from '../src/lib/facebookCAPI.js'

export default async function handler(req, res) {
  // Manejar GET para salud y pruebas
  if (req.method === 'GET') {
    const { action } = req.query
    if (action === 'health' || action === 'gateway-health') {
      return res.status(200).json({ 
        success: true, 
        status: 'UP', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
      })
    }
    return res.status(200).json({ message: 'Facebook API Router Active' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let { action } = req.query
  if (action && action.startsWith('track-')) {
    action = action.replace('track-', '')
  }

  const { product, user, eventSourceUrl, eventId, cartTotal, itemsCount, order } = req.body || {}

  try {
    let result
    console.log(`🚀 FB Event Action Original: ${req.query.action} -> Normalized: ${action}`, { eventId })

    switch (action) {
      case 'pageview':
        result = await trackServerPageView(eventSourceUrl, user, eventId)
        break
      case 'view':
      case 'viewcontent':
        result = await trackServerViewContent(product, user, eventSourceUrl, eventId)
        break
      case 'add-to-cart':
      case 'addtocart':
        result = await trackServerAddToCart(product, user, eventSourceUrl, eventId)
        break
      case 'checkout':
      case 'initiatecheckout':
        result = await trackServerInitiateCheckout(cartTotal, itemsCount, user, eventSourceUrl, eventId)
        break
      case 'purchase':
        result = await trackServerPurchase(order, eventSourceUrl, eventId)
        break
      case 'health':
      case 'gateway-health':
      case 'test':
        return res.status(200).json({ success: true, status: 'UP' })
      default:
        return res.status(400).json({ success: false, error: `Unknown action: ${action}` })
    }

    return res.status(200).json({ success: !!result, data: result })
  } catch (error) {
    console.error(`Error in FB Event [${action}]:`, error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
