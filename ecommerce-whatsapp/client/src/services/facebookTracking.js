// client/src/services/facebookTracking.js
// Servicio para tracking dual: Pixel + CAPI

/**
 * Obtener cookies de Facebook para tracking
 */
const getFacebookCookies = () => {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  return {
    fbp: cookies._fbp || null,
    fbc: cookies._fbc || null
  };
};

/**
 * Obtener datos del usuario actual
 */
const getUserData = (customData = {}) => {
  const { fbp, fbc } = getFacebookCookies();
  
  return {
    fbp,
    fbc,
    client_ip_address: customData.client_ip_address, // Se obtiene del servidor
    client_user_agent: navigator.userAgent,
    ...customData
  };
};

/**
 * Generar event_id único para deduplicación
 */
const generateEventId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Enviar evento tanto al Pixel como al Servidor
 */
const trackDualEvent = async (pixelEvent, serverEndpoint, eventData) => {
  const eventId = generateEventId();
  const eventSourceUrl = window.location.href;
  const userData = getUserData(eventData.user);

  // 1. Pixel Event (Browser)
  if (typeof fbq !== 'undefined') {
    fbq('track', pixelEvent, eventData.pixelData || {}, {
      eventID: eventId
    });
  }

  // 2. Server Event (CAPI)
  try {
    const response = await fetch(serverEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...eventData.serverData,
        user: userData,
        eventSourceUrl,
        eventId
      })
    });

    if (!response.ok) {
      console.error('Error en CAPI server event:', await response.text());
    }
    
    const result = await response.json();
    console.log(`✅ Dual tracking enviado: ${pixelEvent}`, result);
    return result;
  } catch (error) {
    console.error('Error enviando evento al servidor:', error);
    return null;
  }
};

/**
 * EVENTOS PRINCIPALES
 */

// Ver Producto
export const trackViewContent = async (product) => {
  return trackDualEvent(
    'ViewContent',
    '/api/facebook/track-view',
    {
      pixelData: {
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        value: product.base_price || product.price,
        currency: 'ARS'
      },
      serverData: {
        product: {
          id: product.id,
          name: product.name,
          base_price: product.base_price || product.price
        }
      }
    }
  );
};

// Agregar al Carrito
export const trackAddToCart = async (product, quantity = 1) => {
  const value = (product.base_price || product.price) * quantity;
  
  return trackDualEvent(
    'AddToCart',
    '/api/facebook/track-add-to-cart',
    {
      pixelData: {
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        value,
        currency: 'ARS'
      },
      serverData: {
        product: {
          id: product.id,
          name: product.name,
          base_price: product.base_price || product.price
        },
        quantity
      }
    }
  );
};

// Iniciar Checkout
export const trackInitiateCheckout = async (cart) => {
  const cartTotal = cart.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  return trackDualEvent(
    'InitiateCheckout',
    '/api/facebook/track-checkout',
    {
      pixelData: {
        content_type: 'product',
        value: cartTotal,
        currency: 'ARS',
        num_items: itemsCount
      },
      serverData: {
        cartTotal,
        itemsCount
      }
    }
  );
};

// Compra Completada
export const trackPurchase = async (order) => {
  return trackDualEvent(
    'Purchase',
    '/api/facebook/track-purchase',
    {
      pixelData: {
        content_type: 'product',
        value: order.total,
        currency: 'ARS',
        content_ids: order.items.map(item => item.product_id)
      },
      serverData: {
        order: {
          id: order.id,
          total: order.total,
          items: order.items.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price
          })),
          user: order.user || {}
        }
      }
    }
  );
};

// PageView (Solo Pixel - ya se envía automáticamente)
export const trackPageView = () => {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'PageView');
  }
};

export default {
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  trackPageView
};
