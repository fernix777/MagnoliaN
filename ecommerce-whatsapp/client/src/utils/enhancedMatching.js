// client/src/utils/enhancedMatching.js
// Enhanced Matching para mejorar Event Match Quality

/**
 * Configurar Enhanced Matching en el Pixel
 * Llamar cuando el usuario inicia sesión o completa un formulario
 */
export const setupEnhancedMatching = (userData) => {
  if (typeof fbq === 'undefined') return;

  const matchingData = {};

  // Email (el más importante para matching)
  if (userData.email) {
    matchingData.em = userData.email;
  }

  // Teléfono
  if (userData.phone) {
    matchingData.ph = userData.phone;
  }

  // Nombre
  if (userData.firstName) {
    matchingData.fn = userData.firstName;
  }

  // Apellido
  if (userData.lastName) {
    matchingData.ln = userData.lastName;
  }

  // Código postal
  if (userData.zip) {
    matchingData.zp = userData.zip;
  }

  // Ciudad
  if (userData.city) {
    matchingData.ct = userData.city;
  }

  // Estado/Provincia
  if (userData.state) {
    matchingData.st = userData.state;
  }

  // País
  if (userData.country) {
    matchingData.country = userData.country;
  }

  // Actualizar el Pixel con los datos
  fbq('init', '1613812252958290', matchingData);
  
  console.log('✅ Enhanced Matching configurado:', matchingData);
};

/**
 * Limpiar Enhanced Matching (logout)
 */
export const clearEnhancedMatching = () => {
  if (typeof fbq === 'undefined') return;
  
  // Re-inicializar sin datos
  fbq('init', '1613812252958290');
  console.log('🔄 Enhanced Matching limpiado');
};

/**
 * Obtener datos de usuario para Enhanced Matching desde AuthContext
 */
export const getUserDataForMatching = (user) => {
  if (!user) return null;
  
  return {
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    city: user.city,
    state: user.state,
    zip: user.zip,
    country: user.country || 'ar'
  };
};
