import { trackServerPageView } from '../facebookCAPI.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { eventSourceUrl, user, eventId } = req.body || {}
    const result = await trackServerPageView(eventSourceUrl || '', user, eventId)
    res.status(200).json({ success: !!result, data: result })
  } catch (error) {
    console.error('Error tracking pageview (serverless):', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
