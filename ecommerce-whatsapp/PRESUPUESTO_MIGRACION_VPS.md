# PRESUPUESTO DE MIGRACIÓN - MAGNOLIA NOVEDADES
## Migration to VPS (Self-Hosted) - 100% Manual

---

## RESUMEN EJECUTIVO

| Concepto | Costo (ARS) |
|----------|-------------|
| **TRABAJO DE MIGRACIÓN** | $420.000 |
| **IMPLEMENTACIÓN VPS** | $150.000 |
| **DESARROLLO ADICIONAL** | $150.000 |
| **Infraestructura PRIMER MES** | $80.000 |
| **TOTAL INICIAL** | **$800.000** |
| **Costo mensual posterior** | $50.000/mes |

---

## 1. ANÁLISIS DEL PROYECTO

### Tech Stack Actual
- **Frontend:** React + Vite (actualmente en Vercel)
- **Backend:** Express + Supabase SDK
- **Database:** PostgreSQL (Supabase Cloud)
- **Auth:** Supabase Auth
- **Storage:** Vercel Blob + Supabase Storage
- **Hosting:** Vercel

### Datos a Migrar
- 456 productos
- 260 imágenes de productos
- 185 variantes
- ~50 usuarios registrados
- 59 órdenes + 142 items
- 7 categorías
- Banners

---

## 2. TRABAJO DE MIGRACIÓN - $420.000

### 2.1 BACKEND - $220.000

| Ítem | Descripción | Costo |
|------|------------|-------|
| **PostgreSQL en VPS** | Instalación completa, configuración, optimización, seguridad | $45.000 |
| **Migrar schema completo** | Crear todas las tablas, índices, foreign keys, triggers, funciones | $40.000 |
| **Migrar datos** | Exportar de Supabase, transformar, importar a PostgreSQL local | $45.000 |
| **Reescribir Auth completo** | Sistema JWT con bcrypt, cookies seguras, refresh tokens, registro/login/recuperación | $50.000 |
| **Reescribir Storage** | Multer + sistema de archivos local con organización por carpetas | $40.000 |

### 2.2 FRONTEND - $120.000

| Ítem | Descripción | Costo |
|------|------------|-------|
| **Reescribir servicios** | Reemplazar todos los `@supabase/supabase-js` por axios/llamadas al backend | $35.000 |
| **Adaptar sistema Auth** | Login, registro, logout, recuperación de contraseña, verificación de email | $30.000 |
| **Cambiar sistema de uploads** | Reemplazar `vercelBlobService` por chamadas al backend con Multer | $25.000 |
| **Testing integral** | Verificar login, products, cart, checkout, admin panel, imágenes | $30.000 |

### 2.3 IMÁGENES - $80.000

| Ítem | Descripción | Costo |
|------|------------|-------|
| **Descargar imágenes** | Descargar ~300 imágenes de Vercel Blob + Supabase Storage | $25.000 |
| **Procesar y optimizar** | Redimensionar, comprimir, organizar por carpetas | $20.000 |
| **Subir a VPS** | Subir todas las imágenes al servidor con estructura | $20.000 |
| **Actualizar URLs** | Cambiar todas las URLs en la base de datos y verificar | $15.000 |

---

## 3. IMPLEMENTACIÓN VPS - $150.000

| Ítem | Descripción | Costo |
|------|------------|-------|
| **Configuración inicial VPS** | Ubuntu, crear usuario deploy, permisos, firewall (UFW), fail2ban | $30.000 |
| **Instalación Node.js + PM2** | Node 20 LTS, PM2 con ecosystem config, 4 instancias, logs | $25.000 |
| **Instalación Nginx** | Reverse proxy, configuración de cache, compresión gzip | $25.000 |
| **Configurar SSL** | Let's Encrypt con certbot, renovación automática, HSTS | $20.000 |
| **Deploy Backend** | Subir código, instalar dependencias, configurar variables de entorno | $25.000 |
| **Deploy Frontend** | Build de React, configurar Nginx para servir static files | $25.000 |

