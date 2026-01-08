# 🚀 Implementación Completa de Facebook Conversion API (CAPI)

## 📋 Resumen Ejecutivo

Esta guía documenta la implementación completa de Facebook Conversion API (CAPI) en el proyecto ecommerce-whatsapp de Magnolia Novedades. La implementación incluye rastreo tanto del lado del cliente como del servidor, con deduplicación de eventos para máxima precisión.

---

## ✅ Estado de Implementación

### 1. **Configuración Base** ✅ COMPLETADO
- [x] Facebook Pixel agregado en `client/index.html`
- [x] Variables de entorno configuradas en `client/.env.local`
- [x] Servicio de Facebook en `client/src/services/facebookService.js`
- [x] Configuración de credenciales en `client/src/config/facebook.js`

### 2. **Eventos Cliente-Side** ✅ COMPLETADO
- [x] **ViewContent** - Rastreo en `ProductDetail.jsx`
- [x] **AddToCart** - Rastreo en `CartContext.jsx`
- [x] **InitiateCheckout** - Rastreo en `CheckoutPage.jsx`
- [x] **Purchase** - Rastreo en `OrderConfirmation.jsx`
- [x] **CompleteRegistration** - Rastreo en `Register.jsx`
- [x] **Search** - Rastreo en `SearchPage.jsx`
- [x] **Contact** - Rastreo en `ContactPage.jsx`

### 3. **Deduplicación de Eventos** ✅ COMPLETADO
- [x] Implementado `event_id` único en cada evento
- [x] Sincronización con Pixel del navegador
- [x] Método `generateEventId()` en `facebookService.js`

### 4. **Eventos Servidor-Side** ✅ COMPLETADO
- [x] Servicio `server/src/services/facebookCAPI.js` creado
- [x] Todas las funciones de rastreo implementadas
- [x] Hash SHA-256 de datos sensibles
- [x] Variables de entorno del servidor

### 5. **Flujo de Compra** ✅ COMPLETADO
- [x] Nueva página `CheckoutPage.jsx`
- [x] Nueva página `OrderConfirmation.jsx`
- [x] Rutas integradas en `App.jsx`
- [x] Botones de navegación actualizados en `Cart.jsx`

---

## 🔧 Configuración Requerida

### **Paso 1: Variables de Entorno Cliente**

Edita `client/.env.local`:

```env
# Facebook Conversion API
VITE_FACEBOOK_PIXEL_ID=1613812252958290
VITE_FACEBOOK_ACCESS_TOKEN=EAFpzmMVWlz8BQYmHkNpTq54ES4IOZCb0a5Tzl6r4ZCuSA5VGpsV71l41GW1G4M7ThFBG2kFObGGYzGPCTqqbwkM0hhGxFRetVjzGQsNICgAsL2dsqKyfsJJZCCbWG4CLvtZClor6GkcBC5aaZBuEVQ3HASY4KT6yZBu2B1ppohTJLzjCukvC0KzoSskMPW6QZDZD
VITE_FACEBOOK_EVENT_SOURCE_ID=1613812252958290
VITE_FACEBOOK_TEST_EVENT_CODE=TEST32871
```

**Cómo obtener estos valores:**

1. **PIXEL_ID**: Ya tienes → `1613812252958290`
2. **ACCESS_TOKEN**: Ya tienes ✅
3. **EVENT_SOURCE_ID**: Ya tienes ✅ (`1613812252958290`)
4. **TEST_EVENT_CODE**: Ya tienes ✅ (`TEST32871`)

### **Paso 2: Variables de Entorno Servidor**

Crea `server/.env`:

```env
FB_PIXEL_ID=1613812252958290
FB_ACCESS_TOKEN=EAFpzmMVWlz8BQYmHkNpTq54ES4IOZCb0a5Tzl6r4ZCuSA5VGpsV71l41GW1G4M7ThFBG2kFObGGYzGPCTqqbwkM0hhGxFRetVjzGQsNICgAsL2dsqKyfsJJZCCbWG4CLvtZClor6GkcBC5aaZBuEVQ3HASY4KT6yZBu2B1ppohTJLzjCukvC0KzoSskMPW6QZDZD
FB_EVENT_SOURCE_ID=1613812252958290
FB_TEST_EVENT_CODE=TEST32871
PORT=3000
NODE_ENV=development
```

### **Paso 3: Verificar Facebook Pixel en HTML**

El Pixel ya está en `client/index.html`:

