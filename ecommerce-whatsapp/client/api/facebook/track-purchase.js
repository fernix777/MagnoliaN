import { trackServerPurchase } from '../facebookCAPI'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { order, eventSourceUrl } = req.body || {}

    if (!order) {
      res.status(400).json({ success: false, error: 'Missing order payload' })
      return
    }

    const result = await trackServerPurchase(order, eventSourceUrl || '')

    res.status(200).json({ success: !!result, data: result })
  } catch (error) {
    console.error('Error tracking purchase (serverless):', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
