# 📦 MIGRACIÓN COMPLETA - SUPABASE

## 🎯 Resumen

Migración de **PROYECTO VIEJO → PROYECTO NUEVO** usando los 16 archivos CSV extraídos.

## 📊 Estadísticas de Datos

| Tabla | Registros | Archivo CSV |
|-------|-----------|-------------|
| **categories** | 7 | Metadata (6).csv |
| **banners** | 6 | Metadata (7).csv |
| **products** | 456 | Metadata (5).csv |
| **product_images** | 260 | Metadata (8).csv |
| **product_variants** | 185 | Metadata (9).csv |
| **orders** | 59 | Metadata (10).csv |
| **order_items** | 142 | Metadata (11).csv |

## 🔐 Credenciales del Nuevo Proyecto

```
Project URL: https://coadlejoezzjvpwhbuqc.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYWRsZWpvZXp6anZxd2hidXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzIxNjEsImV4cCI6MjA5MTE0ODE2MX0.Nv6IyBnl17WVXj-lTHIjdO6Tn2xX44h4IKTEHrsH7Fc
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYWRsZWpvZXp6anZxd2hidXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3MjE2MSwiZXhwIjoyMDkxMTQ4MTYxfQ.YDZlQEIeSmdsFLknHP-kEVQWALAtgXJPUi7Zo71dT4c
```

---

## 🚀 MÉTODO RECOMENDADO: Importar CSVs vía UI de Supabase

Este es el método **más rápido y confiable** para grandes volúmenes de datos.

### Paso 1: Conectar al Proyecto Nuevo

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto: **coadlejoezzjvpwhbuqc**
4. Asegúrate de estar en el proyecto correcto revisando la URL

### Paso 2: Crear Estructura de Tablas

1. En el menú lateral, ve a **SQL Editor**
2. Crea una **New Query**
3. Copia y pega el contenido de: **`1_estructura_tablas.sql`**
4. Haz clic en **Run** (▶️)
5. Verifica que diga "Success" y "Estructura creada exitosamente"

### Paso 3: Importar CSVs (en este orden EXACTO)

Ve al **Table Editor** en el menú lateral e importa cada CSV:

#### 1. categories (7 registros)
- Ve a **Table Editor** → **categories**
- Haz clic en **Insert** → **Import data from CSV**
- Selecciona: `Supabase Snippet Retrieve Product Images Column Metadata (6).csv`
- Mapeo de columnas: Verifica que coincidan
- Haz clic en **Import**

#### 2. banners (6 registros)
- Ve a **Table Editor** → **banners**
- Importa: `Supabase Snippet Retrieve Product Images Column Metadata (7).csv`

#### 3. products (456 registros)
- Ve a **Table Editor** → **products**
- Importa: `Supabase Snippet Retrieve Product Images Column Metadata (5).csv`
- ⚠️ **IMPORTANTE**: Este archivo tiene descripciones multilínea. Si hay errores:
  - Abre el CSV en Excel/Notepad
  - Verifica que las comillas estén correctas
  - Reemplaza `"` por `""` si es necesario

#### 4. product_images (260 registros)
- Ve a **Table Editor** → **product_images**
- Importa: `Supabase Snippet Retrieve Product Images Column Metadata (8).csv`

#### 5. product_variants (185 registros)
- Ve a **Table Editor** → **product_variants**
- Importa: `Supabase Snippet Retrieve Product Images Column Metadata (9).csv`

#### 6. orders (59 registros)
- Ve a **Table Editor** → **orders**
- Importa: `Supabase Snippet Retrieve Product Images Column Metadata (10).csv**

#### 7. order_items (142 registros)
- Ve a **Table Editor** → **order_items**
- Importa: `Supabase Snippet Retrieve Product Images Column Metadata (11).csv`

### Paso 4: Verificar Importación

Ejecuta esta consulta en el **SQL Editor**:

```sql
SELECT 
    'categories' as tabla, count(*) as total FROM categories
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'product_images', count(*) FROM product_images
UNION ALL SELECT 'product_variants', count(*) FROM product_variants
UNION ALL SELECT 'orders', count(*) FROM orders
UNION ALL SELECT 'order_items', count(*) FROM order_items
UNION ALL SELECT 'banners', count(*) FROM banners;
```

**Resultados esperados:**
```
categories: 7
products: 456
product_images: 260
product_variants: 185
orders: 59
order_items: 142
banners: 6
```

---

## 🛠️ MÉTODO ALTERNATIVO: Script Node.js Automatizado

Si prefieres automatización total sin usar la UI:

### Requisitos
```bash
npm install @supabase/supabase-js csv-parse
```

### Script de Importación
Crea el archivo `importar_csv.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const supabaseUrl = 'https://coadlejoezzjvpwhbuqc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYWRsZWpvZXp6anZxd2hidXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3MjE2MSwiZXhwIjoyMDkxMTQ4MTYxfQ.YDZlQEIeSmdsFLknHP-kEVQWALAtgXJPUi7Zo71dT4c';

