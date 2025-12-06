PRESUPUESTO - Integración Facebook Conversion API (Paquete Estándar)

A nombre de: Magnolia Novedades
Fecha: 06/12/2025
Validez de la oferta: 15 días

Resumen ejecutivo
-----------------
Implementación profesional de Facebook Conversion API (CAPI) para mejorar el seguimiento de conversiones, optimizar campañas de Facebook Ads y crear audiencias basadas en comportamiento real de usuarios.

Precio propuesto (paquete estándar): ARS 150.000 (ciento cincuenta mil pesos argentinos)

Alcance del servicio
---------------------
1) Configuración en Facebook Business
   - Revisión y/o creación de Pixel.
   - Generación de Access Token para Conversions API.
   - Validación en Events Manager (Test Events).

2) Implementación técnica en el sitio
   - Archivo de configuración con variables de entorno (.env) para `VITE_FACEBOOK_PIXEL_ID` y `VITE_FACEBOOK_ACCESS_TOKEN`.
   - Servicio central `facebookService.js` para envío de eventos.
   - Integración en componentes clave:
     - `ProductDetail` → `ViewContent` (visualización de producto)
     - `CartContext` → `AddToCart` (agregar al carrito)
     - `Cart` → `InitiateCheckout` y `Purchase` (inicio de checkout y compra)
     - `Registro` → `CompleteRegistration` (registro de usuario)
   - Hashing (SHA-256) de email para mejorar matching (privacidad / GDPR friendly).

3) Testing y verificación
   - Pruebas en Events Manager (Test Events) hasta confirmar recepción.
   - Revisión de logs en consola y manejo de errores comunes.

4) Documentación
   - Guía técnica completa para variables de entorno y renovación de tokens.
   - Instrucciones para probar eventos y uso del Facebook Pixel Helper.

Entregables
-----------
- Código implementado en el repositorio (archivos modificados y nuevos servicios).
- `README` / guía técnica con pasos de verificación.
- Asistencia inicial y puesta en marcha.

Plazos
------
Tiempo estimado de trabajo: 5–8 días hábiles desde la confirmación y entrega de credenciales.

Condiciones de pago
-------------------
- Hito 1 (50%): ARS 75.000 al aceptar el presupuesto.
- Hito 2 (50%): ARS 75.000 al entregar y validar en Events Manager.
- Se añade IVA según corresponda si aplica.

Soporte incluido
----------------
- 1 mes de soporte para ajustes menores y verificación posterior a la entrega.

Requerimientos por parte del cliente
-----------------------------------
- Acceso a Facebook Business (permiso para administrar Pixel o que nos compartan el Pixel ID y generar el Access Token).
- Variables de entorno en el entorno de despliegue (Vercel u otro) para guardar `VITE_FACEBOOK_PIXEL_ID` y `VITE_FACEBOOK_ACCESS_TOKEN`.
- Acceso a la cuenta de despliegue (opcional, para ayudar a configurar variables en el hosting).

Limitaciones y notas técnicas
-----------------------------
- Este paquete envía eventos desde el frontend. Para máxima precisión y evitar problemas de bloqueo de navegador, se recomienda migrar a envío server-side (opcional, cotizado aparte).
- El Access Token de Facebook expira (ver guía para renovación cada 60 días).
- Se recomienda HTTPS en producción (Vercel ya cumple).

Extras opcionales (cotizados aparte)
-----------------------------------
- Implementación server-side (backend) para eventos: + ARS 120.000
- Dashboard simple / reportes: + ARS 80.000
- 3 meses de soporte adicional: + ARS 45.000

Observaciones comerciales
------------------------
- Puedo ofrecer un 5% de descuento por pago por transferencia bancaria (no tarjeta) o pago en un solo pago.
- Opciones de financiación: 2 cuotas sin interés (50% + 50%).

Contacto
--------
Ramiro Miranda - Dev Fullstack

Tel/WhatsApp: +54 9 11 2877-3793

Aceptación
----------
Si está de acuerdo con este presupuesto, por favor responda confirmando el paquete Estándar. Al aceptar, enviaré la factura/recibo correspondiente y comenzamos con el hito 1.

---

Documento generado automáticamente en el repositorio local.
