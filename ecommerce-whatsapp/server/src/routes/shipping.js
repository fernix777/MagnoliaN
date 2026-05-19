import express from 'express'
import axios from 'axios'
import { supabase } from '../config/supabase.js'

const router = express.Router()

const getCorreoHeaders = () => ({
  'Authorization': `Apikey ${process.env.CORREO_ARGENTINO_API_KEY}`,
  'agreement': process.env.CORREO_ARGENTINO_AGREEMENT,
  'Content-Type': 'application/json'
})

router.post('/quote', async (req, res) => {
  try {
    const { postalCodeDestination, items } = req.body

    if (!postalCodeDestination || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'postalCodeDestination e items son requeridos' })
    }

    const totalWeight = items.reduce((sum, item) => 
      sum + (item.package_weight || 100) * item.quantity, 0
    )

    const response = await axios.get(`${process.env.CORREO_ARGENTINO_BASE_URL}/rates`, {
      headers: getCorreoHeaders(),
      params: {
        postalCodeOrigin: process.env.STORE_POSTAL_CODE || '4600',
        postalCodeDestination,
        weight: Math.min(totalWeight, 30000),
        height: Math.max(...items.map(i => i.package_height || 10)),
        width: Math.max(...items.map(i => i.package_width || 10)),
        length: Math.max(...items.map(i => i.package_length || 10))
      }
    })

    res.json(response.data)
  } catch (error) {
    console.error('Error quoting shipping:', error)
    res.status(500).json({ 
      error: error.response?.data?.message || 'Error al cotizar envío' 
    })
  }
})

router.get('/agencies', async (req, res) => {
  try {
    const { province, pickup_availability, package_reception } = req.query

    const params = {}
    if (province) params.stateId = province
    if (pickup_availability !== undefined) params.pickup_availability = pickup_availability === 'true'
    if (package_reception !== undefined) params.package_reception = package_reception === 'true'

    const response = await axios.get(`${process.env.CORREO_ARGENTINO_BASE_URL}/agencies`, {
      headers: getCorreoHeaders(),
      params
    })

    res.json(response.data)
  } catch (error) {
    console.error('Error fetching agencies:', error)
    res.status(500).json({ 
      error: error.response?.data?.message || 'Error al obtener agencias' 
    })
  }
})

router.post('/track', async (req, res) => {
  try {
    const { trackingNumbers } = req.body

    if (!trackingNumbers || !Array.isArray(trackingNumbers)) {
      return res.status(400).json({ error: 'trackingNumbers es requerido' })
    }

    const response = await axios.get(`${process.env.CORREO_ARGENTINO_BASE_URL}/tracking`, {
      headers: getCorreoHeaders(),
      data: trackingNumbers.map(tn => ({ trackingNumber: tn }))
    })

    res.json(response.data)
  } catch (error) {
    console.error('Error tracking:', error)
    res.status(500).json({ 
      error: error.response?.data?.message || 'Error al rastrear' 
    })
  }
})

export default router