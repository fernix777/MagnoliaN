/**
 * Facebook Conversion API Configuration
 * Configuración para rastrear conversiones en Facebook Ads
 */

export const FACEBOOK_CONFIG = {
    PIXEL_ID: import.meta.env.VITE_FACEBOOK_PIXEL_ID || '',
    ACCESS_TOKEN: import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN || '',
    EVENT_SOURCE_ID: import.meta.env.VITE_FACEBOOK_EVENT_SOURCE_ID || '',
    API_VERSION: 'v18.0'
};

/**
 * Validar que las credenciales están configuradas
 */
export const isFacebookConfigured = () => {
    return !!(FACEBOOK_CONFIG.PIXEL_ID && FACEBOOK_CONFIG.ACCESS_TOKEN);
};

/**
 * Tipos de eventos a rastrear
 */
export const FACEBOOK_EVENTS = {
    VIEW_CONTENT: 'ViewContent',
    ADD_TO_CART: 'AddToCart',
    INITIATE_CHECKOUT: 'InitiateCheckout',
    PURCHASE: 'Purchase',
    COMPLETE_REGISTRATION: 'CompleteRegistration',
    SEARCH: 'Search',
    CONTACT: 'Contact',
    LEAD: 'Lead'
};

/**
 * Estructura base de un evento
 */
export const EVENT_TEMPLATE = {
    data: {
        event_name: null,
        event_time: Math.floor(Date.now() / 1000), // Unix timestamp
        event_source_url: typeof window !== 'undefined' ? window.location.href : '',
        user_data: {
            em: null, // hashed email
            ph: null, // hashed phone
            fn: null, // hashed first name
            ln: null, // hashed last name
            ge: null, // hashed gender
            db: null, // hashed date of birth
            external_id: null // user ID externo
        },
        custom_data: {
            value: null,
            currency: 'ARS',
            content_name: null,
            content_type: 'product',
            content_id: null,
            contents: []
        }
    }
};
