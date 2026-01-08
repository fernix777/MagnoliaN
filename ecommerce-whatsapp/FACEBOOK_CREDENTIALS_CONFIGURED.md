# 🚀 CREDENCIALES DE FACEBOOK - MAGNOLIA NOVEDADES

## ✅ ESTADO: CREDENCIALES CONFIGURADAS

Todas las credenciales han sido configuradas en el proyecto. Aquí está el resumen:

---

## 📊 Credenciales Obtenidas

### **1️⃣ PIXEL ID**
```
1613812252958290
```
✅ Ya está en:
- [client/index.html](client/index.html)
- [client/.env.local](client/.env.local)
- [server/.env.example](server/.env.example)

### **2️⃣ ACCESS TOKEN** ⭐
```
EAFpzmMVWlz8BQYmHkNpTq54ES4IOZCb0a5Tzl6r4ZCuSA5VGpsV71l41GW1G4M7ThFBG2kFObGGYzGPCTqqbwkM0hhGxFRetVjzGQsNICgAsL2dsqKyfsJJZCCbWG4CLvtZClor6GkcBC5aaZBuEVQ3HASY4KT6yZBu2B1ppohTJLzjCukvC0KzoSskMPW6QZDZD
```
✅ Ya está en:
- [client/.env.local](client/.env.local)
- [server/.env.example](server/.env.example)

### **3️⃣ EVENT SOURCE ID**
```
1613812252958290
```
✅ Ya está en:
- [client/.env.local](client/.env.local)
- [server/.env.example](server/.env.example)

### **4️⃣ TEST EVENT CODE**
```
TEST32871
```
✅ Ya está en:
- [client/.env.local](client/.env.local)
- [server/.env.example](server/.env.example)

---

## 🖥️ VERIFICACIÓN LOCAL

**Archivo actual:** `client/.env.local`

```env
# Facebook Conversion API Configuration
VITE_FACEBOOK_PIXEL_ID=1613812252958290
VITE_FACEBOOK_ACCESS_TOKEN=EAFpzmMVWlz8BQYmHkNpTq54ES4IOZCb0a5Tzl6r4ZCuSA5VGpsV71l41GW1G4M7ThFBG2kFObGGYzGPCTqqbwkM0hhGxFRetVjzGQsNICgAsL2dsqKyfsJJZCCbWG4CLvtZClor6GkcBC5aaZBuEVQ3HASY4KT6yZBu2B1ppohTJLzjCukvC0KzoSskMPW6QZDZD
VITE_FACEBOOK_EVENT_SOURCE_ID=1613812252958290
VITE_FACEBOOK_TEST_EVENT_CODE=TEST32871
```

---

## 🌐 PRÓXIMO PASO: VERCEL

Debes agregar las MISMAS 4 variables en Vercel para producción.

### **Ir a Vercel**

1. https://vercel.com/dashboard
2. Selecciona proyecto: `ecommerce-whatsapp`
3. **Settings** → **Environment Variables**

### **Agregar 4 Variables**

| Nombre | Valor |
|--------|-------|
| **VITE_FACEBOOK_PIXEL_ID** | `1613812252958290` |
| **VITE_FACEBOOK_ACCESS_TOKEN** | `EAFpzmMVWlz8BQYmHkNpTq54ES4IOZCb0a5Tzl6r4ZCuSA5VGpsV71l41GW1G4M7ThFBG2kFObGGYzGPCTqqbwkM0hhGxFRetVjzGQsNICgAsL2dsqKyfsJJZCCbWG4CLvtZClor6GkcBC5aaZBuEVQ3HASY4KT6yZBu2B1ppohTJLzjCukvC0KzoSskMPW6QZDZD` |
| **VITE_FACEBOOK_EVENT_SOURCE_ID** | `1613812252958290` |
| **VITE_FACEBOOK_TEST_EVENT_CODE** | `TEST32871` |

**Para cada una:**
- ☑️ Production
- ☑️ Preview
- ☑️ Development

### **Guardar y Redeploy**

1. Haz clic en **"Save"** en cada variable
2. Ve a **Deployments**
3. Haz clic en **"Redeploy"** del deployment más reciente
4. Espera a que termine (2-5 minutos)

---

## 🧪 TESTING

### **Local (Desarrollo)**

```bash
npm run dev  # Cliente
npm run dev  # Servidor (en otra terminal)
```

Abre: `http://localhost:5173`

**Verifica en Console:**
- No debe haber errores de Facebook
- Debe ver mensajes: "✅ Evento Facebook registrado"

### **Producción (Vercel)**

1. Espera a que Vercel redeploy (5 minutos)
2. Ve a tu sitio: `https://www.magnolia-n.com`
3. Abre DevTools → Console
4. Haz una acción: ver producto, agregar carrito
5. Verifica en Facebook Events Manager que aparecen eventos

---

## 📱 VERIFICAR EN FACEBOOK EVENTS MANAGER

1. Ve a: https://business.facebook.com/events_manager
2. Selecciona tu Pixel: **1613812252958290**
3. Pestaña: **Test Events**
4. Busca eventos con código: `TEST32871`

**Esperado después de 15-30 minutos:**
- ViewContent
- AddToCart
- InitiateCheckout
- Purchase
- Contact
- Search
- CompleteRegistration

---

## ✅ CHECKLIST FINAL

- [x] Credenciales obtenidas del cliente
- [x] `.env.local` actualizado (local)
- [x] `.env.example` actualizado (servidor)
- [x] Pixel ID en `index.html` actualizado
- [ ] Variables agregadas en Vercel
- [ ] Vercel redesplegó (esperar 5 minutos)
- [ ] Testing local exitoso
- [ ] Testing en Vercel exitoso
- [ ] Eventos aparecen en Facebook Events Manager

---

## 🆘 Si Hay Problemas

### Error: "Falta PIXEL_ID o ACCESS_TOKEN"
- Verifica que `.env.local` tenga los valores correctos
- Reinicia `npm run dev`

### Eventos no aparecen en Events Manager
- Espera 15-30 minutos (demora el sistema de Facebook)
- Usa test event code: `TEST32871` para verlos más rápido
- Revisa que el Pixel ID sea correcto: `1613812252958290`

### En Vercel dice "Invalid access token"
- Verifica que copiaste TODO el token (200+ caracteres)
- Sin espacios en blanco al inicio/final
- Redeploy después de agregar

---

## 📞 CONTACTO SOPORTE

Si tienes dudas sobre eventos en Facebook:
- **Documentación**: https://developers.facebook.com/docs/marketing-api/conversions-api
- **Events Manager**: https://business.facebook.com/events_manager
- **Test Advertiser**: Crea cuenta test en Facebook para testing sin gastar dinero

---

**Última actualización:** 8 de enero de 2026
**Cliente:** Magnolia Novedades
**Sitio:** magnolia-n.com
