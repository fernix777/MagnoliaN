# 📦 EXTRACCIÓN Y MIGRACIÓN SQL COMPLETA

## PASO 1: Conectar al Proyecto Viejo via SQL Editor

1. Ve a tu proyecto viejo de Supabase
2. Abre el **SQL Editor**
3. Ejecuta los siguientes queries UNO POR UNO

---

## 🔍 PASO 2: Extraer Estructura de Tablas

### Query 1: Listar todas las tablas
```sql
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Query 2: Extraer estructura de CADA tabla
Ejecuta este query para cada tabla encontrada:

```sql
-- Reemplaza 'NOMBRE_TABLA' con el nombre real
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'NOMBRE_TABLA'
ORDER BY ordinal_position;
```

### Query 3: Extraer constraints (llaves primarias, foráneas, únicas)
```sql
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name 
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;
```

### Query 4: Extraer índices
```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 📊 PASO 3: Extraer Datos de Tablas Principales

### Tabla: products
```sql
SELECT * FROM products ORDER BY id;
```

### Tabla: categories
```sql
SELECT * FROM categories ORDER BY id;
```

### Tabla: subcategories
```sql
SELECT * FROM subcategories ORDER BY id;
```

### Tabla: product_images
```sql
SELECT * FROM product_images ORDER BY id;
```

### Tabla: product_variants
```sql
SELECT * FROM product_variants ORDER BY id;
```

### Tabla: product_categories
```sql
SELECT * FROM product_categories ORDER BY product_id;
```

### Tabla: banners
```sql
SELECT * FROM banners ORDER BY id;
```

### Tabla: orders
```sql
SELECT * FROM orders ORDER BY id;
```

### Tabla: order_items
```sql
SELECT * FROM order_items ORDER BY id;
```

### Tabla: customers (si existe)
```sql
SELECT * FROM customers ORDER BY id;
```

---

## 💾 PASO 4: Exportar Resultados

Para cada query:
1. Ejecuta el query
2. Click en **Download results** (botón en la esquina superior derecha)
3. Guarda como CSV
4. Nombra el archivo con el formato: `tabla_nombre.csv`

---

## 📁 PASO 5: Enviar Archivos

Una vez extraídos todos los CSVs, envíamelos y generaré los scripts SQL para:

1. ✅ Crear las tablas en el proyecto nuevo
2. ✅ Insertar todos los datos
3. ✅ Crear constraints e índices
4. ✅ Verificar la migración

---

## 🚨 IMPORTANTE

### Si algunas tablas tienen MUCHOS datos:
Para tablas grandes (>1000 filas), usa paginación:

```sql
-- Primera página (filas 1-1000)
SELECT * FROM products 
ORDER BY id 
LIMIT 1000 OFFSET 0;

-- Segunda página (filas 1001-2000)
SELECT * FROM products 
ORDER BY id 
LIMIT 1000 OFFSET 1000;
```

### Si hay columnas con imágenes/data grande:
Los campos de tipo JSON o TEXT se exportan correctamente en CSV.

---

## 📋 Lista de Verificación

Tablas a extraer:
- [ ] products
- [ ] categories
- [ ] subcategories
- [ ] product_images
- [ ] product_variants
- [ ] product_categories
- [ ] banners
- [ ] orders
- [ ] order_items
- [ ] customers (si existe)
- [ ] Cualquier otra tabla encontrada

---

## 🆘 Alternativa: Exportar como SQL directo

Si prefieres, también puedo generar queries SQL de INSERT directamente:

```sql
-- Genera INSERT statements para products
SELECT 'INSERT INTO products (' || 
       string_agg(column_name, ', ') || 
       ') VALUES (' ||
       string_agg(
         CASE 
           WHEN data_type IN ('character varying', 'text', 'uuid', 'timestamp with time zone') 
           THEN '''' || REPLACE(CAST(NOMBRE_TABLA.COLUMN_NAME AS TEXT), '''', '''''') || ''''
           WHEN data_type = 'boolean' THEN CAST(NOMBRE_TABLA.COLUMN_NAME AS TEXT)
           WHEN data_type IN ('integer', 'bigint', 'numeric') THEN CAST(NOMBRE_TABLA.COLUMN_NAME AS TEXT)
           ELSE '''' || CAST(NOMBRE_TABLA.COLUMN_NAME AS TEXT) || ''''
         END, 
         ', '
       ) || 
       ');' as insert_statement
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'products';
```

---

## ✅ SIGUIENTE PASO

Una vez que tengas los CSVs o los resultados de los queries, envíamelos y crearé los scripts de migración completos.
