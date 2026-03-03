// src/utils/facebookPixel.js

export const fbq = (...args) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args);
  }
};

// Eventos comunes
export const trackPageView = (eventID = null) => {
  if (eventID) {
    fbq('track', 'PageView', {}, { eventID });
  } else {
    fbq('track', 'PageView');
  }
};

export const trackViewContent = (productId, productName, price, currency = 'ARS', eventID = null) => {
  const options = {
    content_ids: [productId.toString()],
    content_name: productName,
    content_type: 'product',
    value: price,
    currency: currency
  };
  
  if (eventID) {
    fbq('track', 'ViewContent', options, { eventID });
  } else {
    fbq('track', 'ViewContent', options);
  }
};

export const trackAddToCart = (productId, productName, price, currency = 'ARS', eventID = null) => {
  const options = {
    content_ids: [productId.toString()],
    content_name: productName,
    content_type: 'product',
    value: price,
    currency: currency
  };
  
  if (eventID) {
    fbq('track', 'AddToCart', options, { eventID });
  } else {
    fbq('track', 'AddToCart', options);
  }
};

export const trackInitiateCheckout = (value, contentIds = [], currency = 'ARS', eventID = null) => {
  const options = {
    content_ids: contentIds.map(id => id.toString()),
    content_type: 'product',
    value: value,
    currency: currency
  };
  
  if (eventID) {
    fbq('track', 'InitiateCheckout', options, { eventID });
  } else {
    fbq('track', 'InitiateCheckout', options);
  }
};

export const trackPurchase = (value, contentIds = [], currency = 'ARS', orderId, eventID = null) => {
  const options = {
    content_ids: contentIds.map(id => id.toString()),
    content_type: 'product',
    value: value,
    currency: currency,
    transaction_id: orderId
  };
  
  if (eventID) {
    fbq('track', 'Purchase', options, { eventID });
  } else {
    fbq('track', 'Purchase', options);
  }
};

export const trackSearch = (searchString) => {
  fbq('track', 'Search', {
    search_string: searchString
  });
};
