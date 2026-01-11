import { trackServerViewContent } from '../facebookCAPI.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { product, user, eventSourceUrl } = req.body || {}

    if (!product) {
      res.status(400).json({ success: false, error: 'Missing product' })
      return
    }

    const result = await trackServerViewContent(product, user, eventSourceUrl || '')
    res.status(200).json({ success: !!result, data: result })
  } catch (error) {
    console.error('Error tracking view content (serverless):', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
