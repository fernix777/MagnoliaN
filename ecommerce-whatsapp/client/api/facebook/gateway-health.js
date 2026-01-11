export default async function handler(req, res) {
  // Simple health check for Meta gateway validation
  res.status(200).json({
    success: true,
    message: 'Gateway endpoint is ready',
    timestamp: new Date().toISOString()
  })
}
