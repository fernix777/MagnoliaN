// Determina la URL base del API según el entorno
const getApiBaseUrl = () => {
    // En desarrollo: usa URLs relativas (proxy de Vite)
    // En producción (Vercel): también usa URLs relativas (mismo dominio para frontend y serverless functions)
    // En producción (otros): usa variable de entorno VITE_API_BASE_URL si está configurada
    if (import.meta.env.DEV) {
        return ''
    }
    
    // En producción, busca la URL del backend en:
    // 1. Variable de entorno VITE_API_BASE_URL (solo si el backend está en otro dominio)
    // 2. URL relativa por defecto (para Vercel donde frontend + functions están en mismo dominio)
    return import.meta.env.VITE_API_BASE_URL || ''
}

export const API_BASE_URL = getApiBaseUrl()

export const getApiUrl = (endpoint) => {
    if (endpoint.startsWith('http')) {
        return endpoint
    }
    return `${API_BASE_URL}${endpoint}`
}

console.log(`[API Config] Environment: ${import.meta.env.DEV ? 'development' : 'production'}`)
console.log(`[API Config] Base URL: "${API_BASE_URL}" - URLs relativas en mismo dominio`)
