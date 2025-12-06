# 🎯 Guía de Implementación: Facebook Conversion API en Componentes

## ⚙️ PASO 0: Variables de Entorno

Agrega esto a tu archivo `.env` (crear si no existe en la raíz de `client/`):

```env
# Facebook Conversion API
VITE_FACEBOOK_PIXEL_ID=tu_pixel_id_aqui
VITE_FACEBOOK_ACCESS_TOKEN=tu_access_token_aqui
VITE_FACEBOOK_EVENT_SOURCE_ID=tu_event_source_id_aqui
VITE_FACEBOOK_TEST_EVENT_CODE=opcional_para_testing
```

**Donde conseguir estos datos:**
1. Ve a: https://business.facebook.com/
2. Events Manager → Selecciona tu Pixel
3. Settings → Conversions API
4. Copia los valores

---

## 1️⃣ IMPLEMENTAR EN: ProductDetail.jsx
**Objetivo:** Rastrear cuando el usuario VE un producto

### Ubicación del cambio:
`client/src/pages/customer/ProductDetail.jsx`

### Código a agregar:

```jsx
// Agregar al inicio del archivo, después de otros imports:
import { trackViewContent } from '../../services/facebookService';

// Agregar este useEffect después de los otros useEffect:
useEffect(() => {
    if (product) {
        // Rastrear visualización del producto
        const currentUser = user ? { 
            email: user.email, 
            user_id: user.id 
        } : null;
        
        trackViewContent(product, currentUser);
    }
}, [product, user]);
```

### Contexto: ¿Dónde agregar el useEffect?
Búsqueda en el archivo: `useEffect(() => {` 
Agrega el nuevo useEffect después de los existentes, pero dentro del componente.

---

## 2️⃣ IMPLEMENTAR EN: CartContext.jsx
**Objetivo:** Rastrear cuando agregan al carrito

### Ubicación del cambio:
`client/src/context/CartContext.jsx`

### Código a agregar:

```jsx
// Agregar al inicio del archivo, después de otros imports:
import { trackAddToCart } from '../services/facebookService';
import { useAuth } from './AuthContext';

// Dentro del CartProvider, después de otros hooks:
const { user } = useAuth();

// Modificar la función addToCart (busca la sección del if existingItemIndex):
const addToCart = (product, quantity = 1, options = {}) => {
    // Rastrear en Facebook
    const currentUser = user ? { 
        email: user.email, 
        user_id: user.id 
    } : null;
    trackAddToCart(product, quantity, currentUser);

    // ... resto del código existente ...
};
```

---

## 3️⃣ IMPLEMENTAR EN: Cart.jsx
**Objetivo:** Rastrear cuando inician checkout y completan compra

### Ubicación del cambio:
`client/src/components/customer/Cart.jsx`

### Código a agregar:

```jsx
// Agregar al inicio del archivo, después de otros imports:
import { trackInitiateCheckout, trackPurchase } from '../../services/facebookService';

// En la función handleCheckout (búscala en el archivo):
const handleCheckout = () => {
    if (!user) {
        navigate('/login?redirect=/carrito');
        return;
    }
    
    // Rastrear iniciación de checkout
    trackInitiateCheckout(getCartTotal(), cart.length, {
        email: user.email,
        user_id: user.id
    });
    
    setIsCheckout(true);
};

// En la función handleWhatsAppOrder, ANTES de limpiar carrito:
const handleWhatsAppOrder = () => {
    if (!user) return;

    // ... código existente de generar mensaje ...
    
    // AGREGAR AQUÍ: Rastrear la compra
    const orderData = {
        id: `ORDER_${Date.now()}`,
        user: {
            email: user.email,
            user_id: user.id
        },
        total: getCartTotal(),
        items: cart.map(item => ({
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price
        }))
    };
    
    trackPurchase(orderData);
    
    // Abrir WhatsApp
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    clearCart();
    onClose();
};
```

---

## 4️⃣ IMPLEMENTAR EN: Login.jsx / Registro
**Objetivo:** Rastrear cuando se registran nuevos usuarios

### Ubicación del cambio:
`client/src/pages/admin/Login.jsx` (si tienes página de registro, también allí)

### Código a agregar:

```jsx
// Agregar al inicio del archivo:
import { trackCompleteRegistration } from '../../services/facebookService';

// En el success del handleSubmit (después de login exitoso):
const handleSubmit = async (e) => {
    // ... código existente ...
    
    if (error) {
        setError(error.message || 'Error al iniciar sesión');
        setLoading(false);
        return;
    }

    // Si es registro (no login), rastrear
    if (data.user) {
        trackCompleteRegistration({
            email: data.user.email,
            user_id: data.user.id
        });
    }

    // ... resto del código ...
};
```

---

## 5️⃣ IMPLEMENTAR EN: SearchPage.jsx
**Objetivo:** Rastrear búsquedas de usuarios (opcional pero recomendado)

### Ubicación del cambio:
`client/src/pages/customer/SearchPage.jsx`

### Código a agregar:

```jsx
// Agregar al inicio del archivo:
import { trackSearch } from '../../services/facebookService';

// En el useEffect de búsqueda:
useEffect(() => {
    if (query) {
        searchProducts();
        
        // Rastrear búsqueda
        trackSearch(query, products.length, {
            email: user?.email,
            user_id: user?.id
        });
    }
}, [query, filters])
```

---

## 🔍 Verificar que funciona

### En Desarrollo:

1. **Abrir Console (F12)** en el navegador
2. **Buscar logs** que digan: `✅ Evento Facebook registrado`
3. Si dice **"no está configurada"**, verifica las variables de entorno

### En Facebook Events Manager:

1. Ve a: https://business.facebook.com/events_manager/
2. Selecciona tu pixel
3. Ve a **Test Events**
4. Navega por tu tienda
5. Deberías ver eventos aparecer en tiempo real

### Uso de Facebook Pixel Helper (Chrome Extension):

1. Instala: https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgodlnavgmpjdfahfldfcllogmda5je
2. Abre tu página
3. Haz clic en la extensión
4. Verás todos los eventos rastreados

---

## ⚠️ Problemas Comunes

| Problema | Solución |
|----------|----------|
| "No configurada" | Verifica que las variables de entorno estén en `.env` |
| Error 400 en API | Verifica que el PIXEL_ID y ACCESS_TOKEN sean correctos |
| Eventos no aparecen | Espera 30 segundos, Facebook tiene latencia |
| CORS error | Asegúrate de estar usando HTTPS en producción |
| Test Event Code no funciona | Usa solo en desarrollo, quítalo en producción |

---

## 📊 Próximos Pasos Después de Implementar

1. ✅ Verificar eventos en Facebook Events Manager
2. ✅ Crear audiencias personalizadas en Facebook Ads
3. ✅ Configurar retargeting (remarketing)
4. ✅ Vincular a Google Analytics (opcional)
5. ✅ Monitorear ROAS (Return on Ad Spend)

---

## 🔐 Notas de Seguridad

- **NUNCA** commits el Access Token en GitHub
- El Access Token expira cada 60 días, renovarlo en Facebook
- Usar variables de entorno con .env.local (local) y variables en Vercel (producción)
- No exponer datos sensibles de usuario en eventos

---

## 📞 Soporte

Si hay problemas:
1. Revisa la consola del navegador (F12)
2. Verifica que el PIXEL_ID sea correcto
3. Asegúrate que el sitio tenga SSL/HTTPS
4. Contacta con Facebook Support para issues de la API
