/**
 * Facebook Pixel Service (Client-Side Only)
 * Rastreo simplificado usando solo Facebook Pixel del navegador
 * Sin dependencias de backend
 */

import { 
  fbq, 
  trackPageView as trackPixelPageView,
  trackViewContent as trackPixelViewContent,
  trackAddToCart as trackPixelAddToCart,
  trackInitiateCheckout as trackPixelInitiateCheckout,
  trackPurchase as trackPixelPurchase,
  trackSearch as trackPixelSearch
} from '../utils/facebookPixel';
import { setupEnhancedMatching } from '../utils/enhancedMatching';

/**
 * Obtener cookies de Facebook para tracking
 */
const getFacebookCookies = () => {
  if (typeof document === 'undefined') return { fbp: null, fbc: null };
  
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const parts = cookie.trim().split('=');
    if (parts.length === 2) {
      acc[parts[0]] = parts[1];
    }
    return acc;
  }, {});

  return {
    fbp: cookies._fbp || null,
    fbc: cookies._fbc || null
  };
};

/**
 * Generar event_id único para deduplicación
 */
const generateEventId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Rastrear vista de página (automático)
 */
export const trackPageView = async () => {
  try {
    const eventId = generateEventId();
    const { fbp, fbc } = getFacebookCookies();

    // 1. Pixel Event
    trackPixelPageView(eventId);
    
    // 2. CAPI Event
    try {
      await fetch('/api/facebook/track-pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventSourceUrl: window.location.href,
          fbp,
          fbc,
          client_user_agent: navigator.userAgent,
          eventId
        })
      });
    } catch (e) {
      console.warn('CAPI track-pageview failed');
    }
    
    return true;
  } catch (error) {
    console.error('Error tracking PageView:', error);
    return false;
  }
};

/**
 * Rastrear visualización de contenido
 */
export const trackViewContent = async (product, user = null) => {
  try {
    const productId = product.id || product.product_id;
    const price = product.base_price || product.price || 0;
    const eventId = generateEventId();
    const { fbp, fbc } = getFacebookCookies();
    
    // Configurar Enhanced Matching si hay datos de usuario
    if (user) {
      setupEnhancedMatching(user);
    }

    // 1. Pixel Event
    trackPixelViewContent(productId, product.name, price, 'ARS', eventId);
    
    // 2. CAPI Event
    try {
      await fetch('/api/facebook/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            id: productId,
            name: product.name,
            price: price
          },
          user: {
            ...user,
            fbp,
            fbc,
            client_user_agent: navigator.userAgent
          },
          eventSourceUrl: window.location.href,
          eventId
        })
      });
    } catch (e) {
      console.warn('CAPI track-view failed');
    }
    
    console.log('✅ ViewContent tracked:', { id: productId, eventId });
    return true;
  } catch (error) {
    console.error('Error tracking ViewContent:', error);
    return false;
  }
};

/**
 * Rastrear agregar al carrito
 */
export const trackAddToCart = async (product, quantity, user = null) => {
  try {
    const productId = product.id || product.product_id;
    const price = product.base_price || product.price || 0;
    const totalPrice = price * quantity;
    const eventId = generateEventId();
    const { fbp, fbc } = getFacebookCookies();
    
    if (user) setupEnhancedMatching(user);

    // 1. Pixel Event
    trackPixelAddToCart(productId, product.name, totalPrice, 'ARS', eventId);
    
    // 2. CAPI Event
    try {
      await fetch('/api/facebook/track-add-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            id: productId,
            name: product.name,
            price: price
          },
          quantity,
          user: {
            ...user,
            fbp,
            fbc,
            client_user_agent: navigator.userAgent
          },
          eventSourceUrl: window.location.href,
          eventId
        })
      });
    } catch (e) {
      console.warn('CAPI track-add-to-cart failed');
    }
    
    console.log('✅ AddToCart tracked:', { id: productId, eventId });
    return true;
  } catch (error) {
    console.error('Error tracking AddToCart:', error);
    return false;
  }
};

/**
 * Rastrear iniciación de checkout
 */
export const trackInitiateCheckout = async (cartTotal, items, user = null) => {
  try {
    const contentIds = items.map(item => item.id || item.product_id);
    const eventId = generateEventId();
    const { fbp, fbc } = getFacebookCookies();
    
    if (user) setupEnhancedMatching(user);

    // 1. Pixel Event
    trackPixelInitiateCheckout(cartTotal, contentIds, 'ARS', eventId);
    
    // 2. CAPI Event
    try {
      await fetch('/api/facebook/track-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartTotal,
          itemsCount: items.length,
          user: {
            ...user,
            fbp,
            fbc,
            client_user_agent: navigator.userAgent
          },
          eventSourceUrl: window.location.href,
          eventId
        })
      });
    } catch (e) {
      console.warn('CAPI track-checkout failed');
    }
    
    console.log('✅ InitiateCheckout tracked:', { cartTotal, eventId });
    return true;
  } catch (error) {
    console.error('Error tracking InitiateCheckout:', error);
    return false;
  }
};

/**
 * Rastrear compra completada
 */
export const trackPurchase = async (order) => {
  try {
    const orderId = order.id || order.order_id;
    const contentIds = order.items.map(item => item.id || item.product_id);
    const eventId = generateEventId();
    const { fbp, fbc } = getFacebookCookies();
    
    if (order.user) setupEnhancedMatching(order.user);

    // 1. Pixel Event
    trackPixelPurchase(order.total, contentIds, 'ARS', orderId, eventId);
    
    // 2. CAPI Event
    try {
      await fetch('/api/facebook/track-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order,
          user: {
            ...order.user,
            fbp,
            fbc,
            client_user_agent: navigator.userAgent
          },
          eventSourceUrl: window.location.href,
          eventId
        })
      });
    } catch (e) {
      console.warn('CAPI track-purchase failed');
    }
    
    console.log('✅ Purchase tracked:', { orderId, eventId });
    return true;
  } catch (error) {
    console.error('Error tracking Purchase:', error);
    return false;
  }
};

/**
 * Rastrear búsqueda
 */
export const trackSearch = (searchQuery, resultsCount, user = null) => {
  try {
    // Rastrear en Facebook Pixel
    trackPixelSearch(searchQuery);
    
    // Log para debugging
    console.log('✅ Search tracked:', {
      search_query: searchQuery,
      results_count: resultsCount,
      user: user?.email
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking Search:', error);
    return false;
  }
};

/**
 * Rastrear registro completado
 */
export const trackCompleteRegistration = (user) => {
  try {
    // Rastrear event de registro personalizado
    fbq('track', 'CompleteRegistration', {
      content_name: 'Registration',
      content_type: 'lead'
    });
    
    // Log para debugging
    console.log('✅ CompleteRegistration tracked:', {
      user: user?.email
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking CompleteRegistration:', error);
    return false;
  }
};

/**
 * Rastrear contacto/consulta
 */
export const trackContact = (message, user = null) => {
  try {
    // Rastrear event de contacto personalizado
    fbq('track', 'Contact', {
      content_name: 'Contact',
      content_type: 'inquiry'
    });
    
    // Log para debugging
    console.log('✅ Contact tracked:', {
      user: user?.email,
      message_length: message.length
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking Contact:', error);
    return false;
  }
};

export default {
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  trackCompleteRegistration,
  trackSearch,
  trackContact,
  trackPageView
};