```html
<!-- Facebook Meta Pixel Code - Version mejorada con deduplicación -->
<script>
  !function(f,b,e,v,n,t,s) {
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    // ...código del pixel...
  }
```

---

## 📊 Eventos Implementados

### **1. ViewContent** (Visualización de Producto)
- **Dónde**: `ProductDetail.jsx`
- **Cuándo**: Usuario visualiza un producto
- **Datos**: ID producto, nombre, precio

### **2. AddToCart** (Agregar al Carrito)
- **Dónde**: `CartContext.jsx`
- **Cuándo**: Usuario agrega producto al carrito
- **Datos**: ID producto, nombre, precio, cantidad

### **3. InitiateCheckout** (Iniciar Compra)
- **Dónde**: `CheckoutPage.jsx`
- **Cuándo**: Usuario accede a la página de checkout
- **Datos**: Total carrito, cantidad de artículos, datos usuario

### **4. Purchase** (Compra Completada)
- **Dónde**: `OrderConfirmation.jsx`
- **Cuándo**: Compra confirmada
- **Datos**: ID orden, total, items, datos cliente

### **5. CompleteRegistration** (Registro Completado)
- **Dónde**: `Register.jsx`
- **Cuándo**: Usuario se registra exitosamente
- **Datos**: Datos usuario

### **6. Search** (Búsqueda)
- **Dónde**: `SearchPage.jsx`
- **Cuándo**: Usuario realiza una búsqueda
- **Datos**: Query, cantidad de resultados

### **7. Contact** (Contacto)
- **Dónde**: `ContactPage.jsx`
- **Cuándo**: Usuario envía formulario de contacto
- **Datos**: Mensaje, datos usuario

---

## 🔐 Seguridad y Privacidad

### **Hash de Datos Sensibles**
Todos los datos sensibles se hashean con SHA-256:
- Email
- Teléfono
- Nombre y apellido
- Ubicación (ciudad, estado, código postal)

### **Cookies de Facebook**
Se capturan automáticamente:
- `_fbp` - Pixel ID
- `_fbc` - Click ID

### **User Agent del Navegador**
Se incluye para mayor precisión en el matching.

---

## 📈 Deduplicación de Eventos

Cada evento recibe un `event_id` único generado como:

```javascript
const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

Esto previene:
- Duplicación de eventos
- Doble conteo de conversiones
- Falsos positivos en reporting

---

## 🖥️ Cliente-Side vs Servidor-Side

### **Cliente-Side (facebookService.js)**
- ✅ Rastreo en tiempo real
- ✅ Captura interacciones inmediatas
- ❌ Vulnerable a ad-blockers
- ❌ Puede perder datos si navegador se cierra

### **Servidor-Side (facebookCAPI.js)**
- ✅ No afectado por ad-blockers
- ✅ Mayor precisión
- ✅ Datos más confiables
- ❌ Ligero delay en rastreo

**Recomendación**: Usar AMBOS para máxima cobertura

---

## 🚀 Rutas de la Aplicación

### **Nuevas Rutas Agregadas**

```javascript
// Checkout
/checkout           → CheckoutPage.jsx
/order-confirmation → OrderConfirmation.jsx
```

### **Flujo de Compra Completo**

```
Carrito → Checkout → Confirmación
  ↓         ↓           ↓
AddToCart InitiateCheckout Purchase
```

---

## 🧪 Testing y Validación

### **Testing con Test Event Code**

1. **Eventos de Prueba**:
   - Los eventos con `test_event_code` NO afectan datos reales
   - Úsalos para testing sin contaminar datos

2. **Facebook Events Manager**:
   - Ve a `Events Manager` → Tu Pixel
   - Pestaña `Test Events`
   - Aquí aparecerán los eventos de prueba

3. **Validar Eventos**:
   ```javascript
   // Verificar en consola del navegador
   console.log('Evento enviado:', result);
   ```

### **Checklist de Validación**

- [ ] Verificar que `fbq()` está disponible en ventana
- [ ] Confirmar que `VITE_FACEBOOK_PIXEL_ID` es correcto
- [ ] Revisar en Events Manager que eventos llegan
- [ ] Validar hashing de datos
- [ ] Confirmar sincronización Pixel ↔ CAPI

---

## 📱 Eventos en Detalle

### **ViewContent**
```javascript
trackViewContent(product, user)
// Parámetros:
// - product: {id, name, base_price, ...}
// - user: {email, phone, user_id, ...}
```

### **AddToCart**
```javascript
trackAddToCart(product, quantity, user)
// Parámetros:
// - product: {id, name, base_price, ...}
// - quantity: número de unidades
// - user: {email, phone, user_id, ...}
```

### **InitiateCheckout**
```javascript
trackInitiateCheckout(cartTotal, itemsCount, user)
// Parámetros:
// - cartTotal: monto total del carrito
// - itemsCount: cantidad de artículos
// - user: {email, phone, user_id, ...}
```

### **Purchase**
```javascript
trackPurchase(order)
// Parámetros:
// - order: {
//     id: ID orden,
//     total: monto,
//     user: {email, phone, ...},
//     items: [{product_id, quantity, price, ...}]
//   }
```

---

## 🔄 Integración del Servidor

### **Importar Servicio CAPI en rutas**

```javascript
import { 
    trackServerPurchase, 
    trackServerViewContent 
} from '../services/facebookCAPI.js';

