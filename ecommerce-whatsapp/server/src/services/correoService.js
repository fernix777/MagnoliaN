import axios from 'axios'

class CorreoArgentinoService {
  constructor() {
    this.apiKey = process.env.CORREO_ARGENTINO_API_KEY
    this.agreement = process.env.CORREO_ARGENTINO_AGREEMENT
    this.baseURL = process.env.CORREO_ARGENTINO_ENV === 'production'
      ? 'https://api.correoargentino.com.ar/micorreo/v1'
      : 'https://apitest.correoargentino.com.ar/micorreo/v1'
    this.defaultOriginPostalCode = process.env.STORE_POSTAL_CODE || '4600'
  }

  getHeaders() {
    return {
      'Authorization': `Apikey ${this.apiKey}`,
      'agreement': this.agreement,
      'Content-Type': 'application/json'
    }
  }

  async quoteShipping(postalCodeDestination, items) {
    try {
      const totalWeight = items.reduce((sum, item) => 
        sum + (item.package_weight || 100) * item.quantity, 0
      )

      const dimensions = this.calculatePackageDimensions(items)

      const response = await axios.get(`${this.baseURL}/rates`, {
        headers: this.getHeaders(),
        params: {
          postalCodeOrigin: this.defaultOriginPostalCode,
          postalCodeDestination: postalCodeDestination,
          weight: Math.min(totalWeight, 30000),
          height: dimensions.height,
          width: dimensions.width,
          length: dimensions.length
        }
      })

      return response.data
    } catch (error) {
      console.error('Error quoting shipping:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Error al cotizar envío')
    }
  }

  async getAgencies(province = null, pickupAvailability = null, packageReception = null) {
    try {
      const params = {}
      if (province) params.stateId = province
      if (pickupAvailability !== null) params.pickup_availability = pickupAvailability
      if (packageReception !== null) params.package_reception = packageReception

      const response = await axios.get(`${this.baseURL}/agencies`, {
        headers: this.getHeaders(),
        params
      })

      return response.data
    } catch (error) {
      console.error('Error fetching agencies:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Error al obtener agencias')
    }
  }

  async trackShipment(trackingNumbers) {
    try {
      const response = await axios.get(`${this.baseURL}/tracking`, {
        headers: this.getHeaders(),
        data: trackingNumbers.map(tn => ({ trackingNumber: tn }))
      })

      return response.data
    } catch (error) {
      console.error('Error tracking shipment:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Error al rastrear envío')
    }
  }

  calculatePackageDimensions(items) {
    let maxDimensions = { height: 0, width: 0, length: 0 }

    items.forEach(item => {
      maxDimensions.height = Math.max(maxDimensions.height, item.package_height || 10)
      maxDimensions.width = Math.max(maxDimensions.width, item.package_width || 10)
      maxDimensions.length = Math.max(maxDimensions.length, item.package_length || 10)
    })

    return {
      height: maxDimensions.height || 10,
      width: maxDimensions.width || 10,
      length: maxDimensions.length || 10
    }
  }
}

export default new CorreoArgentinoService()