---

## 4. DESARROLLO ADICIONAL - $150.000 (Opcional)

| Ítem | Descripción | Costo |
|------|------------|-------|
| **Panel Admin Mejorado** | Dashboard con estadísticas de ventas, productos, gráfica de ingresos | $50.000 |
| **Sistema de Notificaciones** | Notificaciones al admin cuando llega un nuevo pedido por email/WhatsApp | $30.000 |
| **Backup Automático Completo** | Script de backup diario, semanal, mensual, enviar a Google Drive | $35.000 |
| **Optimización Imágenes** | Compresión automática con Sharp al subir, WebP, thumbnails | $20.000 |
| **Panel de Gestión de Usuarios** | Admin puede ver, editar, eliminar usuarios, cambiar roles | $15.000 |

---

## 5. INFRAESTRUCTURA MENSUAL - $50.000/mes

| Ítem | Descripción | Costo Mensual |
|------|------------|---------------|
| **VPS** | 4 vCPU, 8GB RAM, 100GB NVMe SSD (Hetzner) | $40.000 |
| **Dominio** | .com.ar o .com | $5.000 |
| **Backups/cloud** | Espacio adicional o servicio de backup | $5.000 |
| **TOTAL** | | **$50.000** |

### Opciones de VPS Argentinas
| Proveedor | Specs | Precio |
|-----------|-------|--------|
| Niubip | 4vCPU, 6GB, 60GB | ~$55.000/mes |
| DonWeb | 4vCPU, 4GB, 50GB | ~$50.000/mes |
| Beluga | 4vCPU, 8GB, 80GB | ~$60.000/mes |

---

## 6. CRONOGRAMA

| Fase | Descripción | Duración |
|------|------------|----------|
| 1 | Configuración VPS + PostgreSQL | 6-8 horas |
| 2 | Export/import base de datos + imágenes | 5-6 horas |
| 3 | Reescribir backend (auth + storage + API) | 12-14 horas |
| 4 | Reescribir frontend | 8-10 horas |
| 5 | Deploy + testing + correcciones | 6-8 horas |
| **TOTAL** | | **37-46 horas** |

---

## 7. COMPARATIVA ANUAL

| Escenario | Costo Anual |
|------------|-------------|
| **VPS Self-hosted** | $600.000 (50.000 × 12) |
| **Supabase Pro + Vercel Pro** | $800.000+ |
| **AHORRO** | **$200.000+/año** |

---

## 8. QUÉ ESTÁ INCLUIDO

### En el trabajo de migración ($420.000)
- ✅ PostgreSQL instalado y configurado en VPS
- ✅ Todas las tablas, índices, funciones migradas
- ✅ Auth completo (JWT + bcrypt) sin dependencia de Supabase
- ✅ Storage de imágenes local sin Vercel Blob
- ✅ Frontend 100% adaptado al nuevo backend
- ✅ Todas las imágenes migradas y funcionando
- ✅ Deploy completo con SSL
- ✅ Testing integral

### No incluido
- Diseño nuevo del sitio
- Nuevas funcionalidades adicionales
- Mantenimiento post-lanzamiento
- Dominio nuevo (si no tenés)

---

## 9. CONDICIONES

- **Forma de pago:** 50% al iniciar ($400.000), 50% al entregar ($400.000)
- **Tiempo de entrega:** 10-14 días hábiles
- **Garantía:** 30 días de soporte por errores de migración
- **Validez del presupuesto:** 30 días

---

## 10. PRÓXIMOS PASOS

1. Aprobar presupuesto
2. Elegir proveedor de VPS (recomiendo Hetzner por relación precio/rendimiento)
3. Contratar VPS y pasar credenciales SSH
4. Iniciar trabajo
5. Entrega y testing

---

**PRESUPUESTO VÁLIDO POR 30 DÍAS**
**Fecha: Abril 2026**