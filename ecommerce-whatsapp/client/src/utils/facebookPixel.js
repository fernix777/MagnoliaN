// src/utils/facebookPixel.js

// Función helper para obtener parámetros del Parameter Builder
const getEnhancedParams = () => {
  if (typeof window === 'undefined' || typeof window.clientParamBuilder === 'undefined') {
    return {};
  }

  const params = {};

  // Obtener fbp (Facebook Browser Pixel)
  const fbp = window.clientParamBuilder.getFbp();
  if (fbp) params.fbp = fbp;

  // Obtener fbc (Facebook Click ID)
  const fbc = window.clientParamBuilder.getFbc();
  if (fbc) params.fbc = fbc;

  // Obtener IP del cliente (si está disponible)
  const clientIp = window.clientParamBuilder.getClientIpAddress();
  if (clientIp) params.client_ip_address = clientIp;

  return params;
};

export const fbq = (...args) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args);
  }
};

// Eventos con parámetros mejorados
export const trackPageView = () => {
  const enhancedParams = getEnhancedParams();
  fbq('track', 'PageView', enhancedParams);
};

export const trackViewContent = (productName, price, currency = 'ARS', productId = null) => {
  const enhancedParams = {
    ...getEnhancedParams(),
    content_name: productName,
    content_ids: productId ? [productId] : [],
    content_type: 'product',
    value: price,
    currency: currency
  };
  fbq('track', 'ViewContent', enhancedParams);
};

export const trackAddToCart = (productName, price, currency = 'ARS', productId = null, quantity = 1) => {
  const enhancedParams = {
    ...getEnhancedParams(),
    content_name: productName,
    content_ids: productId ? [productId] : [],
    content_type: 'product',
    value: price,
    currency: currency,
    quantity: quantity
  };
  fbq('track', 'AddToCart', enhancedParams);
};

export const trackInitiateCheckout = (value, currency = 'ARS', numItems = 0, contentIds = []) => {
  const enhancedParams = {
    ...getEnhancedParams(),
    value: value,
    currency: currency,
    num_items: numItems,
    content_ids: contentIds
  };
  fbq('track', 'InitiateCheckout', enhancedParams);
};

export const trackPurchase = (value, currency = 'ARS', orderId, contentIds = [], numItems = 0) => {
  const enhancedParams = {
    ...getEnhancedParams(),
    value: value,
    currency: currency,
    transaction_id: orderId,
    content_ids: contentIds,
    num_items: numItems,
    content_type: 'product'
  };
  fbq('track', 'Purchase', enhancedParams);
};

export const trackSearch = (searchString) => {
  const enhancedParams = {
    ...getEnhancedParams(),
    search_string: searchString
  };
  fbq('track', 'Search', enhancedParams);
};

// Función para hashear PII (información personal)
export const hashPII = (value, dataType) => {
  if (typeof window === 'undefined' || typeof window.clientParamBuilder === 'undefined' || !value) {
    return null;
  }

  // dataType puede ser: 'email', 'phone', 'first_name', 'last_name', 
  // 'date_of_birth', 'gender', 'city', 'state', 'zip_code', 'country', 'external_id'
  return window.clientParamBuilder.getNormalizedAndHashedPII(value, dataType);
};

// Función avanzada para trackear con datos de usuario
export const trackPurchaseWithUserData = (orderData) => {
  const enhancedParams = {
    ...getEnhancedParams(),
    value: orderData.total,
    currency: 'ARS',
    transaction_id: orderData.orderId,
    content_ids: orderData.productIds || [],
    num_items: orderData.numItems || 0,
    content_type: 'product'
  };

  // Si tienes datos del usuario, hashéalos
  const userData = {};
  if (orderData.email) {
    userData.em = hashPII(orderData.email, 'email');
  }
  if (orderData.phone) {
    userData.ph = hashPII(orderData.phone, 'phone');
  }
  if (orderData.firstName) {
    userData.fn = hashPII(orderData.firstName, 'first_name');
  }
  if (orderData.lastName) {
    userData.ln = hashPII(orderData.lastName, 'last_name');
  }
  if (orderData.city) {
    userData.ct = hashPII(orderData.city, 'city');
  }
  if (orderData.state) {
    userData.st = hashPII(orderData.state, 'state');
  }
  if (orderData.zipCode) {
    userData.zp = hashPII(orderData.zipCode, 'zip_code');
  }

  // Trackear con datos de usuario
  if (Object.keys(userData).length > 0) {
    fbq('track', 'Purchase', enhancedParams, { eventID: orderData.orderId, userData });
  } else {
    fbq('track', 'Purchase', enhancedParams);
  }
};