const supabase = createClient(supabaseUrl, supabaseKey);

const files = [
    { table: 'categories', file: 'Supabase Snippet Retrieve Product Images Column Metadata (6).csv' },
    { table: 'banners', file: 'Supabase Snippet Retrieve Product Images Column Metadata (7).csv' },
    { table: 'products', file: 'Supabase Snippet Retrieve Product Images Column Metadata (5).csv' },
    { table: 'product_images', file: 'Supabase Snippet Retrieve Product Images Column Metadata (8).csv' },
    { table: 'product_variants', file: 'Supabase Snippet Retrieve Product Images Column Metadata (9).csv' },
    { table: 'orders', file: 'Supabase Snippet Retrieve Product Images Column Metadata (10).csv' },
    { table: 'order_items', file: 'Supabase Snippet Retrieve Product Images Column Metadata (11).csv' }
];

async function importCSV(table, filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, { 
        columns: true, 
        skip_empty_lines: true,
        cast: true
    });
    
    console.log(`Importando ${records.length} registros a ${table}...`);
    
    const { data, error } = await supabase
        .from(table)
        .insert(records);
    
    if (error) {
        console.error(`❌ Error en ${table}:`, error.message);
        return false;
    }
    
    console.log(`✅ ${table}: ${records.length} registros importados`);
    return true;
}

async function main() {
    for (const { table, file } of files) {
        await importCSV(table, file);
    }
    console.log('\n🎉 Importación completada');
}

main();
```

Ejecutar:
```bash
node importar_csv.js
```

---

## ⚙️ CONFIGURAR RLS (Row Level Security)

Después de importar los datos, configura la seguridad:

1. Ve a **Authentication** → **Policies**
2. Habilita RLS en cada tabla
3. Crea las políticas según el archivo: **`11_rls_policies.sql`**

---

## 🔄 Actualizar Variables de Entorno

Actualiza tu archivo `.env` con las credenciales del nuevo proyecto:

```env
# Frontend (.env)
VITE_SUPABASE_URL=https://coadlejoezzjvpwhbuqc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYWRsZWpvZXp6anZxd2hidXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzIxNjEsImV4cCI6MjA5MTE0ODE2MX0.Nv6IyBnl17WVXj-lTHIjdO6Tn2xX44h4IKTEHrsH7Fc

# Backend (.env)
SUPABASE_URL=https://coadlejoezzjvpwhbuqc.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYWRsZWpvZXp6anZxd2hidXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3MjE2MSwiZXhwIjoyMDkxMTQ4MTYxfQ.YDZlQEIeSmdsFLknHP-kEVQWALAtgXJPUi7Zo71dT4c
```

---

## ✅ Checklist Post-Migración

- [ ] Estructura de tablas creada
- [ ] Todos los CSVs importados
- [ ] Verificación de conteos correcta
- [ ] RLS policies configuradas
- [ ] Variables de entorno actualizadas
- [ ] Frontend conectado al nuevo proyecto
- [ ] Test: productos visibles en tienda
- [ ] Test: carrito funciona
- [ ] Test: checkout funciona
- [ ] Test: imágenes cargan correctamente

---

## 🆘 Solución de Problemas

### Error: "duplicate key value violates unique constraint"

Las tablas ya tienen datos. Limpia todo:

```sql
-- ⚠️ CUIDADO: Esto borra TODOS los datos
TRUNCATE TABLE order_items, orders, product_variants, 
    product_images, products, product_categories, 
    subcategories, banners, categories CASCADE;
```

### Error: "relation X does not exist"

No ejecutaste el script de estructura. Ve al Paso 2.

### Problemas con caracteres especiales en CSV

Si las descripciones de productos tienen problemas:

1. Abre el CSV en Excel
2. Guarda como "CSV UTF-8"
3. Re-importa

### Las imágenes no se ven

Las URLs están en Vercel Blob Storage y deberían funcionar. Si no:
- Verifica que las URLs en `product_images` sean correctas
- Comprueba la conexión a internet

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en Supabase → Logs → Postgres
2. Verifica los conteos de tablas con la consulta del Paso 4
3. Confirma que usaste el Service Role Key para importar
4. Verifica que el schema sea `public`

---

## 🎉 ¡Listo!

Después de completar esta migración, tu e-commerce debería funcionar perfectamente con el nuevo proyecto Supabase, sin errores 400 ni problemas de schema.

**Tiempo estimado:** 15-20 minutos

---

**Generado:** Migración Automática desde CSVs
**Proyecto:** Magnolia Novedades
**Fecha:** 2026
