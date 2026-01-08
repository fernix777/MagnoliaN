/**
 * Facebook Conversion API Server Service
 * Servicio para enviar eventos de conversión a Facebook desde el servidor
 * Proporciona máxima precisión y evita problemas de ad-blockers
 */

import crypto from 'crypto';

/**
 * Hash de string usando SHA-256 (requerido por Facebook)
 */
const hashData = (data) => {
    if (!data) return null;
    try {
        // Normalizar: lowercase, trim, remove spaces
        const normalized = String(data).toLowerCase().trim().replace(/\s+/g, '');
        return crypto.createHash('sha256').update(normalized).digest('hex');
    } catch (error) {
        console.error('Error al hacer hash:', error);
        return null;
    }
};

/**
 * Preparar datos de usuario con hash
 */
const prepareUserData = (user = {}) => {
    const userData = {};

    // Datos básicos (Hasheados)
    if (user.email) userData.em = hashData(user.email);
    if (user.phone) userData.ph = hashData(user.phone);
    if (user.first_name) userData.fn = hashData(user.first_name);
    if (user.last_name) userData.ln = hashData(user.last_name);

    // Ubicación (Hasheados)
    if (user.city) userData.ct = hashData(user.city);
    if (user.state) userData.st = hashData(user.state);
    if (user.zip) userData.zp = hashData(user.zip);
    if (user.country) userData.country = hashData(user.country);

    // Identificadores de Facebook (NO hasheados)
    userData.fbp = user.fbp || null;
    userData.fbc = user.fbc || null;

    // Identificador externo
    if (user.user_id || user.id) {
        userData.external_id = user.user_id || user.id;
    }

    // Datos del navegador
    if (user.client_ip_address) {
        userData.client_ip_address = user.client_ip_address;
    }
    if (user.client_user_agent) {
        userData.client_user_agent = user.client_user_agent;
    }

    return userData;
};

/**
 * Enviar evento a Facebook Conversion API desde el servidor
 */
export async function trackServerEvent(eventName, eventData = {}) {
    const pixelId = process.env.FB_PIXEL_ID;
    const accessToken = process.env.FB_ACCESS_TOKEN;
    const apiVersion = 'v18.0';

    if (!pixelId || !accessToken) {
        console.warn('Facebook Conversion API no está configurada en el servidor. Falta FB_PIXEL_ID o FB_ACCESS_TOKEN');
        return null;
    }

    try {
        const userData = prepareUserData(eventData.user || {});

        // Generar ID único para deduplicación
        const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const payload = {
            data: [
                {
                    event_name: eventName,
                    event_id: eventId,
                    event_time: Math.floor(Date.now() / 1000),
                    event_source_url: eventData.event_source_url || '',
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
            test_event_code: process.env.FB_TEST_EVENT_CODE // Opcional: para testing
        };

        const response = await fetch(
            `https://graph.facebook.com/${apiVersion}/${pixelId}/events`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...payload,
                    access_token: accessToken
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Error en Facebook Conversion API (Server):', error);
            return null;
        }

        const result = await response.json();
        console.log(`✅ Evento Facebook registrado (Server-Side): ${eventName}`, result);
        return result;

    } catch (error) {
        console.error('Error al rastrear evento Facebook desde servidor:', error);
        return null;
    }
}

/**
 * Rastrear visualización de contenido
 */
export async function trackServerViewContent(product, user = null, eventSourceUrl = '') {
    return trackServerEvent('ViewContent', {
        user,
        content_id: product.id,
        content_name: product.name,
        value: product.base_price || product.price,
        event_source_url: eventSourceUrl,
        contents: [
            {
                id: product.id,
                quantity: 1,
                delivery_category: 'home_delivery'
            }
        ]
    });
}

/**
 * Rastrear agregar al carrito
 */
export async function trackServerAddToCart(product, quantity, user = null, eventSourceUrl = '') {
    return trackServerEvent('AddToCart', {
        user,
        content_id: product.id,
        content_name: product.name,
        value: (product.base_price || product.price) * quantity,
        event_source_url: eventSourceUrl,
        contents: [
            {
                id: product.id,
                quantity: quantity,
                delivery_category: 'home_delivery'
            }
        ]
    });
}

/**
 * Rastrear iniciación de checkout
 */
export async function trackServerInitiateCheckout(cartTotal, itemsCount, user = null, eventSourceUrl = '') {
    return trackServerEvent('InitiateCheckout', {
        user,
        value: cartTotal,
        event_source_url: eventSourceUrl,
        content_type: 'product_group',
        contents: [
            {
                quantity: itemsCount,
                delivery_category: 'home_delivery'
            }
        ]
    });
}

/**
 * Rastrear compra/conversión
 */
export async function trackServerPurchase(order, eventSourceUrl = '') {
    return trackServerEvent('Purchase', {
        user: order.user,
        value: order.total,
        content_id: order.id,
        content_name: `Order #${order.id}`,
        event_source_url: eventSourceUrl,
        contents: order.items.map(item => ({
            id: item.product_id,
            quantity: item.quantity,
            item_price: item.price,
            title: item.product_name,
            delivery_category: 'home_delivery'
        }))
    });
}

/**
 * Rastrear registro completado
 */
export async function trackServerCompleteRegistration(user, eventSourceUrl = '') {
    return trackServerEvent('CompleteRegistration', {
        user,
        event_source_url: eventSourceUrl,
        content_name: 'Registration',
        content_type: 'lead'
    });
}

/**
 * Rastrear búsqueda
 */
export async function trackServerSearch(searchQuery, resultsCount, user = null, eventSourceUrl = '') {
    return trackServerEvent('Search', {
        user,
        event_source_url: eventSourceUrl,
        content_name: searchQuery,
        content_type: 'search_results',
        value: resultsCount
    });
}

/**
 * Rastrear contacto/consulta
 */
export async function trackServerContact(message, user = null, eventSourceUrl = '') {
    return trackServerEvent('Contact', {
        user,
        event_source_url: eventSourceUrl,
        content_name: 'Contact',
        content_type: 'inquiry',
        value: message.length
    });
}

/**
 * Rastrear lead
 */
export async function trackServerLead(leadData, eventSourceUrl = '') {
    return trackServerEvent('Lead', {
        user: leadData.user,
        event_source_url: eventSourceUrl,
        content_name: leadData.lead_type || 'Lead',
        content_type: 'lead',
        value: leadData.value || 0
    });
}

export default {
    trackServerEvent,
    trackServerViewContent,
    trackServerAddToCart,
    trackServerInitiateCheckout,
    trackServerPurchase,
    trackServerCompleteRegistration,
    trackServerSearch,
    trackServerContact,
    trackServerLead
};
