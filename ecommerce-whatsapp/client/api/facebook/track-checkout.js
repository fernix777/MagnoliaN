import { trackServerInitiateCheckout } from '../facebookCAPI.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { cartTotal, itemsCount, user, eventSourceUrl } = req.body || {}

    if (!cartTotal || !itemsCount) {
      res.status(400).json({ success: false, error: 'Missing cartTotal or itemsCount' })
      return
    }

    const result = await trackServerInitiateCheckout(cartTotal, itemsCount, user, eventSourceUrl || '')
    res.status(200).json({ success: !!result, data: result })
  } catch (error) {
    console.error('Error tracking checkout (serverless):', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
