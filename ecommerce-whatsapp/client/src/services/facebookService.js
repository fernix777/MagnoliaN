/**
 * Facebook Conversion API Service
 * Servicio para enviar eventos de conversión a Facebook con alta precisión
 */

import { FACEBOOK_CONFIG, FACEBOOK_EVENTS, isFacebookConfigured } from '../config/facebook';

/**
 * Obtener valor de una cookie por nombre
 */
const getCookie = (name) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

/**
 * Hash de string usando SHA-256 (requerido por Facebook)
 * Compatible con el navegador
 */
const hashString = async (str) => {
    if (!str) return null;
    try {
        // Normalizar: lowercase, trim, remove spaces
        const normalized = str.toLowerCase().trim().replace(/\s+/g, '');
        const buffer = new TextEncoder().encode(normalized);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error('Error al hacer hash:', error);
        return null;
    }
};

/**
 * Preparar datos de usuario con hash y parámetros de alta precisión
 */
const prepareUserData = async (user) => {
    const userData = {};

    // Datos básicos (Hasheados)
    if (user?.email) userData.em = await hashString(user.email);
    if (user?.phone) userData.ph = await hashString(user.phone);
    if (user?.first_name) userData.fn = await hashString(user.first_name);
    if (user?.last_name) userData.ln = await hashString(user.last_name);

    // Ubicación (Hasheados)
    if (user?.city) userData.ct = await hashString(user.city);
    if (user?.state) userData.st = await hashString(user.state);
    if (user?.zip) userData.zp = await hashString(user.zip);
    if (user?.country) userData.country = await hashString(user.country);

    // Identificadores de Facebook (NO hasheados)
    userData.fbp = getCookie('_fbp');
    userData.fbc = getCookie('_fbc');

    // Identificador externo
    if (user?.user_id || user?.id) {
        userData.external_id = user.user_id || user.id;
    }

    // Datos del navegador
    if (typeof navigator !== 'undefined') {
        userData.client_user_agent = navigator.userAgent;
    }

    return userData;
};

/**
 * Generar ID único para evento (para deduplicación)
 */
const generateEventId = () => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Enviar evento a Facebook Conversion API
 */
export const trackFacebookEvent = async (eventName, eventData = {}) => {
    if (!isFacebookConfigured()) {
        console.warn('Facebook Conversion API no está configurada. Falta PIXEL_ID o ACCESS_TOKEN');
        return null;
    }

    try {
        const userData = eventData.user ? await prepareUserData(eventData.user) : await prepareUserData({});
        
        // Generar ID único para deduplicación
        const eventId = generateEventId();

        const payload = {
            data: [
                {
                    event_name: eventName,
                    event_id: eventId, // Agregado para deduplicación
                    event_time: Math.floor(Date.now() / 1000),
                    event_source_url: typeof window !== 'undefined' ? window.location.href : '',
                    action_source: 'website',
                    user_data: userData,
                    custom_data: {
                        value: eventData.value || undefined,
                        currency: eventData.currency || 'ARS',
                        content_name: eventData.content_name || undefined,
                        content_type: eventData.content_type || 'product',
                        content_id: eventData.content_id || undefined,
                        contents: eventData.contents || []
                    }
                }
            ],
            test_event_code: import.meta.env.VITE_FACEBOOK_TEST_EVENT_CODE // Opcional: para testing
        };

        const response = await fetch(
            `https://graph.facebook.com/${FACEBOOK_CONFIG.API_VERSION}/${FACEBOOK_CONFIG.PIXEL_ID}/events`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...payload,
                    access_token: FACEBOOK_CONFIG.ACCESS_TOKEN
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Error en Facebook Conversion API:', error);
            return null;
        }

        const result = await response.json();
        console.log(`✅ Evento Facebook registrado (Alta Precisión): ${eventName}`, result);
        
        // También enviar al Pixel del navegador para deduplicación
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', eventName, {}, { eventID: eventId });
        }
        
        return result;

    } catch (error) {
        console.error('Error al rastrear evento Facebook:', error);
        return null;
    }
};

/**
 * Rastrear visualización de contenido
 */
export const trackViewContent = async (product, user = null) => {
    return trackFacebookEvent(FACEBOOK_EVENTS.VIEW_CONTENT, {
        user,
        content_id: product.id,
        content_name: product.name,
        value: product.base_price,
        contents: [
            {
                id: product.id,
                quantity: 1,
                delivery_category: 'home_delivery'
            }
        ]
    });
};

/**
 * Rastrear agregar al carrito
 */
export const trackAddToCart = async (product, quantity, user = null) => {
    return trackFacebookEvent(FACEBOOK_EVENTS.ADD_TO_CART, {
        user,
        content_id: product.id,
        content_name: product.name,
        value: product.base_price * quantity,
        contents: [
            {
                id: product.id,
                quantity: quantity,
                delivery_category: 'home_delivery'
            }
        ]
    });
};

/**
 * Rastrear iniciación de checkout
 */
export const trackInitiateCheckout = async (cartTotal, itemsCount, user = null) => {
    return trackFacebookEvent(FACEBOOK_EVENTS.INITIATE_CHECKOUT, {
        user,
        value: cartTotal,
        content_type: 'product_group',
        contents: [
            {
                quantity: itemsCount,
                delivery_category: 'home_delivery'
            }
        ]
    });
};

/**
 * Rastrear compra/conversión
 */
export const trackPurchase = async (order) => {
    return trackFacebookEvent(FACEBOOK_EVENTS.PURCHASE, {
        user: order.user,
        value: order.total,
        content_id: order.id,
        content_name: `Order #${order.id}`,
        contents: order.items.map(item => ({
            id: item.product_id,
            quantity: item.quantity,
            item_price: item.price,
            title: item.product_name,
            delivery_category: 'home_delivery'
        }))
    });
};

/**
 * Rastrear registro completado
 */
export const trackCompleteRegistration = async (user) => {
    return trackFacebookEvent(FACEBOOK_EVENTS.COMPLETE_REGISTRATION, {
        user,
        content_name: 'Registration',
        content_type: 'lead'
    });
};

/**
 * Rastrear búsqueda
 */
export const trackSearch = async (searchQuery, resultsCount, user = null) => {
    return trackFacebookEvent(FACEBOOK_EVENTS.SEARCH, {
        user,
        content_name: searchQuery,
        content_type: 'search_results',
        value: resultsCount
    });
};

/**
 * Rastrear contacto/consulta
 */
export const trackContact = async (message, user = null) => {
    return trackFacebookEvent(FACEBOOK_EVENTS.CONTACT, {
        user,
        content_name: 'Contact',
        content_type: 'inquiry',
        value: message.length
    });
};

export default {
    trackFacebookEvent,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackCompleteRegistration,
    trackSearch,
    trackContact
};
