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

/**
 * Rastrear visualización de contenido
 */
export const trackViewContent = (product, user = null) => {
  try {
    // Rastrear en Facebook Pixel
    trackPixelViewContent(product.name, product.base_price);
    
    // Log para debugging
    console.log('✅ ViewContent tracked:', {
      product_name: product.name,
      price: product.base_price,
      user: user?.email
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking ViewContent:', error);
    return false;
  }
};

/**
 * Rastrear agregar al carrito
 */
export const trackAddToCart = (product, quantity, user = null) => {
  try {
    // Rastrear en Facebook Pixel
    const totalPrice = (product.base_price || 0) * quantity;
    trackPixelAddToCart(product.name, totalPrice);
    
    // Log para debugging
    console.log('✅ AddToCart tracked:', {
      product_name: product.name,
      quantity: quantity,
      total_price: totalPrice,
      user: user?.email
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking AddToCart:', error);
    return false;
  }
};

/**
 * Rastrear iniciación de checkout
 */
export const trackInitiateCheckout = (cartTotal, itemsCount, user = null) => {
  try {
    // Rastrear en Facebook Pixel
    trackPixelInitiateCheckout(cartTotal);
    
    // Log para debugging
    console.log('✅ InitiateCheckout tracked:', {
      cart_total: cartTotal,
      items_count: itemsCount,
      user: user?.email
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking InitiateCheckout:', error);
    return false;
  }
};

/**
 * Rastrear compra completada
 */
export const trackPurchase = (order) => {
  try {
    // Rastrear en Facebook Pixel
    const orderId = order.id || order.order_id;
    trackPixelPurchase(order.total, 'ARS', orderId);
    
    // Log para debugging
    console.log('✅ Purchase tracked:', {
      order_id: orderId,
      total: order.total,
      items_count: order.items?.length || 0,
      user: order.user?.email
    });
    
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

/**
 * Rastrear vista de página
 */
export const trackPageView = () => {
  try {
    trackPixelPageView();
    console.log('✅ PageView tracked');
    return true;
  } catch (error) {
    console.error('Error tracking PageView:', error);
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
