# 🧹 LIMPIEZA Y MIGRACIÓN COMPLETA

## Paso 1: Limpiar Todo (excepto usuarios)

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona el proyecto: **coadlejoezzjvpwhbuqc**
3. Ve al **SQL Editor** → **New Query**
4. Copia y pega el contenido de: **`0_limpiar_todo_excepto_auth.sql`**
5. Haz clic en **Run** (▶️)
6. Verifica que diga "LIMPIEZA COMPLETADA" y que solo `users` y `profiles` tengan datos

## Paso 2: Crear Tabla Faltante (si no existe)

Ejecuta esta consulta para crear `product_categories` (relación M:N que existe en el proyecto viejo):

```sql
-- Crear tabla de relación product_categories si no existe
CREATE TABLE IF NOT EXISTS product_categories (
    product_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    subcategory_id BIGINT,
    PRIMARY KEY (product_id, category_id),
    CONSTRAINT product_categories_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT product_categories_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    CONSTRAINT product_categories_subcategory_id_fkey 
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
);

-- Índice para optimización
CREATE INDEX IF NOT EXISTS idx_product_categories_category 
    ON product_categories(category_id);
```

## Paso 3: Importar Datos del Proyecto Viejo

### Opción A: Script Automático (Recomendado)

```bash
# En tu terminal, en la carpeta del proyecto
node importar_todos_csv.js
```

### Opción B: Manual vía UI

1. Ve al **Table Editor**
2. Importa cada CSV en orden:
   - `categories` ← Metadata (6).csv
   - `banners` ← Metadata (7).csv
   - `products` ← Metadata (5).csv
   - `product_images` ← Metadata (8).csv
   - `product_variants` ← Metadata (9).csv
   - `orders` ← Metadata (10).csv
   - `order_items` ← Metadata (11).csv

## Paso 4: Verificar Migración

```sql
-- Contar registros
SELECT 
    'categories' as tabla, count(*) as total FROM categories
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'product_images', count(*) FROM product_images
UNION ALL SELECT 'product_variants', count(*) FROM product_variants
UNION ALL SELECT 'orders', count(*) FROM orders
UNION ALL SELECT 'order_items', count(*) FROM order_items
UNION ALL SELECT 'banners', count(*) FROM banners
UNION ALL SELECT 'users', count(*) FROM users  -- Debería preservarse
ORDER BY total DESC;
```

**Resultados esperados:**
- categories: 7
- products: 456
- product_images: 260
- product_variants: 185
- orders: 0 (nuevos)
- order_items: 0 (nuevos)
- banners: 6
- users: X (preservados del proyecto nuevo)

## Paso 5: Actualizar Variables de Entorno

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://coadlejoezzjvpwhbuqc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYWRsZWpvZXp6anZxd2hidXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzIxNjEsImV4cCI6MjA5MTE0ODE2MX0.Nv6IyBnl17WVXj-lTHIjdO6Tn2xX44h4IKTEHrsH7Fc
```

### Backend (.env)
```env
SUPABASE_URL=https://coadlejoezzjvpwhbuqc.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYWRsZWpvZXp6anZxd2hidXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3MjE2MSwiZXhwIjoyMDkxMTQ4MTYxfQ.YDZlQEIeSmdsFLknHP-kEVQWALAtgXJPUi7Zo71dT4c
```

## Paso 6: Reiniciar Servidores

```bash
# Backend
cd server
npm run dev

# Frontend (nueva terminal)
cd client
npm run dev
```

## ✅ Checklist Final

- [ ] Script de limpieza ejecutado
- [ ] Solo users/profiles tienen datos
- [ ] CSVs importados exitosamente
- [ ] Conteos verificados
- [ ] Variables de entorno actualizadas
- [ ] Servidores reiniciados
- [ ] Tienda online funciona
- [ ] Productos visibles
- [ ] Imágenes cargan
- [ ] Carrito funciona

---

**¿Problemas?**
- Si `TRUNCATE` falla por FK constraints: ejecuta con `CASCADE`
- Si hay duplicados: usa `TRUNCATE ... CASCADE` primero
- Si las imágenes no cargan: verifica URLs de Vercel Blob
