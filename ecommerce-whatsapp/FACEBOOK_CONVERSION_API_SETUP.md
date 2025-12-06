# 📱 Plan Metodológico: Integración de Facebook Conversion API (CAPI)

## 🎯 Objetivo
Rastrear conversiones de usuarios en la tienda (vistas de producto, agregar al carrito, compras) para mejorar el remarketing y análisis en Facebook Ads.

---

## 📋 FASE 1: CONFIGURACIÓN EN FACEBOOK BUSINESS

### Paso 1.1: Crear/Acceder a Facebook Business Manager
1. Ve a https://business.facebook.com
2. Selecciona tu Business Account (o crea uno)
3. Ve a **Business Settings** → **Data Sources** → **Conversions API**

### Paso 1.2: Crear un evento de conversión
1. Ve a **Events Manager**
2. Selecciona tu pixel de Facebook (o crea uno)
3. Haz clic en **Conversions** → **Create Conversion**
4. Crea estos eventos:
   - `ViewContent` - Cuando ven un producto
   - `AddToCart` - Cuando agregan al carrito
   - `Purchase` - Cuando completan la compra

### Paso 1.3: Obtener credenciales
1. Ve a **Events Manager** → Tu Pixel
2. **Settings** → **Conversions API**
3. Copia:
   - **Pixel ID**: `tu_pixel_id`
   - **Access Token**: Genera uno nuevo (válido 60 días)
   - **Event Source ID**: Se genera automáticamente

---

## 💻 FASE 2: CONFIGURACIÓN EN EL PROYECTO

### Paso 2.1: Crear archivo de configuración
```
client/src/config/facebook.js
```

### Paso 2.2: Instalar dependencias
```bash
npm install facebook-conversions-api
```

### Paso 2.3: Crear servicio de Facebook
```
client/src/services/facebookService.js
```

---

## 🔧 FASE 3: IMPLEMENTACIÓN EN CÓDIGO

### Cambios necesarios:

**A) client/src/config/facebook.js** - Nuevas credenciales
**B) client/src/services/facebookService.js** - Lógica de tracking
**C) client/src/components/customer/ProductDetail.jsx** - Track ViewContent
**D) client/src/context/CartContext.jsx** - Track AddToCart
**E) client/src/components/customer/Cart.jsx** - Track Purchase

---

## 📊 FASE 4: EVENTOS A RASTREAR

| Evento | Ubicación | Datos |
|--------|-----------|-------|
| **ViewContent** | ProductDetail.jsx | product_id, product_name, price, category |
| **AddToCart** | CartContext.jsx | product_id, quantity, value |
| **Purchase** | Cart.jsx (WhatsApp) | order_id, value, currency, items |
| **InitiateCheckout** | Cart.jsx | value, currency |
| **CompleteRegistration** | Registro | user_id, email |

---

## 🔐 Variables de Entorno

Agrega al archivo `.env` del cliente:
```
VITE_FACEBOOK_PIXEL_ID=tu_pixel_id
VITE_FACEBOOK_ACCESS_TOKEN=tu_access_token
```

---

## ✅ Checklist de Implementación

- [ ] Crear credenciales en Facebook Business
- [ ] Instalar dependencias npm
- [ ] Crear archivo de configuración
- [ ] Crear servicio de Facebook
- [ ] Implementar tracking en ProductDetail
- [ ] Implementar tracking en CartContext
- [ ] Implementar tracking en Cart (compra)
- [ ] Implementar tracking en Registro
- [ ] Probar eventos en Facebook Events Manager
- [ ] Verificar eventos en tiempo real
- [ ] Hacer commit a GitHub

---

## 🧪 Verificación

1. **En Facebook Events Manager:**
   - Ve a "Test Events" 
   - Ejecuta acciones en la tienda
   - Deberías ver los eventos aparecer en tiempo real

2. **En Console del navegador:**
   - Busca logs de eventos Facebook
   - Verifica que no haya errores

3. **En Facebook Pixel Helper (Extension):**
   - Instala la extensión Chrome
   - Recorre la tienda
   - Verifica que los eventos aparezcan

---

## 📝 Notas Importantes

- Los eventos deben incluir `hashed_email` o `phone_number` para mejor matching
- El Access Token expira cada 60 días, necesita renovarse
- Usar HTTPS es obligatorio para Conversion API
- Supabase ya registra emails, podemos usarlos
- Los eventos se envían desde el backend (más seguro)

---

## 🚀 Próximos Pasos

Una vez implementado, podrás:
1. ✅ Ver datos en Facebook Analytics
2. ✅ Crear audiencias personalizadas basadas en eventos
3. ✅ Mejorar el remarketing
4. ✅ Optimizar campañas de Facebook Ads
5. ✅ Rastrear ROI de publicidades
