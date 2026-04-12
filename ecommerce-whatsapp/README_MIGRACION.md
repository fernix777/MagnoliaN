# 📦 GUÍA DE MIGRACIÓN COMPLETA - SUPABASE

## Resumen

Se han extraído **TODOS los datos** del proyecto viejo de Supabase mediante CSVs. 

## 📊 Estadísticas de Datos

| Tabla | Registros | Archivo CSV |
|-------|-----------|-------------|
| **products** | 456 productos | Metadata (5).csv |
| **categories** | 7 categorías | Metadata (6).csv |
| **banners** | 6 banners | Metadata (7).csv |
| **product_images** | 260 imágenes | Metadata (8).csv |
| **product_variants** | 185 variantes | Metadata (9).csv |
| **orders** | 59 órdenes | Metadata (10).csv |
| **order_items** | 142 items | Metadata (11).csv |
| **product_categories** | 456 relaciones | - |

## 🔐 Credenciales del Nuevo Proyecto

```
Project URL: https://coadlejoezzjvpwhbuqc.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYWRsZWpvZXp6anZxd2hidXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzIxNjEsImV4cCI6MjA5MTE0ODE2MX0.Nv6IyBnl17WVXj-lTHIjdO6Tn2xX44h4IKTEHrsH7Fc
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYWRsZWpvZXp6anZxd2hidXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3MjE2MSwiZXhwIjoyMDkxMTQ4MTYxfQ.YDZlQEIeSmdsFLknHP-kEVQWALAtgXJPUi7Zo71dT4c
```

## 📁 Archivos SQL Generados

1. **`1_estructura_tablas.sql`** - Creación de tablas y secuencias
2. **`2_datos_categories.sql`** - Datos de categorías
3. **`3_datos_banners.sql`** - Datos de banners
4. **`4_datos_products.sql`** - Datos de productos (parte 1)
5. **`5_datos_products_2.sql`** - Datos de productos (parte 2)
6. **`6_datos_product_images.sql`** - Imágenes de productos
7. **`7_datos_product_variants.sql`** - Variantes de productos
8. **`8_datos_orders.sql`** - Órdenes
9. **`9_datos_order_items.sql`** - Items de órdenes
10. **`10_foreign_keys.sql`** - Llaves foráneas e índices
11. **`11_rls_policies.sql`** - Políticas de seguridad RLS

## 🚀 Instrucciones de Ejecución

### Paso 1: Conectar al Nuevo Proyecto Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona el proyecto nuevo: `coadlejoezzjvpwhbuqc`
3. Ve al menú **SQL Editor** (Editor SQL)
4. Asegúrate de estar en la base de datos **default** → **public**

### Paso 2: Ejecutar Scripts en Orden

**IMPORTANTE**: Ejecuta los scripts **UNO POR UNO** en este orden exacto:

1. Ejecutar `1_estructura_tablas.sql` - Crea todas las tablas vacías
2. Ejecutar `2_datos_categories.sql` - Inserta categorías
3. Ejecutar `3_datos_banners.sql` - Inserta banners
4. Ejecutar `4_datos_products.sql` - Inserta productos (parte 1)
5. Ejecutar `5_datos_products_2.sql` - Inserta productos (parte 2)
6. Ejecutar `6_datos_product_images.sql` - Inserta imágenes
7. Ejecutar `7_datos_product_variants.sql` - Inserta variantes
8. Ejecutar `8_datos_orders.sql` - Inserta órdenes
9. Ejecutar `9_datos_order_items.sql` - Inserta items de órdenes
10. Ejecutar `10_foreign_keys.sql` - Crea relaciones e índices
11. Ejecutar `11_rls_policies.sql` - Configura seguridad RLS

### Paso 3: Verificar Migración

Ejecutar estas consultas para verificar:

```sql
-- Contar registros en cada tabla
SELECT 'categories' as tabla, count(*) as total FROM categories
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'product_images', count(*) FROM product_images
UNION ALL SELECT 'product_variants', count(*) FROM product_variants
UNION ALL SELECT 'orders', count(*) FROM orders
UNION ALL SELECT 'order_items', count(*) FROM order_items
UNION ALL SELECT 'banners', count(*) FROM banners;
```

**Resultados esperados:**
- categories: 7
- products: 456
- product_images: 260
- product_variants: 185
- orders: 59
- order_items: 142
- banners: 6

## ⚠️ Notas Importantes

1. **Ejecutar de uno en uno**: Si ejecutas varios scripts juntos puede dar error de sintaxis
2. **Verificar URL de imágenes**: Las imágenes están almacenadas en Vercel Blob Storage, deberían seguir funcionando
3. **Código frontend**: Después de la migración, el código ya es compatible (usa `active` no `is_active`)
4. **Backup**: Se recomienda hacer backup del proyecto nuevo antes de empezar

## 🆘 Solución de Problemas

### Error: "duplicate key value violates unique constraint"

Si aparece este error, las tablas ya tienen datos. Ejecuta:

```sql
-- Limpiar todas las tablas (CUIDADO: borra TODO)
TRUNCATE TABLE order_items, orders, product_variants, product_images, products, subcategories, product_categories, banners, categories CASCADE;
```

### Error: "relation X does not exist"

El script de estructura no se ejecutó primero. Ve al Paso 2 y sigue el orden.

### Verificar conexión

Si necesitas verificar que el proyecto nuevo funciona:

```bash
# Test de conexión
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://coadlejoezzjvpwhbuqc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYWRsZWpvZXp6anZxd2hidXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3MjE2MSwiZXhwIjoyMDkxMTQ4MTYxfQ.YDZlQEIeSmdsFLknHP-kEVQWALAtgXJPUi7Zo71dT4c');
supabase.from('products').select('count').then(console.log);
"
```

## ✅ Checklist Post-Migración

- [ ] Todas las tablas creadas
- [ ] Datos insertados correctamente
- [ ] Foreign keys creadas
- [ ] Índices creados
- [ ] RLS policies configuradas
- [ ] Frontend conectado al nuevo proyecto
- [ ] Variables de entorno actualizadas
- [ ] Test de productos visibles en tienda
- [ ] Test de carrito funciona
- [ ] Test de checkout funciona

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de Supabase en el SQL Editor
2. Verifica los conteos de tablas
3. Confirma que usaste el Service Role Key (no el Anon Key) para los INSERTs

---

**Generado:** Migración Automática desde CSVs
**Proyecto:** Magnolia Novedades
**Fecha:** 2026