// En tu ruta POST de compra:
app.post('/api/orders', async (req, res) => {
    const order = req.body;
    
    // Rastrear en Facebook desde servidor
    await trackServerPurchase(order, req.headers.referer);
    
    // Guardar orden...
});
```

### **Variables de Entorno del Servidor**

El archivo `.env` del servidor necesita:

```env
FB_PIXEL_ID=1532565591243521
FB_ACCESS_TOKEN=tu_token
FB_EVENT_SOURCE_ID=tu_event_source
```

---

## 📊 Facebook Business Manager Setup

### **Crear Catálogo de Productos**

1. Ve a **Business Manager** → **Catalogs**
2. Crea nuevo catálogo
3. Sube el feed XML (`client/public/feed.xml`)
4. Vincula con tu Pixel

### **Crear Conversiones Personalizadas**

1. Ve a **Events Manager**
2. **Conversions** → **Create Custom Conversion**
3. Define eventos que importan para ti

### **Configurar Públicos Personalizados**

1. **Audiences** → **Create Audience**
2. **Custom Audience** → Selecciona eventos de CAPI
3. Usa para retargeting

---

## 🎯 Próximos Pasos

### **Prioridad Alta (Inmediato)**
- [ ] Obtener Access Token de Facebook
- [ ] Obtener Event Source ID
- [ ] Actualizar `.env.local`
- [ ] Actualizar `.env` del servidor
- [ ] Probar eventos en Facebook Events Manager

### **Prioridad Media**
- [ ] Configurar Catálogo de Productos
- [ ] Crear Públicos Personalizados
- [ ] Configurar Campañas de Ads
- [ ] Implementar Conversiones Personalizadas

### **Prioridad Baja**
- [ ] Implementar Advanced Matching
- [ ] Agregar más parámetros de ubicación
- [ ] Rastreo de conversiones offline
- [ ] Integración con CRM

---

## 🆘 Troubleshooting

### **Problema**: "Falta PIXEL_ID o ACCESS_TOKEN"

**Solución**:
```bash
# Verifica .env.local
cat client/.env.local

# Asegúrate que VITE_FACEBOOK_PIXEL_ID esté presente
```

### **Problema**: Eventos no aparecen en Events Manager

**Solución**:
1. Verifica que el Pixel ID sea correcto
2. Abre DevTools → Console → busca errores
3. Usa test_event_code para testing
4. Espera 15-30 minutos para que aparezcan en reportes

### **Problema**: "fetch failed"

**Solución**:
- Verifica CORS
- Revisa que ACCESS_TOKEN sea válido
- Valida que la API v18.0 sea la correcta

### **Problema**: Duplicación de eventos

**Solución**:
- Verifica que no haya dos llamadas a `trackFacebookEvent()`
- Revisa console para duplicados
- Usa `event_id` para deduplicación

---

## 📞 Soporte

**Documentación oficial**: https://developers.facebook.com/docs/marketing-api/conversions-api

**Events Manager**: https://business.facebook.com/events_manager

**Test Advertiser Account**: Crea una cuenta de prueba para testing sin gastar dinero

---

## 📝 Changelog

### **v1.0.0 - 8 de Enero 2026**
- ✅ Implementación completa de CAPI
- ✅ Todos los eventos rastreados
- ✅ Deduplicación implementada
- ✅ Servidor-side CAPI creado
- ✅ Nuevas páginas de checkout

---

**Última actualización**: 8 de enero de 2026

**Mantenedor**: Equipo de Desarrollo Magnolia Novedades
