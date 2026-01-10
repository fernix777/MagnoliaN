// src/utils/facebookPixel.js

export const fbq = (...args) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args);
  }
};

// Eventos comunes
export const trackPageView = () => {
  fbq('track', 'PageView');
};

export const trackViewContent = (productName, price, currency = 'ARS') => {
  fbq('track', 'ViewContent', {
    content_name: productName,
    value: price,
    currency: currency
  });
};

export const trackAddToCart = (productName, price, currency = 'ARS') => {
  fbq('track', 'AddToCart', {
    content_name: productName,
    value: price,
    currency: currency
  });
};

export const trackInitiateCheckout = (value, currency = 'ARS') => {
  fbq('track', 'InitiateCheckout', {
    value: value,
    currency: currency
  });
};

export const trackPurchase = (value, currency = 'ARS', orderId) => {
  fbq('track', 'Purchase', {
    value: value,
    currency: currency,
    transaction_id: orderId
  });
};

export const trackSearch = (searchString) => {
  fbq('track', 'Search', {
    search_string: searchString
  });
};
